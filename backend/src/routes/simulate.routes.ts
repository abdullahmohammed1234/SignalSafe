import { Router, Request, Response } from 'express';
import { startSimulator, stopSimulator, getSimulatorStatus, triggerPanicEvent } from '../services/simulator.service';

const router = Router();

router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    await startSimulator();
    const status = getSimulatorStatus();
    res.json({ message: 'Simulator started', ...status });
  } catch (error) {
    console.error('Error starting simulator:', error);
    res.status(500).json({ error: 'Failed to start simulator' });
  }
});

router.post('/stop', async (req: Request, res: Response): Promise<void> => {
  try {
    await stopSimulator();
    const status = getSimulatorStatus();
    res.json({ message: 'Simulator stopped', ...status });
  } catch (error) {
    console.error('Error stopping simulator:', error);
    res.status(500).json({ error: 'Failed to stop simulator' });
  }
});

router.get('/status', (req: Request, res: Response): void => {
  const status = getSimulatorStatus();
  res.json(status);
});

// POST /api/simulate/panic-event - Trigger high-intensity simulated narrative spike
router.post('/panic-event', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await triggerPanicEvent();
    res.json({
      success: true,
      message: 'Panic event triggered',
      ...result,
    });
  } catch (error) {
    console.error('Error triggering panic event:', error);
    res.status(500).json({ error: 'Failed to trigger panic event' });
  }
});

export default router;
