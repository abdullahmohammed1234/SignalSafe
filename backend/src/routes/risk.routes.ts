import { Router, Request, Response } from 'express';
import { getLatestRiskSnapshot } from '../services/riskEngine.service';
import { getRiskHistory, computeBaseline, getHistoricalBaseline } from '../services/historicalBaseline.service';

const router = Router();

router.get('/current', async (req: Request, res: Response): Promise<void> => {
  try {
    const snapshot = await getLatestRiskSnapshot();
    
    if (!snapshot) {
      res.status(404).json({ error: 'No risk snapshots found' });
      return;
    }

    res.json(snapshot);
  } catch (error) {
    console.error('Error fetching current risk:', error);
    res.status(500).json({ error: 'Failed to fetch current risk' });
  }
});

// GET /api/risk/history - Return last 50 RiskHistory entries
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await getRiskHistory(limit);
    
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching risk history:', error);
    res.status(500).json({ error: 'Failed to fetch risk history' });
  }
});

// GET /api/risk/baseline - Get current baseline
router.get('/baseline', async (req: Request, res: Response): Promise<void> => {
  try {
    const baseline = await computeBaseline();
    
    if (!baseline) {
      res.status(404).json({ error: 'Not enough data for baseline calculation' });
      return;
    }

    res.json({
      success: true,
      data: baseline,
    });
  } catch (error) {
    console.error('Error fetching baseline:', error);
    res.status(500).json({ error: 'Failed to fetch baseline' });
  }
});

// GET /api/risk/baseline/history - Get historical baseline
router.get('/baseline/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const hoursBack = parseInt(req.query.hours as string) || 24;
    const { baseline, history } = await getHistoricalBaseline(hoursBack);
    
    res.json({
      success: true,
      baseline,
      history,
    });
  } catch (error) {
    console.error('Error fetching historical baseline:', error);
    res.status(500).json({ error: 'Failed to fetch historical baseline' });
  }
});

export default router;
