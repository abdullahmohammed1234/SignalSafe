import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from './config/db';
import { setupSocketHandlers } from './sockets/socket';
import { startQueueProcessor } from './services/queue.service';

// Routes
import ingestRoutes from './routes/ingest.routes';
import riskRoutes from './routes/risk.routes';
import clusterRoutes from './routes/cluster.routes';
import simulateRoutes from './routes/simulate.routes';
import narrativeRoutes from './routes/narrative.routes';
import regionalRiskRoutes from './routes/regionalRisk.routes';
import interactionRoutes from './routes/interaction.routes';
import modelRoutes from './routes/model.routes';
import interventionRoutes from './routes/intervention.routes';
import adversarialRoutes from './routes/adversarial.routes';
import systemRoutes from './routes/system.routes';
import phase4Routes from './routes/phase4.routes';
import replayRoutes from './routes/replay.routes';

// Import models to ensure they're registered
import './models/Post';
import './models/Cluster';
import './models/RiskSnapshot';
import './models/Narrative';
import './models/RiskHistory';
import './models/RegionalRisk';
import './models/NarrativeInteraction';
import './models/ModelPerformance';

const app = express();
const httpServer = createServer(app);

// Create single Socket.IO instance
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Setup socket handlers
setupSocketHandlers(io);

// API Routes
app.use('/api/ingest', ingestRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/risk', regionalRiskRoutes);
app.use('/api/clusters', clusterRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/simulate', adversarialRoutes);
app.use('/api/narratives', narrativeRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/phase4', phase4Routes);
app.use('/api/replay', replayRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3002;

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start queue processor
    startQueueProcessor();
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 SignalSafe Backend running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
