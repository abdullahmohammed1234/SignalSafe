import { Router, Request, Response } from 'express';
import { 
  generateAllRecommendations, 
  getNarrativeRecommendation,
  getHighPriorityRecommendations 
} from '../services/interventionEngine.service';

const router = Router();

// GET /api/interventions - Get all intervention recommendations
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const recommendations = await generateAllRecommendations();
    
    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error fetching interventions:', error);
    res.status(500).json({ error: 'Failed to fetch interventions' });
  }
});

// GET /api/interventions/high-priority - Get high priority interventions
router.get('/high-priority', async (req: Request, res: Response): Promise<void> => {
  try {
    const recommendations = await getHighPriorityRecommendations();
    
    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error fetching high priority interventions:', error);
    res.status(500).json({ error: 'Failed to fetch high priority interventions' });
  }
});

// GET /api/interventions/narrative/:clusterId - Get recommendation for specific narrative
router.get('/narrative/:clusterId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clusterId } = req.params;
    const recommendation = await getNarrativeRecommendation(clusterId);
    
    if (!recommendation) {
      res.status(404).json({ error: 'No recommendation found for this narrative' });
      return;
    }
    
    res.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error('Error fetching narrative intervention:', error);
    res.status(500).json({ error: 'Failed to fetch narrative intervention' });
  }
});

export default router;
