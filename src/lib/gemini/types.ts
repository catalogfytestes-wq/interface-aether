// Gemini Live API Types for Screen Sharing

// Connection states
export type GeminiConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'error';

// Configuration for Gemini Live session
export interface GeminiLiveConfig {
  model?: string;
  responseModalities?: ('TEXT' | 'AUDIO')[];
  systemInstruction?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  voiceName?: string;
}

// Token response from edge function
export interface GeminiTokenResponse {
  token?: string;
  apiKey?: string; // Used in direct mode when ephemeral tokens aren't available
  expireTime: string;
  newSessionExpireTime: string;
  model: string;
  wsUrl: string;
  mode: 'ephemeral' | 'direct'; // ephemeral = using token, direct = using API key
  error?: string;
  note?: string;
}

// WebSocket message types
export interface GeminiSetupMessage {
  setup: {
    model: string;
    generationConfig?: {
      responseModalities?: string[];
      temperature?: number;
      topK?: number;
      topP?: number;
    };
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
  };
}

export interface GeminiRealtimeInputMessage {
  realtimeInput: {
    mediaChunks: Array<{
      mimeType: string;
      data: string; // base64 encoded
    }>;
  };
}

export interface GeminiClientContentMessage {
  clientContent: {
    turns: Array<{
      role: 'user';
      parts: Array<{ text: string }>;
    }>;
    turnComplete: boolean;
  };
}

export interface GeminiToolResponseMessage {
  toolResponse: {
    functionResponses: Array<{
      response: unknown;
      id: string;
    }>;
  };
}

// Server response types
export interface GeminiSetupCompleteMessage {
  setupComplete: Record<string, never>;
}

export interface GeminiServerContentMessage {
  serverContent: {
    modelTurn?: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string; // base64
        };
      }>;
    };
    turnComplete?: boolean;
    interrupted?: boolean;
    generationComplete?: boolean;
  };
}

export interface GeminiToolCallMessage {
  toolCall: {
    functionCalls: Array<{
      name: string;
      args: Record<string, unknown>;
      id: string;
    }>;
  };
}

export interface GeminiSessionResumptionMessage {
  sessionResumptionUpdate: {
    newHandle?: string;
    resumable?: boolean;
  };
}

export interface GeminiUsageMetadataMessage {
  usageMetadata: {
    promptTokenCount: number;
    responseTokenCount: number;
    totalTokenCount: number;
  };
}

// Union of all possible server messages
export type GeminiServerMessage = 
  | GeminiSetupCompleteMessage
  | GeminiServerContentMessage
  | GeminiToolCallMessage
  | GeminiSessionResumptionMessage
  | GeminiUsageMetadataMessage;

// Union of all possible client messages
export type GeminiClientMessage = 
  | GeminiSetupMessage
  | GeminiRealtimeInputMessage
  | GeminiClientContentMessage
  | GeminiToolResponseMessage;

// Hook state
export interface GeminiLiveState {
  connectionState: GeminiConnectionState;
  isReady: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  lastTranscript: string;
  lastResponse: string;
  error: string | null;
  sessionHandle: string | null;
}

// Screen share state
export interface ScreenShareState {
  isSharing: boolean;
  stream: MediaStream | null;
  error: string | null;
  frameRate: number;
}

// Audio state
export interface AudioState {
  isMicActive: boolean;
  isPlayingAudio: boolean;
  micStream: MediaStream | null;
  audioContext: AudioContext | null;
  error: string | null;
}

// Combined agent state
export interface GeminiScreenAgentState {
  connection: GeminiConnectionState;
  screenShare: ScreenShareState;
  audio: AudioState;
  isProcessing: boolean;
  conversation: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

// Callback types
export type OnTranscriptCallback = (transcript: string, isFinal: boolean) => void;
export type OnResponseCallback = (response: string, isFinal: boolean) => void;
export type OnAudioCallback = (audioData: ArrayBuffer) => void;
export type OnErrorCallback = (error: Error) => void;
export type OnStateChangeCallback = (state: GeminiLiveState) => void;
