import { api } from '../../helpers/request.helper';

describe('Health Module', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 and system status', async () => {
      const res = await api.get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBeDefined();
    });
  });
});
