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
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { UserDocument } from '../user/entities/user.schema';

const uid = (u: UserDocument) => u._id.toString();

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Public()
  @Get()
  getProductReviews(@Query() query: ReviewQueryDto) {
    return this.reviewService.getProductReviews(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(uid(user), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyReviews(
    @CurrentUser() user: UserDocument,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewService.getMyReviews(uid(user), +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/helpful')
  toggleHelpful(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.reviewService.toggleHelpful(uid(user), id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  adminFindAll(@Query() query: ReviewQueryDto) {
    return this.reviewService.adminFindAll(query);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto) {
    return this.reviewService.updateStatus(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
