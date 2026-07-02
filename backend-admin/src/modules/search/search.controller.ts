import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('MA / Search')
@ApiBearerAuth('JWT-auth')
@Controller('ma/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Search across users, posts, communities, topics, and polls
   * @param searchQueryDto - Search query parameters
   * @param user - Current authenticated user
   * @returns Search results
   */
  @ApiOperation({
    summary: 'Search across users, posts, communities, topics, and polls',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() searchQueryDto: SearchQueryDto,
    @GetUser() user: any,
  ): Promise<SearchResponseDto> {
    return this.searchService.search(searchQueryDto, user.userId);
  }
}
