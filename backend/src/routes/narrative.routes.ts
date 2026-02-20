import express, { Request, Response } from 'express';
import {
  getAllNarratives,
  getNarrativeById,
  processAllClustersLifecycle,
} from '../services/lifecycleEngine.service';
import { predictClusterPeak, predictRiskTrajectory } from '../services/predictionEngine.service';
import { calculateConfidence } from '../services/confidenceEngine.service';

const router = express.Router();

// GET /api/narratives - Return all narratives sorted by growthVelocity desc
router.get('/', async (req: Request, res: Response) => {
  try {
    const narratives = await getAllNarratives();
    res.json({
      success: true,
      count: narratives.length,
      data: narratives,
    });
  } catch (error) {
    console.error('Error fetching narratives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch narratives',
    });
  }
});

// GET /api/narratives/:id - Return full lifecycle + prediction + confidence
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get narrative
    const narrative = await getNarrativeById(id);
    if (!narrative) {
      return res.status(404).json({
        success: false,
        error: 'Narrative not found',
      });
    }

    // Get prediction
    const prediction = await predictClusterPeak(id);

    // Get confidence
    const confidence = await calculateConfidence(id);

    // Get risk trajectory
    const trajectory = await predictRiskTrajectory(3);

    res.json({
      success: true,
      data: {
        narrative,
        prediction,
        confidence,
        trajectory,
      },
    });
  } catch (error) {
    console.error('Error fetching narrative:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch narrative details',
    });
  }
});

// POST /api/narratives/refresh - Force refresh all narratives
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const updates = await processAllClustersLifecycle();
    res.json({
      success: true,
      count: updates.length,
      data: updates,
    });
  } catch (error) {
    console.error('Error refreshing narratives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh narratives',
    });
  }
});

export default router;
