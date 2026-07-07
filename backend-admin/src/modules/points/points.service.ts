import { Injectable, Logger } from '@nestjs/common';
import { PointsReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { POINTS_VALUES, pointsSettingKey } from './points.constants';
import { PointsSummaryDto } from './dto/points-summary.dto';

export type PointsRange = 'week' | 'month' | 'all';

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Reads the admin-configurable point value for a reason from AppSetting,
   * falling back to the POINTS_VALUES default when no override has been
   * saved. AppSetting.setting_value is stored as text, so an invalid/
   * non-numeric override also falls back to the default.
   *
   * Looked up by setting_key alone (it's @unique on AppSetting) rather than
   * also filtering on setting_group — the admin dashboard's generic "create
   * setting" call doesn't always send a group, so requiring an exact group
   * match here would silently ignore a legitimately-saved override.
   */
  async getPointsValue(reason: PointsReason): Promise<number> {
    const setting = await this.prisma.appSetting.findFirst({
      where: { setting_key: pointsSettingKey(reason) },
    });
    const parsed = setting?.setting_value
      ? parseInt(setting.setting_value, 10)
      : NaN;
    return Number.isFinite(parsed) ? parsed : POINTS_VALUES[reason];
  }

  /**
   * Records a points transaction and bumps the denormalized lifetime total.
   * Never throws — a failure here should never break the content-creation
   * flow that triggered it (same philosophy as safeNotify()).
   */
  async award(
    userId: number,
    reason: PointsReason,
    relatedId?: number,
  ): Promise<void> {
    try {
      const points = await this.getPointsValue(reason);

      await this.prisma.$transaction([
        this.prisma.pointsTransaction.create({
          data: {
            user_id: userId,
            points,
            reason,
            related_id: relatedId ?? null,
          },
        }),
        this.prisma.userProfile.updateMany({
          where: { user_id: userId },
          data: { total_points: { increment: points } },
        }),
      ]);
    } catch (error:any) {
      this.logger.warn(
        `Failed to award points (${reason}) to user ${userId}: ${error.message}`,
      );
    }
  }

  async getSummary(
    userId: number,
    range: PointsRange = 'week',
  ): Promise<PointsSummaryDto> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { user_id: userId },
      select: { total_points: true },
    });

    // All date math below is done in UTC (setUTCDate/Date.UTC), not local
    // time — mixing local-time mutation with toISOString() (UTC) would shift
    // the bucketed days by the server's UTC offset and could drop "today"
    // from the series entirely.
    const now = new Date();
    let periodStart: Date | undefined;

    if (range === 'week') {
      periodStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6),
      );
    } else if (range === 'month') {
      periodStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29),
      );
    }

    const transactions = await this.prisma.pointsTransaction.findMany({
      where: {
        user_id: userId,
        ...(periodStart ? { created_at: { gte: periodStart } } : {}),
      },
      select: { points: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });

    const pointsByDay = new Map<string, number>();
    for (const tx of transactions) {
      const day = tx.created_at.toISOString().slice(0, 10);
      pointsByDay.set(day, (pointsByDay.get(day) || 0) + tx.points);
    }

    const series: { date: string; points: number }[] = [];
    if (periodStart) {
      // Fill every day in range (including zero-point days) so the chart has no gaps.
      const cursor = new Date(periodStart);
      const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      while (cursor <= today) {
        const day = cursor.toISOString().slice(0, 10);
        series.push({ date: day, points: pointsByDay.get(day) || 0 });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    } else {
      for (const [date, points] of pointsByDay.entries()) {
        series.push({ date, points });
      }
    }

    const rangeTotal = transactions.reduce((sum, tx) => sum + tx.points, 0);

    const [questions, polls, answers] = await Promise.all([
      this.prisma.userPost.count({
        where: { user_id: userId, post_type: 'question' },
      }),
      this.prisma.userPoll.count({ where: { user_id: userId } }),
      this.getAnswerCount(userId),
    ]);

    return {
      total_points: profile?.total_points || 0,
      range,
      range_total: rangeTotal,
      series,
      history: { questions, polls, answers },
    };
  }

  private async getAnswerCount(userId: number): Promise<number> {
    const [postComments, pollComments] = await Promise.all([
      this.prisma.postComment.count({ where: { user_id: userId } }),
      this.prisma.pollComment.count({ where: { user_id: userId } }),
    ]);
    return postComments + pollComments;
  }
}
