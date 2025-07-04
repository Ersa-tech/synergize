import { SSEMessage, SSEMessageType, CollaborationPhase, ModelConfig } from '@/types';
import { useCollaborationStore } from '@/store/collaborationStore';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SSEService');

export class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  connect(sessionId: string, onMessage: (message: SSEMessage) => void): void {
    if (this.eventSource) {
      this.disconnect();
    }

    const url = `/api/synergize/stream/${sessionId}`;
    logger.info('Connecting to:', url);
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = (): void => {
      logger.info('SSE connection established');
      this.reconnectAttempts = 0;
      useCollaborationStore.getState().setConnected(true);
    };

    this.eventSource.onmessage = (event): void => {
      logger.debug('Message received:', event.data);
      try {
        const message: SSEMessage = JSON.parse(event.data);
        this.handleMessage(message);
        onMessage(message);
      } catch (error) {
        logger.error('Failed to parse SSE message:', error);
      }
    };

    this.eventSource.onerror = (error): void => {
      logger.error('SSE error occurred:', error);
      useCollaborationStore.getState().setConnected(false);
      
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        logger.info('Connection closed, attempting reconnect...');
        this.handleReconnect(sessionId, onMessage);
      }
    };
  }

  private handleMessage(message: SSEMessage): void {
    const store = useCollaborationStore.getState();

    switch (message.type) {
    case SSEMessageType.CONNECTION:
      store.setConnected(true);
      break;

    case SSEMessageType.PHASE_UPDATE:
      store.setPhase(message.payload.phase as CollaborationPhase);
      // Handle status messages for verification and other phase updates
      if (message.payload.message) {
        store.setStatusMessage(message.payload.message as string);
        // Clear status message after 10 seconds
        setTimeout(() => {
          store.setStatusMessage(null);
        }, 10000);
      } else {
        // Clear status message if phase changes without a message
        store.setStatusMessage(null);
      }
      break;

    case SSEMessageType.MODEL_STATUS:
      if (message.payload.models) {
        store.setModels(message.payload.models as ModelConfig[]);
      }
      break;

    case SSEMessageType.ERROR:
      store.setError(message.payload.error as string | null);
      break;

    case SSEMessageType.COLLABORATION_COMPLETE:
      store.setStreaming(false);
      store.setPhase((message.payload.phase as CollaborationPhase) || CollaborationPhase.COMPLETE);
      break;
    }
  }

  private handleReconnect(sessionId: string, onMessage: (message: SSEMessage) => void): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      useCollaborationStore.getState().setError('Connection lost. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    // Reconnecting after delay
    
    setTimeout(() => {
      this.connect(sessionId, onMessage);
    }, delay);
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      useCollaborationStore.getState().setConnected(false);
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}