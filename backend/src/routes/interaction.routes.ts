import { Router, Request, Response } from 'express';
import { 
  detectNarrativeInteractions, 
  getActiveInteractions, 
  getInteractionsForNarrative 
} from '../services/interactionEngine.service';

const router = Router();

// GET /api/interactions - Get all active narrative interactions
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const interactions = await getActiveInteractions();
    
    res.json({
      success: true,
      count: interactions.length,
      data: interactions,
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

// POST /api/interactions/detect - Force detect new interactions
router.post('/detect', async (req: Request, res: Response): Promise<void> => {
  try {
    const interactions = await detectNarrativeInteractions();
    
    res.json({
      success: true,
      count: interactions.length,
      data: interactions,
    });
  } catch (error) {
    console.error('Error detecting interactions:', error);
    res.status(500).json({ error: 'Failed to detect interactions' });
  }
});

// GET /api/interactions/narrative/:clusterId - Get interactions for a specific narrative
router.get('/narrative/:clusterId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clusterId } = req.params;
    const interactions = await getInteractionsForNarrative(clusterId);
    
    res.json({
      success: true,
      count: interactions.length,
      data: interactions,
    });
  } catch (error) {
    console.error('Error fetching narrative interactions:', error);
    res.status(500).json({ error: 'Failed to fetch narrative interactions' });
  }
});

export default router;
