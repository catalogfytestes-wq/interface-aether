// JARVIS Integration Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { jarvisAPI, JarvisAPIClient } from '@/lib/jarvis/apiClient';
import { jarvisWS, JarvisWSClient } from '@/lib/jarvis/wsClient';
import type {
  JarvisConfig,
  JarvisState,
  ConnectionState,
  VisionResponse,
  ActionResponse,
  PlannerResponse,
  AgentResponse,
  WSMessage,
  WSResponseMessage,
} from '@/lib/jarvis/types';

interface UseJarvisOptions {
  autoConnect?: boolean;
  config?: Partial<JarvisConfig>;
  onMessage?: (message: WSMessage) => void;
  onStatusChange?: (status: ConnectionState) => void;
  onError?: (error: Error) => void;
}

interface UseJarvisReturn {
  // State
  state: JarvisState;
  isConnected: boolean;
  isProcessing: boolean;

  // Connection
  connect: () => Promise<void>;
  disconnect: () => void;
  setConfig: (config: Partial<JarvisConfig>) => void;

  // Vision
  captureScreen: () => Promise<VisionResponse>;
  analyzeImage: (imageBase64: string, query?: string) => Promise<VisionResponse>;
  findElement: (query: string) => Promise<VisionResponse>;
  performOCR: () => Promise<VisionResponse>;

  // Actions
  click: (x: number, y: number) => Promise<ActionResponse>;
  typeText: (text: string) => Promise<ActionResponse>;
  scroll: (direction: 'up' | 'down' | 'left' | 'right', amount?: number) => Promise<ActionResponse>;
  hotkey: (keys: string[]) => Promise<ActionResponse>;
  moveMouse: (x: number, y: number) => Promise<ActionResponse>;
  drag: (startX: number, startY: number, endX: number, endY: number) => Promise<ActionResponse>;

  // Planner
  createPlan: (goal: string) => Promise<PlannerResponse>;

  // Agent
  executeCommand: (command: string, mode?: 'auto' | 'confirm' | 'plan_only') => Promise<AgentResponse>;
  chat: (message: string) => Promise<AgentResponse>;

  // WebSocket
  sendWSCommand: (
    module: 'vision' | 'actions' | 'planner' | 'agent',
    payload: unknown,
    onStream?: (chunk: string, done: boolean) => void
  ) => Promise<WSResponseMessage>;
}

export function useJarvis(options: UseJarvisOptions = {}): UseJarvisReturn {
  const { autoConnect = false, config, onMessage, onStatusChange, onError } = options;

  const [state, setState] = useState<JarvisState>({
    connectionState: 'disconnected',
    isProcessing: false,
    currentModule: null,
    lastError: null,
    lastResponse: null,
  });

  const conversationHistory = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Apply config on mount
  useEffect(() => {
    if (config) {
      jarvisAPI.setConfig(config);
      if (config.wsUrl) {
        jarvisWS.setUrl(config.wsUrl);
      }
    }
  }, [config]);

  // Setup WebSocket event handlers
  useEffect(() => {
    const unsubMessage = jarvisWS.onMessage((message) => {
      setState(prev => ({ ...prev, lastResponse: message as WSResponseMessage }));
      onMessage?.(message);
    });

    const unsubStatus = jarvisWS.onStatus((status) => {
      setState(prev => ({ ...prev, connectionState: status }));
      onStatusChange?.(status);
    });

    const unsubError = jarvisWS.onError((error) => {
      setState(prev => ({ ...prev, lastError: error.message }));
      onError?.(error);
    });

    return () => {
      unsubMessage();
      unsubStatus();
      unsubError();
    };
  }, [onMessage, onStatusChange, onError]);

  // Auto-connect
  useEffect(() => {
    if (autoConnect) {
      jarvisWS.connect().catch(console.error);
    }

    return () => {
      if (autoConnect) {
        jarvisWS.disconnect();
      }
    };
  }, [autoConnect]);

  // Helper to wrap API calls with processing state
  const withProcessing = useCallback(
    async <T,>(module: JarvisState['currentModule'], fn: () => Promise<T>): Promise<T> => {
      setState(prev => ({ ...prev, isProcessing: true, currentModule: module, lastError: null }));
      try {
        const result = await fn();
        setState(prev => ({ ...prev, isProcessing: false, currentModule: null }));
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          currentModule: null, 
          lastError: errorMessage 
        }));
        throw error;
      }
    },
    []
  );

  // Connection
  const connect = useCallback(async () => {
    await jarvisWS.connect();
  }, []);

  const disconnect = useCallback(() => {
    jarvisWS.disconnect();
  }, []);

  const setConfig = useCallback((newConfig: Partial<JarvisConfig>) => {
    jarvisAPI.setConfig(newConfig);
    if (newConfig.wsUrl) {
      jarvisWS.setUrl(newConfig.wsUrl);
    }
  }, []);

  // Vision Module
  const captureScreen = useCallback(() => {
    return withProcessing('vision', () => jarvisAPI.captureScreen());
  }, [withProcessing]);

  const analyzeImage = useCallback((imageBase64: string, query?: string) => {
    return withProcessing('vision', () => jarvisAPI.analyzeImage(imageBase64, query));
  }, [withProcessing]);

  const findElement = useCallback((query: string) => {
    return withProcessing('vision', () => jarvisAPI.findElement(query));
  }, [withProcessing]);

  const performOCR = useCallback(() => {
    return withProcessing('vision', () => jarvisAPI.performOCR());
  }, [withProcessing]);

  // Actions Module
  const click = useCallback((x: number, y: number) => {
    return withProcessing('actions', () => jarvisAPI.click(x, y));
  }, [withProcessing]);

  const typeText = useCallback((text: string) => {
    return withProcessing('actions', () => jarvisAPI.typeText(text));
  }, [withProcessing]);

  const scroll = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount?: number) => {
    return withProcessing('actions', () => jarvisAPI.scroll(direction, amount));
  }, [withProcessing]);

  const hotkey = useCallback((keys: string[]) => {
    return withProcessing('actions', () => jarvisAPI.hotkey(keys));
  }, [withProcessing]);

  const moveMouse = useCallback((x: number, y: number) => {
    return withProcessing('actions', () => jarvisAPI.moveMouse(x, y));
  }, [withProcessing]);

  const drag = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    return withProcessing('actions', () => jarvisAPI.drag(startX, startY, endX, endY));
  }, [withProcessing]);

  // Planner Module
  const createPlan = useCallback((goal: string) => {
    return withProcessing('planner', () => jarvisAPI.createPlan(goal));
  }, [withProcessing]);

  // Agent Module
  const executeCommand = useCallback((command: string, mode?: 'auto' | 'confirm' | 'plan_only') => {
    return withProcessing('agent', () => jarvisAPI.executeCommand(command, mode));
  }, [withProcessing]);

  const chat = useCallback(async (message: string) => {
    conversationHistory.current.push({ role: 'user', content: message });
    
    const response = await withProcessing('agent', () => 
      jarvisAPI.chat(message, conversationHistory.current)
    );

    if (response.response) {
      conversationHistory.current.push({ role: 'assistant', content: response.response });
    }

    return response;
  }, [withProcessing]);

  // WebSocket Command
  const sendWSCommand = useCallback(
    (
      module: 'vision' | 'actions' | 'planner' | 'agent',
      payload: unknown,
      onStream?: (chunk: string, done: boolean) => void
    ) => {
      return withProcessing(module, () => 
        jarvisWS.sendCommand(module, payload as never, onStream)
      );
    },
    [withProcessing]
  );

  return {
    // State
    state,
    isConnected: state.connectionState === 'connected',
    isProcessing: state.isProcessing,

    // Connection
    connect,
    disconnect,
    setConfig,

    // Vision
    captureScreen,
    analyzeImage,
    findElement,
    performOCR,

    // Actions
    click,
    typeText,
    scroll,
    hotkey,
    moveMouse,
    drag,

    // Planner
    createPlan,

    // Agent
    executeCommand,
    chat,

    // WebSocket
    sendWSCommand,
  };
}
