// Gemini Live API WebSocket Client Hook - VERSÃO FINAL 2.0 (Model Restored)
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  GeminiLiveConfig,
  GeminiLiveState,
  GeminiServerMessage,
  GeminiSetupMessage,
  GeminiRealtimeInputMessage,
  GeminiClientContentMessage,
  GeminiTokenResponse,
} from '@/lib/gemini/types';

interface UseGeminiLiveOptions {
  config?: GeminiLiveConfig;
  autoReconnect?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string, isFinal: boolean) => void;
  onAudio?: (audioData: string) => void; // base64 audio
  onError?: (error: Error) => void;
  onStateChange?: (state: GeminiLiveState) => void;
  onWsEvent?: (event: {
    ts: number;
    type: 'open' | 'setup_sent' | 'setup_complete' | 'close' | 'error' | 'retry';
    model?: string;
    code?: number;
    reason?: string;
    detail?: string;
  }) => void;
}

interface UseGeminiLiveReturn {
  state: GeminiLiveState;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
  sendAudio: (audioBase64: string, mimeType?: string) => void;
  sendImage: (imageBase64: string, mimeType?: string) => void;
  sendScreenFrame: (frameBase64: string) => void;
  getResolvedModel: () => string | null;
}

const DEFAULT_CONFIG: GeminiLiveConfig = {
  // Modelo experimental para Live API
  model: 'models/gemini-2.0-flash-exp',
  responseModalities: ['AUDIO'],
  voiceName: 'Kore',
  systemInstruction: `Você é JARVIS, um assistente de IA avançado que pode ver a tela do usuário em tempo real.
Você está aqui para ajudar com qualquer tarefa que o usuário esteja realizando.
Seja proativo, observador e útil. Responda sempre em português brasileiro.
Quando o usuário compartilhar a tela, analise o conteúdo e ofereça ajuda contextual.`,
};

export function useGeminiLive(options: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
  const {
    config = DEFAULT_CONFIG,
    autoReconnect = false,
    onTranscript,
    onResponse,
    onAudio,
    onError,
    onStateChange,
    onWsEvent,
  } = options;

  const [state, setState] = useState<GeminiLiveState>({
    connectionState: 'disconnected',
    isReady: false,
    isSpeaking: false,
    isListening: false,
    lastTranscript: '',
    lastResponse: '',
    error: null,
    sessionHandle: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const wsUrlRef = useRef<string | null>(null);
  const tokenRef = useRef<GeminiTokenResponse | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const responseBufferRef = useRef<string>('');
  const isConnectingRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 3;
  const readyResolverRef = useRef<null | ((value: void) => void)>(null);
  const readyRejecterRef = useRef<null | ((reason?: unknown) => void)>(null);
  const isReadyRef = useRef(false);

  const currentModelRef = useRef<string | null>(null);
  const resolvedModelRef = useRef<string | null>(null);

  const emitWsEvent = useCallback((evt: Parameters<NonNullable<UseGeminiLiveOptions['onWsEvent']>>[0]) => {
    onWsEvent?.(evt);
  }, [onWsEvent]);

  useEffect(() => {
    isReadyRef.current = state.isReady;
  }, [state.isReady]);

  const updateState = useCallback((updates: Partial<GeminiLiveState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  const getToken = useCallback(async (modelOverride?: string): Promise<GeminiTokenResponse | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-live-token', {
        body: {
          model: modelOverride ?? config.model,
          responseModalities: config.responseModalities,
          systemInstruction: config.systemInstruction,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data as GeminiTokenResponse;
    } catch (error) {
      console.error('Failed to get Gemini token:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to get token'));
      return null;
    }
  }, [config, onError]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as GeminiServerMessage;

      if ('setupComplete' in message) {
        updateState({ isReady: true });
        resolvedModelRef.current = currentModelRef.current;
        emitWsEvent({ ts: Date.now(), type: 'setup_complete', model: currentModelRef.current ?? undefined });
        console.log('Gemini Live: Setup complete');
        readyResolverRef.current?.();
        readyResolverRef.current = null;
        readyRejecterRef.current = null;
        return;
      }

      if ('serverContent' in message) {
        const content = message.serverContent;

        if (content.interrupted) {
          responseBufferRef.current = '';
          updateState({ isSpeaking: false });
          return;
        }

        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            if (part.text) {
              responseBufferRef.current += part.text;
              onResponse?.(part.text, false);
            }
            if (part.inlineData?.data) {
              onAudio?.(part.inlineData.data);
              updateState({ isSpeaking: true });
            }
          }
        }

        if (content.turnComplete) {
          const fullResponse = responseBufferRef.current;
          responseBufferRef.current = '';
          updateState({ 
            lastResponse: fullResponse,
            isSpeaking: false 
          });
          onResponse?.(fullResponse, true);
        }
      }

      if ('sessionResumptionUpdate' in message) {
        const update = message.sessionResumptionUpdate;
        if (update.newHandle) {
          updateState({ sessionHandle: update.newHandle });
        }
      }

    } catch (error) {
      console.error('Error parsing Gemini message:', error);
    }
  }, [onResponse, onAudio, updateState, emitWsEvent]);

  const connect = useCallback(async () => {
    if (isConnectingRef.current) {
      console.log('Connection already in progress');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    isConnectingRef.current = true;
    updateState({ connectionState: 'connecting', error: null, isReady: false });

    // Garantimos que o modelo sempre tenha o prefixo "models/"
    const normalize = (v?: string) => {
        if (!v) return '';
        const trimmed = v.trim();
        if (!trimmed.startsWith('models/')) return `models/${trimmed}`;
        return trimmed;
    };

    // Usamos apenas o modelo padrão experimental
    const baseCandidates = ['models/gemini-2.0-flash-exp'];
    const modelCandidates = Array.from(new Set(baseCandidates.map(normalize).filter(Boolean)));

    const attemptOnce = async (modelToTry: string) => {
      currentModelRef.current = modelToTry;
      emitWsEvent({ ts: Date.now(), type: 'retry', model: modelToTry });

      const readyPromise = new Promise<void>((resolve, reject) => {
        readyResolverRef.current = resolve;
        readyRejecterRef.current = reject;
      });

      const token = await getToken(modelToTry);
      if (!token) {
        throw new Error('Falha ao obter autenticação do Gemini');
      }
      tokenRef.current = token;

      const wsUrlBase = token.wsUrl;
      let wsUrl: string;

      if (token.mode === 'direct' && token.apiKey) {
        wsUrl = `${wsUrlBase}?key=${token.apiKey}`;
        console.log('Gemini Live: Using direct API key mode (Fallback)');
      } else if (token.token) {
        wsUrl = `${wsUrlBase}?access_token=${token.token}`;
        console.log('Gemini Live: Using ephemeral token mode');
      } else {
        throw new Error('No valid authentication method available');
      }

      wsUrlRef.current = wsUrl;
      console.log(`Gemini Live: Opening WebSocket… (model=${modelToTry})`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        emitWsEvent({ ts: Date.now(), type: 'open', model: modelToTry });
        console.log('Gemini Live: Connected (socket open)');
        updateState({ connectionState: 'connected' });

        const voiceName = config.voiceName || 'Kore';
        
        const buildSetupMessage = (): GeminiSetupMessage => {
          const modalities = config.responseModalities || ['AUDIO'];
          
          const generationConfig: Record<string, unknown> = {
            responseModalities: modalities,
          };

          if (voiceName) {
            generationConfig.speechConfig = {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            };
          }

          if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
          if (config.topK !== undefined) generationConfig.topK = config.topK;
          if (config.topP !== undefined) generationConfig.topP = config.topP;

          // --- CORREÇÃO: O campo 'model' DEVE estar aqui para a URL genérica ---
          const setupPayload: Record<string, unknown> = {
            model: modelToTry, // RESTAURADO: Essencial para evitar o erro 1011
            generationConfig,
          };

          if (config.systemInstruction) {
            setupPayload.systemInstruction = {
              parts: [{ text: config.systemInstruction }],
            };
          }

          return { setup: setupPayload as GeminiSetupMessage['setup'] };
        };

        const setupMessage = buildSetupMessage();

        // Delay de segurança
        setTimeout(() => {
            try {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(setupMessage));
                emitWsEvent({ ts: Date.now(), type: 'setup_sent', model: modelToTry });
                console.log('Gemini Live: Setup message sent');
              }
            } catch (e) {
              console.error('Gemini Live: Failed to send setup message', e);
            }
        }, 100);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('Gemini WebSocket error:', error);
        emitWsEvent({ ts: Date.now(), type: 'error', model: modelToTry, detail: 'WebSocket error event' });
      };