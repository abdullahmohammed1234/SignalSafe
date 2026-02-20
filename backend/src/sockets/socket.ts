import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const setupSocketHandlers = (socketIO: SocketIOServer): void => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });
};

export const getIO = (): SocketIOServer | null => io;

export const emitRiskUpdate = (data: any): void => {
  if (io) {
    io.emit('risk:update', data);
  }
};

export const emitClustersUpdate = (data: any): void => {
  if (io) {
    io.emit('clusters:update', data);
  }
};

export const emitNarrativesUpdate = (data: any): void => {
  if (io) {
    io.emit('narratives:update', data);
  }
};

export const emitPredictionUpdate = (data: any): void => {
  if (io) {
    io.emit('prediction:update', data);
  }
};

export const emitBaselineUpdate = (data: any): void => {
  if (io) {
    io.emit('baseline:update', data);
  }
};

export const emitRegionalRiskUpdate = (data: any): void => {
  if (io) {
    io.emit('regionalRisk:update', data);
  }
};

export const emitNarrativeInteractionUpdate = (data: any): void => {
  if (io) {
    io.emit('narrativeInteraction:update', data);
  }
};

export const emitMutationAlert = (data: any): void => {
  if (io) {
    io.emit('mutation:alert', data);
  }
};

export const emitInterventionRecommendation = (data: any): void => {
  if (io) {
    io.emit('intervention:recommendation', data);
  }
};
