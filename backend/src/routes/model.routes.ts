import { Router, Request, Response } from 'express';
import { 
  runBacktest, 
  getPerformanceHistory, 
  getLatestPerformance,
  recordAdversarialResults 
} from '../services/backtest.service';

const router = Router();

// POST /api/model/backtest - Run backtest on historical data
router.post('/backtest', async (req: Request, res: Response): Promise<void> => {
  try {
    const hoursBack = parseInt(req.query.hours as string) || 168;
    const result = await runBacktest(hoursBack);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({ error: 'Failed to run backtest' });
  }
});

// GET /api/model/performance - Get performance history
router.get('/performance', async (req: Request, res: Response): Promise<void> => {
  try {
    const testType = (req.query.type as 'backtest' | 'adversarial' | 'live' | 'all') || 'all';
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await getPerformanceHistory(testType, limit);
    
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching performance history:', error);
    res.status(500).json({ error: 'Failed to fetch performance history' });
  }
});

// GET /api/model/performance/latest - Get latest performance metrics
router.get('/performance/latest', async (req: Request, res: Response): Promise<void> => {
  try {
    const performance = await getLatestPerformance();
    
    if (!performance) {
      res.status(404).json({ error: 'No performance data found' });
      return;
    }
    
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Error fetching latest performance:', error);
    res.status(500).json({ error: 'Failed to fetch latest performance' });
  }
});

// POST /api/model/adversarial/results - Record adversarial test results
router.post('/adversarial/results', async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = req.body;
    const result = await recordAdversarialResults(metrics);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error recording adversarial results:', error);
    res.status(500).json({ error: 'Failed to record adversarial results' });
  }
});

export default router;
