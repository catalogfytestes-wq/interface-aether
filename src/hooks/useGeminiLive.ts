// Gemini Live API WebSocket Client Hook
// Handles real-time bidirectional communication with Gemini

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  GeminiLiveConfig,
  GeminiLiveState,
  GeminiConnectionState,
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
  // Modelo padrão para Live API (BidiGenerateContent) - Janeiro 2026
  // Ref: https://ai.google.dev/gemini-api/docs/models?hl=pt-br
  // Único modelo oficialmente compatível com API Live: gemini-2.5-flash-native-audio-preview-12-2025
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  responseModalities: ['AUDIO', 'TEXT'],
  systemInstruction: `Você é JARVIS, um assistente de IA avançado que pode ver a tela do usuário em tempo real.
Você está aqui para ajudar com qualquer tarefa que o usuário esteja realizando.
Seja proativo, observador e útil. Responda sempre em português brasileiro.
Quando o usuário compartilhar a tela, analise o conteúdo e ofereça ajuda contextual.`,
};

export function useGeminiLive(options: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
  const {
    config = DEFAULT_CONFIG,
    autoReconnect = false, // Disabled by default to prevent reconnect loops
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

  // Update state and notify
  const updateState = useCallback((updates: Partial<GeminiLiveState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Fetch ephemeral token from edge function
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

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as GeminiServerMessage;

      // Setup complete
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

      // Server content (model response)
      if ('serverContent' in message) {
        const content = message.serverContent;

        if (content.interrupted) {
          responseBufferRef.current = '';
          updateState({ isSpeaking: false });
          return;
        }

        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            // Text response
            if (part.text) {
              responseBufferRef.current += part.text;
              onResponse?.(part.text, false);
            }

            // Audio response
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

      // Session resumption
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

  // Connect to Gemini Live API
  const connect = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
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

    const normalize = (v?: string) => (v || '').trim();

    // Model fallbacks para Gemini Live API (BidiGenerateContent) - Janeiro 2026
    // Ref: https://ai.google.dev/gemini-api/docs/models?hl=pt-br
    // ÚNICO modelo oficialmente compatível com API Live:
    //   - gemini-2.5-flash-native-audio-preview-12-2025 (entrada: áudio/vídeo/texto, saída: áudio/texto)
    // Modelos antigos não funcionam mais: gemini-2.0-flash-live-001, gemini-2.0-flash-exp, etc.
    const seed = normalize(config.model);
    const baseCandidates = [
      // User-selected model first
      seed,
      seed.startsWith('models/') ? seed.slice('models/'.length) : `models/${seed}`,
      // Modelo Live API oficial (Janeiro 2026)
      'gemini-2.5-flash-native-audio-preview-12-2025',
      'models/gemini-2.5-flash-native-audio-preview-12-2025',
      // Versão anterior (Setembro 2025)
      'gemini-2.5-flash-native-audio-preview-09-2025',
      'models/gemini-2.5-flash-native-audio-preview-09-2025',
      // Fallbacks legados (podem não funcionar)
      'gemini-2.0-flash-live-001',
      'gemini-2.0-flash-exp',
    ].filter(Boolean);

    const modelCandidates = Array.from(new Set(baseCandidates.map(normalize).filter(Boolean)));

    const isModelNotSupported = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      return (
        msg.includes('not found for API version') ||
        msg.includes('not supported for bidiGenerateContent') ||
        msg.includes('is not supported for')
      );
    };

    const attemptOnce = async (modelToTry: string) => {
      currentModelRef.current = modelToTry;
      emitWsEvent({ ts: Date.now(), type: 'retry', model: modelToTry });

      // Promise resolves when we receive setupComplete
      const readyPromise = new Promise<void>((resolve, reject) => {
        readyResolverRef.current = resolve;
        readyRejecterRef.current = reject;
      });

      // Get ephemeral token or API key
      const token = await getToken(modelToTry);
      if (!token) {
        throw new Error('Falha ao obter autenticação do Gemini');
      }
      tokenRef.current = token;

      // Build WebSocket URL based on mode
      let wsUrl: string;
      if (token.mode === 'direct' && token.apiKey) {
        wsUrl = `${token.wsUrl}?key=${token.apiKey}`;
        console.log('Gemini Live: Using direct API key mode');
      } else if (token.token) {
        wsUrl = `${token.wsUrl}?access_token=${token.token}`;
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

        // Build setup message with advanced audio features
        const setupPayload: Record<string, unknown> = {
          model: modelToTry,
          generationConfig: {
            responseModalities: config.responseModalities,
            temperature: config.temperature,
            topK: config.topK,
            topP: config.topP,
          },
        };

        // Add system instruction
        if (config.systemInstruction) {
          setupPayload.systemInstruction = {
            parts: [{ text: config.systemInstruction }],
          };
        }

        // Add voice configuration (speechConfig)
        if (config.voiceName) {
          setupPayload.speechConfig = {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: config.voiceName,
              },
            },
          };
        }

        // Add affective dialog (emotional responses)
        if (config.enableAffectiveDialog) {
          setupPayload.enableAffectiveDialog = true;
        }

        // Add proactive audio (model decides when to respond)
        if (config.proactiveAudio) {
          setupPayload.proactivity = {
            proactiveAudio: true,
          };
        }

        // Add thinking budget
        if (config.thinkingBudget !== undefined) {
          setupPayload.thinkingConfig = {
            thinkingBudget: config.thinkingBudget,
          };
        }

        const setupMessage: GeminiSetupMessage = {
          setup: setupPayload as GeminiSetupMessage['setup'],
        };

        try {
          ws.send(JSON.stringify(setupMessage));
          emitWsEvent({ ts: Date.now(), type: 'setup_sent', model: modelToTry });
          console.log('Gemini Live: Setup message sent');
        } catch (e) {
          console.error('Gemini Live: Failed to send setup message', e);
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('Gemini WebSocket error:', error);
        emitWsEvent({ ts: Date.now(), type: 'error', model: modelToTry, detail: 'WebSocket error event' });
        updateState({ connectionState: 'error', error: 'Erro de conexão WebSocket (Gemini)' });
        readyRejecterRef.current?.(new Error('WebSocket error'));
        readyResolverRef.current = null;
        readyRejecterRef.current = null;
        onError?.(new Error('WebSocket connection error'));
      };

      ws.onclose = (event) => {
        const code = event.code;
        const reason = event.reason || '(sem motivo)';
        emitWsEvent({ ts: Date.now(), type: 'close', model: modelToTry, code, reason });
        console.log('Gemini Live: Disconnected', code, reason);

        // If we closed before setupComplete, fail the connect() awaiter
        if (!isReadyRef.current) {
          readyRejecterRef.current?.(
            new Error(`WebSocket fechado antes de ficar pronto (code=${code}, reason=${reason})`)
          );
          readyResolverRef.current = null;
          readyRejecterRef.current = null;
        }

        if (autoReconnect && code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          updateState({ connectionState: 'reconnecting', isReady: false });
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, 3000 * reconnectAttemptsRef.current);
          return;
        }

        if (code !== 1000) {
          const msg = `Conexão Gemini encerrada (code=${code}) ${reason}`;
          updateState({ connectionState: 'error', isReady: false, error: msg });
          onError?.(new Error(msg));
        } else {
          updateState({ connectionState: 'disconnected', isReady: false });
        }
      };

      // Wait until setupComplete
      await readyPromise;
    };

    try {
      let lastError: unknown = null;

      for (const model of modelCandidates) {
        try {
          // Close any previous socket before retry
          if (wsRef.current) {
            try {
              wsRef.current.close(1000, 'Retry with fallback model');
            } catch {
              // ignore
            }
            wsRef.current = null;
          }

          await attemptOnce(model);
          // success
          reconnectAttemptsRef.current = 0;
          isConnectingRef.current = false;
          return;
        } catch (e) {
          lastError = e;
          if (isModelNotSupported(e)) {
            console.warn(`[Gemini Live] Modelo falhou, tentando fallback: ${model}`, e);
            continue;
          }
          throw e;
        }
      }

      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    } catch (error) {
      console.error('Failed to connect:', error);
      isConnectingRef.current = false;
      readyRejecterRef.current?.(error);
      readyResolverRef.current = null;
      readyRejecterRef.current = null;
      updateState({
        connectionState: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      onError?.(error instanceof Error ? error : new Error('Connection failed'));
    }
  }, [config, autoReconnect, getToken, handleMessage, onError, updateState]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // If connect() is awaiting setupComplete, reject it
    readyRejecterRef.current?.(new Error('Disconnected'));
    readyResolverRef.current = null;
    readyRejecterRef.current = null;

    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }

    wsUrlRef.current = null;
    tokenRef.current = null;
    isConnectingRef.current = false;

    updateState({
      connectionState: 'disconnected',
      isReady: false,
      sessionHandle: null,
      error: null,
    });
  }, [updateState]);

  // Send text message
  const sendText = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    const message: GeminiClientContentMessage = {
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true,
      },
    };

    wsRef.current.send(JSON.stringify(message));
    updateState({ lastTranscript: text });
  }, [updateState]);

  // Send audio data
  const sendAudio = useCallback((audioBase64: string, mimeType = 'audio/pcm;rate=16000') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: GeminiRealtimeInputMessage = {
      realtimeInput: {
        mediaChunks: [{ mimeType, data: audioBase64 }],
      },
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

  // Send image data
  const sendImage = useCallback((imageBase64: string, mimeType = 'image/jpeg') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: GeminiRealtimeInputMessage = {
      realtimeInput: {
        mediaChunks: [{ mimeType, data: imageBase64 }],
      },
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

  // Convenience method for screen frames
  const sendScreenFrame = useCallback((frameBase64: string) => {
    sendImage(frameBase64, 'image/jpeg');
  }, [sendImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    state,
    connect,
    disconnect,
    sendText,
    sendAudio,
    sendImage,
    sendScreenFrame,
    getResolvedModel: () => resolvedModelRef.current,
  };
}
