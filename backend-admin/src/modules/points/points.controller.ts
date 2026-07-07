import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { PointsQueryDto } from './dto/points-query.dto';
import { PointsSummaryDto } from './dto/points-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('MA / Points')
@ApiBearerAuth('JWT-auth')
@Controller('ma/users/me/points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /**
   * Powers the profile screen's "Points earned" card: a lifetime total plus
   * a day-by-day breakdown for the selected range, and the History counts
   * (Questions / Polls / Answers) shown below it.
   */
  @ApiOperation({ summary: "Get current user's points summary and content history counts" })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMyPoints(
    @GetUser() user: any,
    @Query() query: PointsQueryDto,
  ): Promise<PointsSummaryDto> {
    return this.pointsService.getSummary(user.userId, query.range || 'week');
  }
}
