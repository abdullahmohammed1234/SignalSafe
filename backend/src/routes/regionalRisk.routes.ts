import { Router, Request, Response } from 'express';
import { 
  computeAllRegionalRisks, 
  getLatestRegionalRisks, 
  getRegionalRiskByRegion,
  getRisksByCountry,
  getRegionalRiskHistory 
} from '../services/regionalRiskEngine.service';

const router = Router();

// GET /api/risk/regions - Return all regional risks sorted by riskScore desc
router.get('/regions', async (req: Request, res: Response): Promise<void> => {
  try {
    const regionalRisks = await getLatestRegionalRisks();
    
    res.json({
      success: true,
      count: regionalRisks.length,
      data: regionalRisks,
    });
  } catch (error) {
    console.error('Error fetching regional risks:', error);
    res.status(500).json({ error: 'Failed to fetch regional risks' });
  }
});

// GET /api/risk/regions/refresh - Force recompute all regional risks
router.post('/regions/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const regionalRisks = await computeAllRegionalRisks();
    
    res.json({
      success: true,
      count: regionalRisks.length,
      data: regionalRisks,
    });
  } catch (error) {
    console.error('Error computing regional risks:', error);
    res.status(500).json({ error: 'Failed to compute regional risks' });
  }
});

// GET /api/risk/regions/:region - Get specific region risk
router.get('/regions/:region', async (req: Request, res: Response): Promise<void> => {
  try {
    const { region } = req.params;
    const decodeRegion = decodeURIComponent(region);
    
    const regionalRisk = await getRegionalRiskByRegion(decodeRegion);
    
    if (!regionalRisk) {
      res.status(404).json({ error: 'Region not found' });
      return;
    }

    res.json({
      success: true,
      data: regionalRisk,
    });
  } catch (error) {
    console.error('Error fetching regional risk:', error);
    res.status(500).json({ error: 'Failed to fetch regional risk' });
  }
});

// GET /api/risk/regions/:region/history - Get regional risk history
router.get('/regions/:region/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { region } = req.params;
    const hoursBack = parseInt(req.query.hours as string) || 24;
    const decodeRegion = decodeURIComponent(region);
    
    const history = await getRegionalRiskHistory(decodeRegion, hoursBack);
    
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching regional risk history:', error);
    res.status(500).json({ error: 'Failed to fetch regional risk history' });
  }
});

// GET /api/risk/countries/:country - Get risks by country
router.get('/countries/:country', async (req: Request, res: Response): Promise<void> => {
  try {
    const { country } = req.params;
    const decodeCountry = decodeURIComponent(country);
    
    const risks = await getRisksByCountry(decodeCountry);
    
    res.json({
      success: true,
      count: risks.length,
      data: risks,
    });
  } catch (error) {
    console.error('Error fetching country risks:', error);
    res.status(500).json({ error: 'Failed to fetch country risks' });
  }
});

export default router;
