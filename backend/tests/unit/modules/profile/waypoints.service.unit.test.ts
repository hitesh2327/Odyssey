import { waypointsService } from '../../../../src/modules/profile/waypoints.service';
import { prisma } from '../../../../src/lib/prisma';
import { logger } from '../../../../src/lib/logger';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    userWaypoint: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    waypoint: {
      findUnique: jest.fn(),
    },
    assessmentSession: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('WaypointsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndUnlock', () => {
    it('should cover all 5 waypoint conditions correctly', async () => {
      // Mock user has no unlocked waypoints
      (prisma.userWaypoint.findMany as jest.Mock).mockResolvedValue([]);
      
      // Mock waypoint fetching during creation
      (prisma.waypoint.findUnique as jest.Mock).mockImplementation(({ where }) => {
        return { id: `id_${where.code}`, code: where.code };
      });

      // Set up mocks for each condition to be true
      
      // FIRST_VOYAGE (1 completed session)
      (prisma.assessmentSession.count as jest.Mock).mockResolvedValue(1);
      
      // FIRST_NAVIGATOR (1 completed single-topic session with score >= 70)
      (prisma.assessmentSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess1' });
      
      // FULL_FLEET (5 unique topics)
      (prisma.assessmentSession.findMany as jest.Mock).mockResolvedValue([
        { topicId: 't1' }, { topicId: 't2' }, { topicId: 't3' }, { topicId: 't4' }, { topicId: 't5' }
      ]);
      
      // STEADY_HAND (streak >= 3) AND PROFILE_COMPLETE
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
        streakDays: 3,
        role: 'Dev',
        bio: 'Hello',
        homePort: 'NYC',
        experienceLevel: 'ADVANCED'
      });

      await waypointsService.checkAndUnlock('user1');

      // Assert all 5 were created
      expect(prisma.userWaypoint.create).toHaveBeenCalledTimes(5);
      const createdCalls = (prisma.userWaypoint.create as jest.Mock).mock.calls;
      const createdWaypointIds = createdCalls.map(call => call[0].data.waypointId);

      expect(createdWaypointIds).toContain('id_FIRST_VOYAGE');
      expect(createdWaypointIds).toContain('id_FIRST_NAVIGATOR');
      expect(createdWaypointIds).toContain('id_STEADY_HAND');
      expect(createdWaypointIds).toContain('id_FULL_FLEET');
      expect(createdWaypointIds).toContain('id_PROFILE_COMPLETE');

      expect(logger.info).toHaveBeenCalledTimes(5);
    });

    it('should not unlock if condition is false', async () => {
      (prisma.userWaypoint.findMany as jest.Mock).mockResolvedValue([]);
      
      // FIRST_VOYAGE: 0 sessions
      (prisma.assessmentSession.count as jest.Mock).mockResolvedValue(0);
      
      // FIRST_NAVIGATOR: no session >= 70
      (prisma.assessmentSession.findFirst as jest.Mock).mockResolvedValue(null);
      
      // FULL_FLEET: only 4 topics
      (prisma.assessmentSession.findMany as jest.Mock).mockResolvedValue([
        { topicId: 't1' }, { topicId: 't2' }, { topicId: 't3' }, { topicId: 't4' }
      ]);
      
      // STEADY_HAND: streak = 2, PROFILE_COMPLETE: missing bio
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
        streakDays: 2,
        role: 'Dev',
        bio: null, // missing
        homePort: 'NYC',
        experienceLevel: 'ADVANCED'
      });

      await waypointsService.checkAndUnlock('user2');

      expect(prisma.userWaypoint.create).not.toHaveBeenCalled();
    });

    it('should not unlock already unlocked waypoints', async () => {
      // Mock user already has FIRST_VOYAGE
      (prisma.userWaypoint.findMany as jest.Mock).mockResolvedValue([
        { waypoint: { code: 'FIRST_VOYAGE' } }
      ]);

      // Even if condition is met, it shouldn't unlock again
      (prisma.assessmentSession.count as jest.Mock).mockResolvedValue(5);
      
      // Make other conditions false so we can focus on FIRST_VOYAGE
      (prisma.assessmentSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.assessmentSession.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue(null);

      await waypointsService.checkAndUnlock('user3');

      // FIRST_VOYAGE should NOT be created again
      expect(prisma.userWaypoint.create).not.toHaveBeenCalled();
    });
  });
});
