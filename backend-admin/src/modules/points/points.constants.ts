import { PointsReason } from '@prisma/client';

/**
 * Default points awarded per contribution type — used as a fallback when no
 * admin override exists in AppSetting (group: 'points', see POINTS_SETTING_GROUP
 * and pointsSettingKey() below). Admins can change these live from the
 * dashboard's App Settings page without a deploy.
 *
 * Kept deliberately simple (Q&A-style reputation, weighted toward answering
 * since that's this app's core value) and limited to finalized creation
 * actions only — no points for likes/votes, to avoid like/unlike farming.
 */
export const POINTS_VALUES: Record<PointsReason, number> = {
  question_created: 5,
  poll_created: 5,
  answer_created: 10,
};

/** AppSetting.setting_group used for the admin-configurable point values. */
export const POINTS_SETTING_GROUP = 'points';

/** AppSetting.setting_key for a given reason, e.g. 'points_question_created'. */
export function pointsSettingKey(reason: PointsReason): string {
  return `points_${reason}`;
}
