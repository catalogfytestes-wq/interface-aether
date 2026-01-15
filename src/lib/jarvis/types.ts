// JARVIS Backend Integration Types

export interface JarvisConfig {
  baseUrl: string;
  wsUrl: string;
  timeout?: number;
}

// Vision Module Types
export interface VisionRequest {
  action: 'capture_screen' | 'analyze_image' | 'find_element' | 'ocr';
  data?: {
    image_base64?: string;
    query?: string;
    region?: { x: number; y: number; width: number; height: number };
  };
}

export interface VisionResponse {
  success: boolean;
  data?: {
    image_base64?: string;
    analysis?: string;
    elements?: Array<{
      label: string;
      bbox: { x: number; y: number; width: number; height: number };
      confidence: number;
    }>;
    text?: string;
  };
  error?: string;
}

// Actions Module Types
export interface ActionRequest {
  action: 'click' | 'type' | 'scroll' | 'hotkey' | 'move_mouse' | 'drag';
  data: {
    x?: number;
    y?: number;
    text?: string;
    keys?: string[];
    direction?: 'up' | 'down' | 'left' | 'right';
    amount?: number;
    end_x?: number;
    end_y?: number;
  };
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Planner Module Types
export interface PlannerRequest {
  goal: string;
  context?: {
    current_screen?: string;
    available_actions?: string[];
    history?: string[];
  };
}

export interface PlannerResponse {
  success: boolean;
  plan?: {
    steps: Array<{
      id: number;
      action: string;
      description: string;
      params?: Record<string, unknown>;
    }>;
    reasoning: string;
  };
  error?: string;
}

// Agent Module Types
export interface AgentRequest {
  command: string;
  mode?: 'auto' | 'confirm' | 'plan_only';
  context?: {
    conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    current_state?: string;
  };
}

export interface AgentResponse {
  success: boolean;
  response?: string;
  actions_taken?: Array<{
    action: string;
    result: string;
    timestamp: string;
  }>;
  plan?: PlannerResponse['plan'];
  error?: string;
}

// WebSocket Message Types
export interface WSMessage {
  type: 'command' | 'response' | 'status' | 'error' | 'stream';
  module: 'vision' | 'actions' | 'planner' | 'agent' | 'system';
  payload: unknown;
  timestamp: string;
  id?: string;
}

export interface WSCommandMessage extends WSMessage {
  type: 'command';
  payload: VisionRequest | ActionRequest | PlannerRequest | AgentRequest;
}

export interface WSResponseMessage extends WSMessage {
  type: 'response';
  payload: VisionResponse | ActionResponse | PlannerResponse | AgentResponse;
}

export interface WSStatusMessage extends WSMessage {
  type: 'status';
  payload: {
    status: 'idle' | 'processing' | 'executing' | 'error';
    message?: string;
    progress?: number;
  };
}

export interface WSStreamMessage extends WSMessage {
  type: 'stream';
  payload: {
    chunk: string;
    done: boolean;
  };
}

// Connection State
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Jarvis State
export interface JarvisState {
  connectionState: ConnectionState;
  isProcessing: boolean;
  currentModule: WSMessage['module'] | null;
  lastError: string | null;
  lastResponse: WSResponseMessage | null;
}
