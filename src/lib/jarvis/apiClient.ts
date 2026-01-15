// JARVIS REST API Client

import type {
  JarvisConfig,
  VisionRequest,
  VisionResponse,
  ActionRequest,
  ActionResponse,
  PlannerRequest,
  PlannerResponse,
  AgentRequest,
  AgentResponse,
} from './types';

const DEFAULT_CONFIG: JarvisConfig = {
  baseUrl: 'http://localhost:5000',
  wsUrl: 'ws://localhost:5000/ws',
  timeout: 30000,
};

class JarvisAPIClient {
  private config: JarvisConfig;

  constructor(config?: Partial<JarvisConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setConfig(config: Partial<JarvisConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): JarvisConfig {
    return { ...this.config };
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; modules: string[] }> {
    return this.request('/health', 'GET');
  }

  // Vision Module
  async captureScreen(): Promise<VisionResponse> {
    return this.request('/vision', 'POST', { action: 'capture_screen' } as VisionRequest);
  }

  async analyzeImage(imageBase64: string, query?: string): Promise<VisionResponse> {
    return this.request('/vision', 'POST', {
      action: 'analyze_image',
      data: { image_base64: imageBase64, query },
    } as VisionRequest);
  }

  async findElement(query: string, imageBase64?: string): Promise<VisionResponse> {
    return this.request('/vision', 'POST', {
      action: 'find_element',
      data: { query, image_base64: imageBase64 },
    } as VisionRequest);
  }

  async performOCR(imageBase64?: string, region?: VisionRequest['data']['region']): Promise<VisionResponse> {
    return this.request('/vision', 'POST', {
      action: 'ocr',
      data: { image_base64: imageBase64, region },
    } as VisionRequest);
  }

  // Actions Module
  async click(x: number, y: number): Promise<ActionResponse> {
    return this.request('/actions', 'POST', {
      action: 'click',
      data: { x, y },
    } as ActionRequest);
  }

  async typeText(text: string): Promise<ActionResponse> {
    return this.request('/actions', 'POST', {
      action: 'type',
      data: { text },
    } as ActionRequest);
  }

  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount: number = 3): Promise<ActionResponse> {
    return this.request('/actions', 'POST', {
      action: 'scroll',
      data: { direction, amount },
    } as ActionRequest);
  }

  async hotkey(keys: string[]): Promise<ActionResponse> {
    return this.request('/actions', 'POST', {
      action: 'hotkey',
      data: { keys },
    } as ActionRequest);
  }

  async moveMouse(x: number, y: number): Promise<ActionResponse> {
    return this.request('/actions', 'POST', {
      action: 'move_mouse',
      data: { x, y },
    } as ActionRequest);
  }

  async drag(startX: number, startY: number, endX: number, endY: number): Promise<ActionResponse> {
    return this.request('/actions', 'POST', {
      action: 'drag',
      data: { x: startX, y: startY, end_x: endX, end_y: endY },
    } as ActionRequest);
  }

  // Planner Module
  async createPlan(goal: string, context?: PlannerRequest['context']): Promise<PlannerResponse> {
    return this.request('/planner', 'POST', { goal, context } as PlannerRequest);
  }

  // Agent Module
  async executeCommand(
    command: string,
    mode: AgentRequest['mode'] = 'auto',
    context?: AgentRequest['context']
  ): Promise<AgentResponse> {
    return this.request('/agent', 'POST', { command, mode, context } as AgentRequest);
  }

  async chat(
    message: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AgentResponse> {
    return this.request('/agent/chat', 'POST', {
      command: message,
      mode: 'auto',
      context: { conversation_history: conversationHistory },
    } as AgentRequest);
  }
}

// Singleton instance
export const jarvisAPI = new JarvisAPIClient();

export { JarvisAPIClient };
