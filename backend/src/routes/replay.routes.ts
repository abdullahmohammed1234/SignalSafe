import { Router, Request, Response } from 'express';
import { 
  getReplayEvents, 
  getReplayEvent, 
  startReplay,
  getReplayState,
  stepForward,
  stepBackward,
  jumpToStep,
  togglePlayPause,
  setReplaySpeed,
  stopReplay,
  getReplayTimeline,
  getInterventionImpact,
  createSimulatedReplay,
  initializeReplayData
} from '../services/scenarioReplay.service';

const router = Router();

// Initialize replay data on first request
router.get('/init', async (req: Request, res: Response): Promise<void> => {
  try {
    await initializeReplayData();
    res.json({
      success: true,
      message: 'Replay data initialized',
    });
  } catch (error) {
    console.error('Error initializing replay data:', error);
    res.status(500).json({ error: 'Failed to initialize replay data' });
  }
});

// GET /api/replay - Get all available replay events
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await getReplayEvents();
    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Error getting replay events:', error);
    res.status(500).json({ error: 'Failed to get replay events' });
  }
});

// GET /api/replay/:eventId - Get specific replay event
router.get('/:eventId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const event = await getReplayEvent(eventId);
    
    if (!event) {
      res.status(404).json({ error: 'Replay event not found' });
      return;
    }
    
    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error getting replay event:', error);
    res.status(500).json({ error: 'Failed to get replay event' });
  }
});

// POST /api/replay/:eventId/start - Start a replay session
router.post('/:eventId/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const speed = parseFloat(req.query.speed as string) || 1;
    
    const state = await startReplay(eventId, speed);
    
    if (!state) {
      res.status(404).json({ error: 'Replay event not found' });
      return;
    }
    
    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Error starting replay:', error);
    res.status(500).json({ error: 'Failed to start replay' });
  }
});

// GET /api/replay/:eventId/state - Get current replay state
router.get('/:eventId/state', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const state = getReplayState(eventId);
    
    if (!state) {
      res.status(404).json({ error: 'No active replay session' });
      return;
    }
    
    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Error getting replay state:', error);
    res.status(500).json({ error: 'Failed to get replay state' });
  }
});

// POST /api/replay/:eventId/step/forward - Step forward
router.post('/:eventId/step/forward', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const snapshot = stepForward(eventId);
    
    if (!snapshot) {
      res.status(400).json({ error: 'Cannot step forward' });
      return;
    }
    
    res.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error stepping forward:', error);
    res.status(500).json({ error: 'Failed to step forward' });
  }
});

// POST /api/replay/:eventId/step/backward - Step backward
router.post('/:eventId/step/backward', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const snapshot = stepBackward(eventId);
    
    if (!snapshot) {
      res.status(400).json({ error: 'Cannot step backward' });
      return;
    }
    
    res.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error stepping backward:', error);
    res.status(500).json({ error: 'Failed to step backward' });
  }
});

// POST /api/replay/:eventId/jump/:step - Jump to specific step
router.post('/:eventId/jump/:step', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, step } = req.params;
    const stepNum = parseInt(step);
    
    if (isNaN(stepNum)) {
      res.status(400).json({ error: 'Invalid step number' });
      return;
    }
    
    const snapshot = jumpToStep(eventId, stepNum);
    
    if (!snapshot) {
      res.status(400).json({ error: 'Invalid step number' });
      return;
    }
    
    res.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error jumping to step:', error);
    res.status(500).json({ error: 'Failed to jump to step' });
  }
});

// POST /api/replay/:eventId/play - Toggle play/pause
router.post('/:eventId/play', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const isPlaying = togglePlayPause(eventId);
    
    if (isPlaying === null) {
      res.status(404).json({ error: 'No active replay session' });
      return;
    }
    
    res.json({
      success: true,
      data: { isPlaying },
    });
  } catch (error) {
    console.error('Error toggling play/pause:', error);
    res.status(500).json({ error: 'Failed to toggle play/pause' });
  }
});

// POST /api/replay/:eventId/speed - Set replay speed
router.post('/:eventId/speed', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const speed = parseFloat(req.body.speed as string) || 1;
    
    const success = setReplaySpeed(eventId, speed);
    
    if (!success) {
      res.status(404).json({ error: 'No active replay session' });
      return;
    }
    
    res.json({
      success: true,
      data: { speed },
    });
  } catch (error) {
    console.error('Error setting speed:', error);
    res.status(500).json({ error: 'Failed to set speed' });
  }
});

// POST /api/replay/:eventId/stop - Stop replay
router.post('/:eventId/stop', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const success = stopReplay(eventId);
    
    if (!success) {
      res.status(404).json({ error: 'No active replay session' });
      return;
    }
    
    res.json({
      success: true,
      message: 'Replay stopped',
    });
  } catch (error) {
    console.error('Error stopping replay:', error);
    res.status(500).json({ error: 'Failed to stop replay' });
  }
});

// GET /api/replay/:eventId/timeline - Get replay timeline
router.get('/:eventId/timeline', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const timeline = await getReplayTimeline(eventId);
    
    if (!timeline) {
      res.status(404).json({ error: 'Replay event not found' });
      return;
    }
    
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error('Error getting timeline:', error);
    res.status(500).json({ error: 'Failed to get timeline' });
  }
});

// GET /api/replay/:eventId/intervention - Get intervention impact
router.get('/:eventId/intervention', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const impact = await getInterventionImpact(eventId);
    
    if (!impact) {
      res.status(404).json({ error: 'Replay event not found' });
      return;
    }
    
    res.json({
      success: true,
      data: impact,
    });
  } catch (error) {
    console.error('Error getting intervention impact:', error);
    res.status(500).json({ error: 'Failed to get intervention impact' });
  }
});

// POST /api/replay/simulate - Create simulated replay
router.post('/simulate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    
    const event = await createSimulatedReplay(name);
    
    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error creating simulated replay:', error);
    res.status(500).json({ error: 'Failed to create simulated replay' });
  }
});

export default router;
