import { Router, Request, Response } from 'express';
import { 
  runAdversarialSimulation, 
  getAdversarialScenarios 
} from '../services/adversarialSimulator.service';

const router = Router();

// POST /api/simulate/adversarial - Run adversarial simulation
router.post('/adversarial', async (req: Request, res: Response): Promise<void> => {
  try {
    const { scenarioType, intensity, duration } = req.body;
    
    if (!scenarioType) {
      res.status(400).json({ error: 'scenarioType is required' });
      return;
    }
    
    const scenario = {
      scenarioType: scenarioType as 'bot_burst' | 'mutation_attempt' | 'cross_region_spread' | 'coordinated_attack',
      intensity: intensity || 0.7,
      duration: duration || 30,
    };
    
    const result = await runAdversarialSimulation(scenario);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error running adversarial simulation:', error);
    res.status(500).json({ error: 'Failed to run adversarial simulation' });
  }
});

// GET /api/simulate/adversarial/scenarios - Get available scenarios
router.get('/adversarial/scenarios', async (req: Request, res: Response): Promise<void> => {
  try {
    const scenarios = getAdversarialScenarios();
    
    res.json({
      success: true,
      count: scenarios.length,
      data: scenarios,
    });
  } catch (error) {
    console.error('Error fetching adversarial scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

export default router;
