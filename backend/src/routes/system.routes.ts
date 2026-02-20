import { Router, Request, Response } from 'express';
import { getSystemHealth } from '../services/systemHealth.service';

const router = Router();

// GET /api/system/health - Comprehensive system health check
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await getSystemHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: 'Failed to fetch system health' 
    });
  }
});

export default router;
