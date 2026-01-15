// JARVIS WebSocket Client

import type {
  JarvisConfig,
  WSMessage,
  WSCommandMessage,
  WSResponseMessage,
  WSStatusMessage,
  WSStreamMessage,
  ConnectionState,
} from './types';

type MessageHandler = (message: WSMessage) => void;
type StatusHandler = (status: ConnectionState) => void;
type ErrorHandler = (error: Error) => void;
type StreamHandler = (chunk: string, done: boolean) => void;

interface WSClientOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

const DEFAULT_OPTIONS: WSClientOptions = {
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
};

class JarvisWSClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private options: WSClientOptions;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private streamHandlers: Map<string, StreamHandler> = new Map();
  private pendingRequests: Map<string, (response: WSResponseMessage) => void> = new Map();
  private connectionState: ConnectionState = 'disconnected';

  constructor(wsUrl: string = 'ws://localhost:5000/ws', options?: WSClientOptions) {
    this.wsUrl = wsUrl;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  setUrl(wsUrl: string) {
    this.wsUrl = wsUrl;
    if (this.connectionState === 'connected') {
      this.disconnect();
      this.connect();
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setConnectionState('connecting');

      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.setConnectionState('connected');
          this.startHeartbeat();
          resolve();
        };

        this.ws.onclose = (event) => {
          this.stopHeartbeat();
          this.setConnectionState('disconnected');
          
          if (!event.wasClean && this.reconnectAttempts < (this.options.maxReconnectAttempts || 5)) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (event) => {
          this.setConnectionState('error');
          const error = new Error('WebSocket error');
          this.errorHandlers.forEach(handler => handler(error));
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        this.setConnectionState('error');
        reject(error);
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    this.clearReconnect();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setConnectionState('disconnected');
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.statusHandlers.forEach(handler => handler(state));
  }

  private scheduleReconnect() {
    this.clearReconnect();
    this.reconnectAttempts++;
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.connect().catch(console.error);
    }, this.options.reconnectInterval);
  }

  private clearReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private startHeartbeat() {
    this.heartbeatTimeout = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'status',
          module: 'system',
          payload: { status: 'idle', message: 'heartbeat' },
          timestamp: new Date().toISOString(),
        });
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimeout) {
      clearInterval(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private handleMessage(message: WSMessage) {
    // Notify all message handlers
    this.messageHandlers.forEach(handler => handler(message));

    // Handle stream messages
    if (message.type === 'stream' && message.id) {
      const streamHandler = this.streamHandlers.get(message.id);
      if (streamHandler) {
        const streamMessage = message as WSStreamMessage;
        streamHandler(streamMessage.payload.chunk, streamMessage.payload.done);
        if (streamMessage.payload.done) {
          this.streamHandlers.delete(message.id);
        }
      }
    }

    // Handle response messages
    if (message.type === 'response' && message.id) {
      const pendingResolver = this.pendingRequests.get(message.id);
      if (pendingResolver) {
        pendingResolver(message as WSResponseMessage);
        this.pendingRequests.delete(message.id);
      }
    }
  }

  send(message: WSMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  sendCommand(
    module: WSCommandMessage['module'],
    payload: WSCommandMessage['payload'],
    streamHandler?: StreamHandler
  ): Promise<WSResponseMessage> {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const message: WSCommandMessage = {
        type: 'command',
        module,
        payload,
        timestamp: new Date().toISOString(),
        id,
      };

      if (streamHandler) {
        this.streamHandlers.set(id, streamHandler);
      }

      this.pendingRequests.set(id, resolve);

      // Set timeout for response
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          this.streamHandlers.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 60000);

      if (!this.send(message)) {
        this.pendingRequests.delete(id);
        this.streamHandlers.delete(id);
        reject(new Error('Failed to send message'));
      }
    });
  }

  // Event Handlers
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }
}

// Singleton instance
export const jarvisWS = new JarvisWSClient();

export { JarvisWSClient };
