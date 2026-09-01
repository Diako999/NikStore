import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AdminBroadcastDto } from './dto/admin-broadcast.dto';
import { AdminSmsDto } from './dto/admin-sms.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserDocument } from '../user/entities/user.schema';

const uid = (u: UserDocument) => u._id.toString();

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  // ── User ──────────────────────────────────────────────────────
  @Get()
  getMyNotifications(
    @CurrentUser() user: UserDocument,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notifService.getUserNotifications(uid(user), query);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: UserDocument) {
    return this.notifService.getUnreadCount(uid(user));
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.notifService.markRead(uid(user), id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: UserDocument) {
    return this.notifService.markAllRead(uid(user));
  }

  // ── Admin ─────────────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Post('admin/broadcast')
  broadcast(@Body() dto: AdminBroadcastDto) {
    return this.notifService.adminBroadcast(dto);
  }

  @UseGuards(AdminGuard)
  @Post('admin/sms')
  sendSms(@Body() dto: AdminSmsDto) {
    return this.notifService.adminSendSms(dto);
  }

  @UseGuards(AdminGuard)
  @Get('admin/broadcast-logs')
  getBroadcastLogs(@Query() query: NotificationQueryDto) {
    return this.notifService.adminListBroadcastLogs(query);
  }

  @UseGuards(AdminGuard)
  @Get('admin/sms-logs')
  getSmsLogs(@Query() query: NotificationQueryDto) {
    return this.notifService.adminListSmsLogs(query);
  }

  @UseGuards(AdminGuard)
  @Delete('admin/broadcast-log/:id')
  deleteBroadcastLog(@Param('id') id: string) {
    return this.notifService.adminDeleteBroadcastLog(id);
  }

  @UseGuards(AdminGuard)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.notifService.adminDelete(id);
  }
}
