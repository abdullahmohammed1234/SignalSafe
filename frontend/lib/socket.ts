import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

class SocketClient {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to SignalSafe backend');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from SignalSafe backend');
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  onRiskUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('risk:update', callback);
    }
  }

  onClustersUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('clusters:update', callback);
    }
  }

  onNarrativesUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('narratives:update', callback);
    }
  }

  onPredictionUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('prediction:update', callback);
    }
  }

  onBaselineUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('baseline:update', callback);
    }
  }

  offRiskUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('risk:update', callback);
    }
  }

  offClustersUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('clusters:update', callback);
    }
  }

  offNarrativesUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('narratives:update', callback);
    }
  }

  offPredictionUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('prediction:update', callback);
    }
  }

  offBaselineUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('baseline:update', callback);
    }
  }

  // Phase 3 Socket Events
  onRegionalRiskUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('regionalRisk:update', callback);
    }
  }

  onNarrativeInteractionUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('narrativeInteraction:update', callback);
    }
  }

  onMutationAlert(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('mutation:alert', callback);
    }
  }

  onInterventionRecommendation(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('intervention:recommendation', callback);
    }
  }

  offRegionalRiskUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('regionalRisk:update', callback);
    }
  }

  offNarrativeInteractionUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('narrativeInteraction:update', callback);
    }
  }

  offMutationAlert(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('mutation:alert', callback);
    }
  }

  offInterventionRecommendation(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('intervention:recommendation', callback);
    }
  }
}

export const socketClient = new SocketClient();
