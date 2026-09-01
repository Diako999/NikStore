import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchSuggestDto } from './dto/search-suggest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { UserDocument } from '../user/entities/user.schema';

type RequestWithOptionalUser = Request & { user?: { sub?: string } };

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ── Public ─────────────────────────────────────────────────
  @Public()
  @Get()
  async search(
    @Query() dto: SearchQueryDto,
    @Req() req: RequestWithOptionalUser,
  ) {
    const result = await this.searchService.search(dto);
    const userId = req?.user?.sub;
    if (dto.q?.trim() && userId) {
      this.searchService.saveHistory(userId, dto.q.trim()).catch(() => {});
    }
    return result;
  }

  @Public()
  @Get('suggest')
  suggest(@Query() dto: SearchSuggestDto) {
    return this.searchService.suggest(dto.q);
  }

  // ── Auth (history) ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(@CurrentUser() user: UserDocument) {
    return this.searchService.getHistory(user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Delete('history')
  clearHistory(@CurrentUser() user: UserDocument) {
    return this.searchService.clearHistory(user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Delete('history/:term')
  removeHistoryItem(
    @CurrentUser() user: UserDocument,
    @Param('term') term: string,
  ) {
    return this.searchService.removeHistoryItem(user._id.toString(), term);
  }
}
