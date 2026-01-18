// Gemini Live API WebSocket Client Hook - VERSÃO FINAL ESTÁVEL
// Handles real-time bidirectional communication with Gemini

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  GeminiLiveConfig,
  GeminiLiveState,
  GeminiServerMessage,
  GeminiSetupMessage,
  GeminiRealtimeInputMessage,
  GeminiClientContentMessage,
  GeminiTokenResponse,
} from "@/lib/gemini/types";

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
    type: "open" | "setup_sent" | "setup_complete" | "close" | "error" | "retry";
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
  model: "models/gemini-2.0-flash-exp",
  responseModalities: ["AUDIO"],
  voiceName: "Kore",
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
    connectionState: "disconnected",
    isReady: false,
    isSpeaking: false,
    isListening: false,
    lastTranscript: "",
    lastResponse: "",
    error: null,
    sessionHandle: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const wsUrlRef = useRef<string | null>(null);
  const tokenRef = useRef<GeminiTokenResponse | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const responseBufferRef = useRef<string>("");
  const isConnectingRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 3;
  const readyResolverRef = useRef<null | ((value: void) => void)>(null);
  const readyRejecterRef = useRef<null | ((reason?: unknown) => void)>(null);
  const isReadyRef = useRef(false);

  const currentModelRef = useRef<string | null>(null);
  const resolvedModelRef = useRef<string | null>(null);

  const emitWsEvent = useCallback(
    (evt: Parameters<NonNullable<UseGeminiLiveOptions["onWsEvent"]>>[0]) => {
      onWsEvent?.(evt);
    },
    [onWsEvent],
  );

  useEffect(() => {
    isReadyRef.current = state.isReady;
  }, [state.isReady]);

  const updateState = useCallback(
    (updates: Partial<GeminiLiveState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        onStateChange?.(newState);
        return newState;
      });
    },
    [onStateChange],
  );

  const getToken = useCallback(
    async (modelOverride?: string): Promise<GeminiTokenResponse | null> => {
      try {
        const { data, error } = await supabase.functions.invoke("gemini-live-token", {
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
        console.error("Failed to get Gemini token:", error);
        onError?.(error instanceof Error ? error : new Error("Failed to get token"));
        return null;
      }
    },
    [config, onError],
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as GeminiServerMessage;

        if ("setupComplete" in message) {
          updateState({ isReady: true });
          resolvedModelRef.current = currentModelRef.current;
          emitWsEvent({ ts: Date.now(), type: "setup_complete", model: currentModelRef.current ?? undefined });
          console.log("Gemini Live: Setup complete");
          readyResolverRef.current?.();
          readyResolverRef.current = null;
          readyRejecterRef.current = null;
          return;
        }

        if ("serverContent" in message) {
          const content = message.serverContent;

          if (content.interrupted) {
            responseBufferRef.current = "";
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
            responseBufferRef.current = "";
            updateState({
              lastResponse: fullResponse,
              isSpeaking: false,
            });
            onResponse?.(fullResponse, true);
          }
        }

        if ("sessionResumptionUpdate" in message) {
          const update = message.sessionResumptionUpdate;
          if (update.newHandle) {
            updateState({ sessionHandle: update.newHandle });
          }
        }
      } catch (error) {
        console.error("Error parsing Gemini message:", error);
      }
    },
    [onResponse, onAudio, updateState, emitWsEvent],
  );

  const connect = useCallback(async () => {
    if (isConnectingRef.current) {
      console.log("Connection already in progress");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Already connected");
      return;
    }

    isConnectingRef.current = true;
    updateState({ connectionState: "connecting", error: null, isReady: false });

    const normalize = (v?: string) => (v || "").trim();
    const baseCandidates = ["models/gemini-2.0-flash-exp"];
    const modelCandidates = Array.from(new Set(baseCandidates.map(normalize).filter(Boolean)));

    const attemptOnce = async (modelToTry: string) => {
      currentModelRef.current = modelToTry;
      emitWsEvent({ ts: Date.now(), type: "retry", model: modelToTry });

      const readyPromise = new Promise<void>((resolve, reject) => {
        readyResolverRef.current = resolve;
        readyRejecterRef.current = reject;
      });

      const token = await getToken(modelToTry);
      if (!token) {
        throw new Error("Falha ao obter autenticação do Gemini");
      }
      tokenRef.current = token;

      const wsUrlBase = token.wsUrl;
      let wsUrl: string;

      if (token.mode === "direct" && token.apiKey) {
        wsUrl = `${wsUrlBase}?key=${token.apiKey}`;
        console.log("Gemini Live: Using direct API key mode (Fallback)");
      } else if (token.token) {
        wsUrl = `${wsUrlBase}?access_token=${token.token}`;
        console.log("Gemini Live: Using ephemeral token mode");
      } else {
        throw new Error("No valid authentication method available");
      }

      wsUrlRef.current = wsUrl;
      console.log(`Gemini Live: Opening WebSocket… (model=${modelToTry})`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        emitWsEvent({ ts: Date.now(), type: "open", model: modelToTry });
        console.log("Gemini Live: Connected (socket open)");
        updateState({ connectionState: "connected" });

        const voiceName = config.voiceName || "Kore";

        const buildSetupMessage = (): GeminiSetupMessage => {
          const modalities = config.responseModalities || ["AUDIO"];

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

          // --- CORREÇÃO FINAL: NÃO enviar 'model' dentro do setup ---
          // A API rejeita se o campo model estiver aqui.
          const setupPayload: Record<string, unknown> = {
            generationConfig,
          };

          if (config.systemInstruction) {
            setupPayload.systemInstruction = {
              parts: [{ text: config.systemInstruction }],
            };
          }

          return { setup: setupPayload as GeminiSetupMessage["setup"] };
        };

        const setupMessage = buildSetupMessage();

        // Pequeno delay para garantir estabilidade da conexão antes de enviar o setup
        setTimeout(() => {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(setupMessage));
              emitWsEvent({ ts: Date.now(), type: "setup_sent", model: modelToTry });
              console.log("Gemini Live: Setup message sent");
            }
          } catch (e) {
            console.error("Gemini Live: Failed to send setup message", e);
          }
        }, 50);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error("Gemini WebSocket error:", error);
        emitWsEvent({ ts: Date.now(), type: "error", model: modelToTry, detail: "WebSocket error event" });
      };

      ws.onclose = (event) => {
        const code = event.code;
        const reason = event.reason || "(sem motivo)";
        emitWsEvent({ ts: Date.now(), type: "close", model: modelToTry, code, reason });
        console.log("Gemini Live: Disconnected", code, reason);

        if (!isReadyRef.current) {
          readyRejecterRef.current?.(
            new Error(`WebSocket fechado antes de ficar pronto (code=${code}, reason=${reason})`),
          );
          readyResolverRef.current = null;
          readyRejecterRef.current = null;
        }

        if (autoReconnect && code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          updateState({ connectionState: "reconnecting", isReady: false });
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, 3000 * reconnectAttemptsRef.current);
          return;
        }

        if (code !== 1000) {
          const msg = `Conexão Gemini encerrada (code=${code}) ${reason}`;
          updateState({ connectionState: "error", isReady: false, error: msg });
          onError?.(new Error(msg));
        } else {
          updateState({ connectionState: "disconnected", isReady: false });
        }
      };

      await readyPromise;
    };

    try {
      let lastError: unknown = null;
      for (const model of modelCandidates) {
        try {
          if (wsRef.current) {
            try {
              wsRef.current.close(1000, "Retry");
            } catch {}
            wsRef.current = null;
          }
          await attemptOnce(model);
          reconnectAttemptsRef.current = 0;
          isConnectingRef.current = false;
          return;
        } catch (e) {
          lastError = e;
          console.warn(`[Gemini Live] Modelo falhou: ${model}`, e);
          continue;
        }
      }
      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    } catch (error) {
      console.error("Failed to connect:", error);
      isConnectingRef.current = false;
      readyRejecterRef.current?.(error);
      updateState({
        connectionState: "error",
        error: error instanceof Error ? error.message : "Connection failed",
      });
      onError?.(error instanceof Error ? error : new Error("Connection failed"));
    }
  }, [config, autoReconnect, getToken, handleMessage, onError, updateState, emitWsEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    readyRejecterRef.current?.(new Error("Disconnected"));
    readyResolverRef.current = null;
    readyRejecterRef.current = null;

    if (wsRef.current) {
      wsRef.current.close(1000, "User initiated disconnect");
      wsRef.current = null;
    }
    wsUrlRef.current = null;
    tokenRef.current = null;
    isConnectingRef.current = false;
    updateState({
      connectionState: "disconnected",
      isReady: false,
      sessionHandle: null,
      error: null,
    });
  }, [updateState]);

  const sendText = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket not connected");
        return;
      }
      const message: GeminiClientContentMessage = {
        clientContent: {
          turns: [{ role: "user", parts: [{ text }] }],
          turnComplete: true,
        },
      };
      wsRef.current.send(JSON.stringify(message));
      updateState({ lastTranscript: text });
    },
    [updateState],
  );

  const sendAudio = useCallback((audioBase64: string, mimeType = "audio/pcm;rate=16000") => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const message: GeminiRealtimeInputMessage = {
      realtimeInput: {
        mediaChunks: [{ mimeType, data: audioBase64 }],
      },
    };
    wsRef.current.send(JSON.stringify(message));
  }, []);

  const sendImage = useCallback((imageBase64: string, mimeType = "image/jpeg") => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const message: GeminiRealtimeInputMessage = {
      realtimeInput: {
        mediaChunks: [{ mimeType, data: imageBase64 }],
      },
    };
    wsRef.current.send(JSON.stringify(message));
  }, []);

  const sendScreenFrame = useCallback(
    (frameBase64: string) => {
      sendImage(frameBase64, "image/jpeg");
    },
    [sendImage],
  );

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
