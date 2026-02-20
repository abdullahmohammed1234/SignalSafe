import { Router, Request, Response } from 'express';
import { getActiveClusters } from '../services/riskEngine.service';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clusters = await getActiveClusters();
    res.json(clusters);
  } catch (error) {
    console.error('Error fetching clusters:', error);
    res.status(500).json({ error: 'Failed to fetch clusters' });
  }
});

export default router;
