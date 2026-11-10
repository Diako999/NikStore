import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  /** SHA-256 (hex) of the full refresh JWT — indexed for O(1) lookup, never the raw token. */
  @Prop({ required: true, index: true }) token: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: false }) isRevoked: boolean;
  /** When the token was revoked (audit only). */
  @Prop({ type: Date, default: null }) revokedAt?: Date | null;
  /**
   * Set ONLY when a refresh rotated this token. A rotated token may be exchanged once
   * more for a few seconds (two tabs refreshing together). Logout / logout-all /
   * password change never set it, so those tokens are rejected immediately.
   */
  @Prop({ type: Date, default: null }) rotatedAt?: Date | null;
  @Prop() userAgent?: string;
  @Prop() ip?: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
