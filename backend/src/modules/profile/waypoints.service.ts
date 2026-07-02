import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export class WaypointsService {
  public async checkAndUnlock(userId: string): Promise<void> {
    try {
      const existingWaypoints = await prisma.userWaypoint.findMany({
        where: { userId },
        select: { waypoint: { select: { code: true } } },
      });
      const unlockedCodes = new Set(existingWaypoints.map((w) => w.waypoint.code));

      const conditionsToEvaluate = [
        { code: 'FIRST_VOYAGE', evaluate: () => this.checkFirstVoyage(userId) },
        { code: 'FIRST_NAVIGATOR', evaluate: () => this.checkFirstNavigator(userId) },
        { code: 'STEADY_HAND', evaluate: () => this.checkSteadyHand(userId) },
        { code: 'FULL_FLEET', evaluate: () => this.checkFullFleet(userId) },
        { code: 'PROFILE_COMPLETE', evaluate: () => this.checkProfileComplete(userId) },
      ];

      for (const condition of conditionsToEvaluate) {
        if (!unlockedCodes.has(condition.code)) {
          const isMet = await condition.evaluate();
          if (isMet) {
            const waypoint = await prisma.waypoint.findUnique({ where: { code: condition.code } });
            if (waypoint) {
              await prisma.userWaypoint.create({
                data: {
                  userId,
                  waypointId: waypoint.id,
                },
              });
              logger.info(`[WAYPOINT_UNLOCKED] User ${userId} unlocked ${condition.code}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`[WAYPOINT_ERROR] Failed to evaluate waypoints for user ${userId}`, error);
    }
  }

  private async checkFirstVoyage(userId: string): Promise<boolean> {
    const count = await prisma.assessmentSession.count({
      where: { userId, status: 'COMPLETED' },
    });
    return count >= 1;
  }

  private async checkFirstNavigator(userId: string): Promise<boolean> {
    const session = await prisma.assessmentSession.findFirst({
      where: { userId, status: 'COMPLETED', assessmentType: 'SINGLE_TOPIC', score: { gte: 70 } },
    });
    return !!session;
  }

  private async checkSteadyHand(userId: string): Promise<boolean> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { streakDays: true },
    });
    return (profile?.streakDays || 0) >= 3;
  }

  private async checkFullFleet(userId: string): Promise<boolean> {
    const sessions = await prisma.assessmentSession.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { topicId: true },
    });
    const uniqueTopics = new Set(sessions.map((s) => s.topicId));
    return uniqueTopics.size >= 5;
  }

  private async checkProfileComplete(userId: string): Promise<boolean> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) return false;
    return !!(profile.role && profile.bio && profile.homePort && profile.experienceLevel);
  }
}

export const waypointsService = new WaypointsService();
