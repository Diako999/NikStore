import {
  Body, Controller, Get, Param,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { IsArray, IsIn, IsString } from 'class-validator';
import { AdminService } from './admin.service';
import { DateRangeDto, LowStockDto } from './dto/date-range.dto';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard';
import { AdminGuard }      from '../../common/guards/admin.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { Public }          from '../../common/decorators/public.decorator';
import { UserRole }        from '../user/entities/user.schema';

class SetRoleDto {
  @IsIn(Object.values(UserRole))
  role: string;
}

class SetPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ─────────────────────────────────────────────────
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── Stats ─────────────────────────────────────────────────────
  @Get('stats/revenue')
  getRevenue(@Query() dto: DateRangeDto) {
    return this.adminService.getRevenue(dto);
  }

  @Get('stats/orders')
  getOrderStats() {
    return this.adminService.getOrderStats();
  }

  @Get('stats/recent-orders')
  getRecentOrders(@Query('limit') limit = 10) {
    return this.adminService.getRecentOrders(+limit);
  }

  // ── Products ──────────────────────────────────────────────────
  @Get('products/low-stock')
  getLowStock(@Query() dto: LowStockDto) {
    return this.adminService.getLowStockProducts(dto.threshold);
  }

  @Get('products/top-selling')
  getTopProducts(@Query('limit') limit = 10) {
    return this.adminService.getTopProducts(+limit);
  }

  // ── Users ─────────────────────────────────────────────────────
  @Get('users/admins')
  getAdminUsers() {
    return this.adminService.getAdminUsers();
  }

  @Patch('users/:id/role')
  @UseGuards(SuperAdminGuard)
  setUserRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.adminService.setUserRole(id, dto.role);
  }

  @Patch('users/:id/permissions')
  @UseGuards(SuperAdminGuard)
  setPermissions(@Param('id') id: string, @Body() dto: SetPermissionsDto) {
    return this.adminService.setPermissions(id, dto.permissions);
  }

  @Patch('users/:id/promote')
  @UseGuards(SuperAdminGuard)
  promoteToAdmin(@Param('id') id: string) {
    return this.adminService.promoteToAdmin(id);
  }

  @Patch('users/:id/demote')
  @UseGuards(SuperAdminGuard)
  demoteFromAdmin(@Param('id') id: string) {
    return this.adminService.demoteFromAdmin(id);
  }

  // ── Cache ─────────────────────────────────────────────────────
  @Post('cache/clear')
  clearCache() {
    return this.adminService.clearStatsCache();
  }

  @Get('cache/info')
  getCacheInfo() {
    return this.adminService.getCacheInfo();
  }

  // ── Health (Public for monitoring tools) ──────────────────────
  @Public()
  @Get('health')
  health() {
    return this.adminService.healthCheck();
  }
}
