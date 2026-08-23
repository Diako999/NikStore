import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger }         from '@nestjs/common';
import { ConfigService }  from '@nestjs/config';
import { JwtService }     from '@nestjs/jwt';
import { InjectModel }    from '@nestjs/mongoose';
import { Model }          from 'mongoose';
import { User, UserDocument } from '../../modules/user/entities/user.schema';

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = (process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`WebSocket CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger  = new Logger(NotificationsGateway.name);
  private allowedOrigins: string[];

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    this.allowedOrigins = this.configService.get<string[]>('app.allowedOrigins') ?? [];
  }

  afterInit() {
    this.logger.log(`WebSocket Gateway /notifications initialized (allowed origins: ${this.allowedOrigins.join(', ')})`);
  }

  async handleConnection(client: Socket) {
    const origin = client.handshake.headers?.origin as string | undefined;
    if (origin && !this.allowedOrigins.includes(origin)) {
      this.logger.warn(`WS connection rejected — origin not allowed: ${origin}`);
      client.disconnect();
      return;
    }
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization ?? '').replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token) as { sub: string };

      const user = await this.userModel
        .findById(payload.sub)
        .select('isAdmin role')
        .lean<UserDocument>();

      if (!user) { client.disconnect(); return; }

      if (user.isAdmin || user.role === 'manager') {
        client.join('admins');
        client.data.userId  = payload.sub;
        client.data.isAdmin = true;
        this.logger.log(`Admin WS connected: ${client.id}`);
      } else {
        // Regular users join a per-user room (targeted) AND the broadcast room (all-users).
        const room = `user:${payload.sub}`;
        client.join(room);
        client.join('broadcast');
        client.data.userId  = payload.sub;
        client.data.role    = user.role;
        client.data.isAdmin = false;
        this.logger.log(`User WS connected: ${client.id} → room ${room}, broadcast`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client WS disconnected: ${client.id}`);
  }

  emitNewOrder(payload: {
    orderId:      string;
    orderNumber:  string;
    total:        number;
    customerName: string;
    createdAt:    string;
  }) {
    this.server.to('admins').emit('new_order', payload);
    this.logger.log(`Emitted new_order: ${payload.orderNumber}`);
  }

  emitNewReview(payload: {
    reviewId:    string;
    productName: string;
    rating:      number;
    userName:    string;
    createdAt:   string;
  }) {
    this.server.to('admins').emit('new_review', payload);
    this.logger.log(`Emitted new_review for: ${payload.productName}`);
  }

  emitToUser(userId: string, payload: {
    _id:       string;
    type:      string;
    title:     string;
    body:      string;
    data:      Record<string, any> | null;
    isRead:    boolean;
    createdAt: Date;
  }) {
    this.server.to(`user:${userId}`).emit('notification', payload);
    this.logger.debug(`Emitted notification to user:${userId} — ${payload.title}`);
  }

  // Emits a single real-time event to ALL connected regular users (broadcast room).
  // Called after adminBroadcast insertMany so clients see the toast without polling.
  emitBroadcast(payload: {
    type:      string;
    title:     string;
    body:      string;
    data:      Record<string, any> | null;
    createdAt: string;
  }) {
    const event = {
      // Use a synthetic ID — client uses it for display only; real IDs are in DB.
      _id:       `broadcast:${Date.now()}`,
      isRead:    false,
      ...payload,
    };
    this.server.to('broadcast').emit('notification', event);
    this.logger.log(`emitBroadcast → broadcast room: "${payload.title}"`);
  }
}
