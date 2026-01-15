// ElevenLabs Conversational AI Agent Hook

import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation, type HookOptions } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseElevenLabsAgentOptions {
  agentId?: string;
  onTranscript?: (text: string, isUser: boolean) => void;
  onAgentResponse?: (response: string) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening') => void;
}

interface UseElevenLabsAgentReturn {
  status: 'disconnected' | 'connecting' | 'connected';
  isSpeaking: boolean;
  isConnecting: boolean;
  agentStatus: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening';
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  inputVolume: number;
  outputVolume: number;
}

export function useElevenLabsAgent(options: UseElevenLabsAgentOptions = {}): UseElevenLabsAgentReturn {
  const { agentId, onTranscript, onAgentResponse, onError, onStatusChange } = options;
  const { toast } = useToast();

  const [isConnecting, setIsConnecting] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking' | 'listening'>('idle');
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onAgentResponseRef = useRef(onAgentResponse);
  const onErrorRef = useRef(onError);
  
  // Keep refs updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onAgentResponseRef.current = onAgentResponse;
    onErrorRef.current = onError;
  }, [onTranscript, onAgentResponse, onError]);

  const updateStatus = useCallback((status: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening') => {
    setAgentStatus(status);
    onStatusChange?.(status);
  }, [onStatusChange]);

  const conversationConfig: HookOptions = {
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      updateStatus('listening');
      
      // Start volume monitoring
      volumeIntervalRef.current = setInterval(() => {
        setInputVolume(conversation.getInputVolume());
        setOutputVolume(conversation.getOutputVolume());
      }, 100);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      updateStatus('idle');
      
      // Stop volume monitoring
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }
    },
    onMessage: (message: unknown) => {
      console.log('ElevenLabs message:', message);
      
      // Safe access to message properties
      if (message && typeof message === 'object') {
        const msg = message as { user_transcript?: string; agent_response?: string };
        
        if (msg.user_transcript) {
          onTranscriptRef.current?.(msg.user_transcript, true);
          updateStatus('listening');
        }
        
        if (msg.agent_response) {
          onAgentResponseRef.current?.(msg.agent_response);
          onTranscriptRef.current?.(msg.agent_response, false);
          updateStatus('speaking');
        }
      }
    },
    onStatusChange: (newStatus) => {
      console.log('ElevenLabs status change:', newStatus);
    },
    onModeChange: (mode) => {
      console.log('ElevenLabs mode change:', mode);
      if (mode.mode === 'speaking') {
        updateStatus('speaking');
      } else if (mode.mode === 'listening') {
        updateStatus('listening');
      }
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      const err = new Error(typeof error === 'string' ? error : 'Connection error');
      onErrorRef.current?.(err);
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description: 'Falha ao conectar com o agente de voz. Tente novamente.',
      });
      updateStatus('idle');
    },
  };

  const conversation = useConversation(conversationConfig);

  const startConversation = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    updateStatus('connecting');

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
        body: { agent_id: agentId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get conversation token');
      }

      if (!data?.signed_url && !data?.token) {
        throw new Error('No signed URL received from server. Make sure you have an ElevenLabs agent configured.');
      }

      // Start the conversation with signed URL
      await conversation.startSession({
        signedUrl: data.signed_url || data.token,
      });

      updateStatus('connected');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      const err = error instanceof Error ? error : new Error('Failed to start conversation');
      onErrorRef.current?.(err);
      
      toast({
        variant: 'destructive',
        title: 'Erro ao Iniciar',
        description: err.message.includes('Permission denied') || err.message.includes('NotAllowedError')
          ? 'Permissão de microfone negada. Habilite o acesso ao microfone.'
          : err.message,
      });
      
      updateStatus('idle');
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, isConnecting, agentId, toast, updateStatus]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      updateStatus('idle');
    } catch (error) {
      console.error('Failed to stop conversation:', error);
    }
  }, [conversation, updateStatus]);

  const sendTextMessage = useCallback((text: string) => {
    if (conversation.status === 'connected') {
      conversation.sendUserMessage(text);
    }
  }, [conversation]);

  // Map the SDK status to our simpler status
  const mappedStatus: 'disconnected' | 'connecting' | 'connected' = 
    conversation.status === 'connected' ? 'connected' : 
    conversation.status === 'connecting' ? 'connecting' : 'disconnected';

  return {
    status: mappedStatus,
    isSpeaking: conversation.isSpeaking,
    isConnecting,
    agentStatus,
    startConversation,
    stopConversation,
    sendTextMessage,
    inputVolume,
    outputVolume,
  };
}
