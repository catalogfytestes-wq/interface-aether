import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  MonitorOff,
  Mic,
  MicOff,
  Send,
  X,
  Loader2,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Settings2,
  Zap,
  Brain,
  AudioWaveform,
} from 'lucide-react';
import { useGeminiScreenAgent } from '@/hooks/useGeminiScreenAgent';
import { useGeminiAudioPlayer } from '@/hooks/useGeminiAudioPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GEMINI_VOICES } from '@/lib/gemini/types';

interface ScreenAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  transparentMode?: boolean;
  onPlaySound?: (type: 'hover' | 'click' | 'activate') => void;
  onTTSSpeakingChange?: (isSpeaking: boolean) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const LS_VOICE_KEY = 'jarvis.gemini.voice';
const LS_AFFECTIVE_KEY = 'jarvis.gemini.affective';
const LS_PROACTIVE_KEY = 'jarvis.gemini.proactive';

// VU Meter Component
const VUMeter = ({ level, isPlaying }: { level: number; isPlaying: boolean }) => {
  const bars = 12;
  const activeThreshold = level * bars;
  
  return (
    <div className="flex items-end gap-0.5 h-6">
      {Array.from({ length: bars }).map((_, i) => {
        const isActive = i < activeThreshold;
        const intensity = i / bars;
        const color = intensity > 0.75 
          ? 'bg-red-500' 
          : intensity > 0.5 
            ? 'bg-yellow-500' 
            : 'bg-cyan-500';
        
        return (
          <motion.div
            key={i}
            className={`w-1.5 rounded-sm transition-all duration-75 ${
              isActive && isPlaying ? color : 'bg-white/10'
            }`}
            animate={{
              height: isActive && isPlaying ? `${(i + 1) * 2}px` : '4px',
              opacity: isActive && isPlaying ? 1 : 0.3,
            }}
            transition={{ duration: 0.05 }}
          />
        );
      })}
    </div>
  );
};

const ScreenAgentPanel = ({ 
  isOpen, 
  onClose, 
  transparentMode = false, 
  onPlaySound, 
  onTTSSpeakingChange 
}: ScreenAgentPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoConnect, setAutoConnect] = useState(true);
  
  // Settings state
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_VOICE_KEY) || 'Kore';
    } catch {
      return 'Kore';
    }
  });
  
  const [affectiveDialog, setAffectiveDialog] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_AFFECTIVE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  
  const [proactiveAudio, setProactiveAudio] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_PROACTIVE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoConnectedRef = useRef(false);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(LS_VOICE_KEY, selectedVoice);
      localStorage.setItem(LS_AFFECTIVE_KEY, String(affectiveDialog));
      localStorage.setItem(LS_PROACTIVE_KEY, String(proactiveAudio));
    } catch {
      // ignore
    }
  }, [selectedVoice, affectiveDialog, proactiveAudio]);

  // Gemini Audio Player with VU meter
  const audioPlayer = useGeminiAudioPlayer({
    enabled: voiceEnabled,
    onPlayStart: () => console.log('[GeminiAudio] Reprodução iniciada'),
    onPlayEnd: () => console.log('[GeminiAudio] Reprodução finalizada'),
    onAudioLevel: setAudioLevel,
    onError: (err) => console.error('[GeminiAudio] Erro:', err),
  });

  // Notify speaking state changes
  useEffect(() => {
    onTTSSpeakingChange?.(audioPlayer.isPlaying);
  }, [audioPlayer.isPlaying, onTTSSpeakingChange]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const {
    state,
    start,
    stop,
    startScreenShare,
    stopScreenShare,
    startMicrophone,
    stopMicrophone,
    sendTextMessage,
    screenVideoRef,
  } = useGeminiScreenAgent({
    frameRate: 1,
    audioEnabled: true,
    config: {
      model: 'models/gemini-2.0-flash-exp',
      responseModalities: ['AUDIO'],
      voiceName: selectedVoice,
      enableAffectiveDialog: affectiveDialog,
      proactiveAudio: proactiveAudio,
      systemInstruction: `Você é JARVIS, um assistente de IA avançado inspirado no assistente do Tony Stark.
Você pode ver a tela do usuário em tempo real e ajudar com qualquer tarefa.
Seja proativo, observador, inteligente e útil. Use um tom sofisticado mas acessível.
Responda sempre em português brasileiro. Seja conciso nas respostas de voz.
Quando ver código, analise e sugira melhorias. Quando ver problemas, ofereça soluções.`,
    },
    onTranscript: (text) => {
      if (text.trim()) {
        addMessage('user', text);
      }
    },
    onResponse: (text, isFinal) => {
      if (isFinal && text.trim()) {
        addMessage('assistant', text);
      }
    },
    onAudioResponse: (audioBase64) => {
      audioPlayer.queueAudio(audioBase64);
    },
    onError: (error) => {
      console.error('Screen Agent error:', error);
      const msg = error.message || '';
      
      // Auto-retry on connection errors
      if (msg.includes('code=1008') || msg.includes('not supported')) {
        toast.error('Modelo não suportado. Reconectando...', { duration: 3000 });
        setTimeout(() => {
          if (autoConnect) {
            start().catch(console.error);
          }
        }, 2000);
      } else {
        addMessage('assistant', `Erro: ${msg}`);
      }
    },
  });

  // Auto-connect on mount
  useEffect(() => {
    if (isOpen && autoConnect && !hasAutoConnectedRef.current && state.connection === 'disconnected') {
      hasAutoConnectedRef.current = true;
      start().then(() => {
        addMessage('assistant', 'JARVIS conectado. Compartilhe sua tela para que eu possa ver o que você está fazendo.');
      }).catch((err) => {
        console.error('Auto-connect failed:', err);
        toast.error('Falha na conexão automática. Tente manualmente.');
      });
    }
    
    // Reset auto-connect flag when panel closes
    if (!isOpen) {
      hasAutoConnectedRef.current = false;
    }
  }, [isOpen, autoConnect, state.connection, start, addMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Derived state
  const isConnected = state.connection === 'connected';
  const isConnecting = state.connection === 'connecting';
  const isSharing = state.screenShare.isSharing;
  const isMicActive = state.audio.isMicActive;

  const handleConnect = async () => {
    onPlaySound?.('activate');
    if (isConnected) {
      stop();
      audioPlayer.clearQueue();
    } else {
      await start();
      addMessage('assistant', 'Conectado! Compartilhe sua tela para começar.');
    }
  };

  const handleScreenShare = async () => {
    onPlaySound?.('click');
    if (isSharing) {
      stopScreenShare();
      addMessage('assistant', 'Parei de ver sua tela.');
    } else {
      await startScreenShare();
      addMessage('assistant', 'Agora estou vendo sua tela! Pergunte o que quiser.');
    }
  };

  const handleMicrophone = async () => {
    onPlaySound?.('click');
    if (isMicActive) {
      stopMicrophone();
    } else {
      await startMicrophone();
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !isConnected) return;
    
    onPlaySound?.('click');
    addMessage('user', inputText);
    sendTextMessage(inputText);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConnectionColor = () => {
    switch (state.connection) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-white/40';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        initial={{ opacity: 0, x: -300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -300 }}
        className={`fixed left-64 top-1/2 -translate-y-1/2 z-40 cursor-grab active:cursor-grabbing ${
          isExpanded ? 'w-[520px] h-[85vh]' : 'w-[400px] h-[550px]'
        } flex flex-col rounded-xl border backdrop-blur-xl transition-all duration-300 ${
          transparentMode
            ? 'bg-white/10 border-white/20'
            : 'bg-black/95 border-cyan-500/30'
        }`}
        style={{ boxShadow: '0 0 40px rgba(0, 255, 255, 0.1)' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-3 border-b ${
          transparentMode ? 'border-white/20' : 'border-cyan-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <motion.div 
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-white/30'
              }`}
              animate={isConnected ? { 
                boxShadow: ['0 0 0px rgba(74, 222, 128, 0.5)', '0 0 10px rgba(74, 222, 128, 0.8)', '0 0 0px rgba(74, 222, 128, 0.5)']
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/90">JARVIS Screen Agent</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* VU Meter */}
            <VUMeter level={audioLevel} isPlaying={audioPlayer.isPlaying} />
            
            {/* Volume Toggle */}
            <motion.button
              onClick={() => {
                onPlaySound?.('click');
                const newEnabled = !voiceEnabled;
                setVoiceEnabled(newEnabled);
                audioPlayer.setMuted(!newEnabled);
              }}
              onMouseEnter={() => onPlaySound?.('hover')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1.5 rounded transition-colors ${
                voiceEnabled ? 'text-cyan-400 hover:text-cyan-300' : 'text-white/30 hover:text-white/50'
              }`}
              title={voiceEnabled ? 'Áudio ativo' : 'Áudio desativado'}
            >
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={() => setSettingsOpen(!settingsOpen)}
              onMouseEnter={() => onPlaySound?.('hover')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1.5 rounded transition-colors ${
                settingsOpen ? 'text-cyan-400' : 'text-white/50 hover:text-white'
              }`}
            >
              <Settings2 size={14} />
            </motion.button>
            
            {/* Expand/Collapse */}
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              onMouseEnter={() => onPlaySound?.('hover')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded text-white/50 hover:text-white transition-colors"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </motion.button>
            
            {/* Close */}
            <motion.button
              onClick={() => {
                stop();
                onClose();
              }}
              onMouseEnter={() => onPlaySound?.('hover')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded text-white/50 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </motion.button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`overflow-hidden border-b ${
                transparentMode ? 'border-white/20' : 'border-cyan-500/20'
              }`}
            >
              <div className="p-3 space-y-3">
                {/* Voice Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] text-white/60 flex items-center gap-1">
                    <AudioWaveform size={12} />
                    Voz do JARVIS
                  </label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="h-8 bg-white/5 border-white/20 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GEMINI_VOICES.map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex flex-col">
                            <span>{voice.name}</span>
                            <span className="text-[10px] text-white/50">{voice.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Volume Slider */}
                <div className="space-y-1">
                  <label className="text-[11px] text-white/60">Volume</label>
                  <Slider
                    value={[audioPlayer.volume * 100]}
                    onValueChange={([v]) => audioPlayer.setVolume(v / 100)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Advanced Features */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={affectiveDialog}
                      onChange={(e) => setAffectiveDialog(e.target.checked)}
                      className="w-3 h-3 rounded border-white/30 bg-white/10"
                    />
                    <span className="text-[11px] text-white/70 flex items-center gap-1">
                      <Zap size={10} className="text-yellow-400" />
                      Diálogo Afetivo
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proactiveAudio}
                      onChange={(e) => setProactiveAudio(e.target.checked)}
                      className="w-3 h-3 rounded border-white/30 bg-white/10"
                    />
                    <span className="text-[11px] text-white/70 flex items-center gap-1">
                      <Brain size={10} className="text-purple-400" />
                      Áudio Proativo
                    </span>
                  </label>
                </div>

                <p className="text-[10px] text-white/40">
                  Reinicie a conexão após alterar as configurações.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Bar */}
        <div className={`flex items-center justify-center gap-2 p-3 border-b ${
          transparentMode ? 'border-white/20' : 'border-cyan-500/20'
        }`}>
          {/* Connect Button */}
          <motion.button
            onClick={handleConnect}
            onMouseEnter={() => onPlaySound?.('hover')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              isConnected
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
            }`}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isConnected ? (
              <Wifi size={14} />
            ) : (
              <WifiOff size={14} />
            )}
            {isConnecting ? 'Conectando...' : isConnected ? 'Conectado' : 'Conectar'}
          </motion.button>

          {/* Screen Share Button */}
          <motion.button
            onClick={handleScreenShare}
            onMouseEnter={() => onPlaySound?.('hover')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              isSharing
                ? 'bg-cyan-500/30 border border-cyan-500/60 text-cyan-300'
                : 'bg-white/10 border border-white/20 text-white/70 hover:text-white hover:border-white/40'
            }`}
            disabled={!isConnected}
          >
            {isSharing ? <Monitor size={14} /> : <MonitorOff size={14} />}
            {isSharing ? 'Compartilhando' : 'Tela'}
          </motion.button>

          {/* Microphone Button */}
          <motion.button
            onClick={handleMicrophone}
            onMouseEnter={() => onPlaySound?.('hover')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              isMicActive
                ? 'bg-purple-500/30 border border-purple-500/60 text-purple-300'
                : 'bg-white/10 border border-white/20 text-white/70 hover:text-white hover:border-white/40'
            }`}
            disabled={!isConnected}
          >
            {isMicActive ? <Mic size={14} /> : <MicOff size={14} />}
            {isMicActive ? 'Mic On' : 'Mic'}
          </motion.button>
        </div>

        {/* Screen Preview */}
        <video ref={screenVideoRef} autoPlay muted className="hidden" />
        
        {isSharing && (
          <div className={`relative h-28 mx-3 mt-3 rounded-lg overflow-hidden border ${
            transparentMode ? 'border-white/20' : 'border-cyan-500/30'
          }`}>
            <video 
              ref={screenVideoRef}
              autoPlay 
              muted 
              className="w-full h-full object-contain bg-black/50"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/30 text-red-400">
              <motion.div 
                className="w-1.5 h-1.5 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[10px] font-mono">LIVE</span>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-white/40 text-xs py-8">
                <Monitor className="mx-auto mb-3 opacity-50" size={28} />
                <p className="text-sm text-white/60 mb-1">JARVIS Screen Agent</p>
                <p className="text-white/40">Conectando automaticamente...</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 text-cyan-100 rounded-br-sm border border-cyan-500/30'
                      : 'bg-white/10 text-white/90 rounded-bl-sm border border-white/10'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-[10px] opacity-50 mt-1 block">
                      {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className={`p-3 border-t ${
          transparentMode ? 'border-white/20' : 'border-cyan-500/20'
        }`}>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isConnected ? "Digite sua pergunta..." : "Aguardando conexão..."}
              disabled={!isConnected}
              className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm rounded-lg"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !inputText.trim()}
              size="icon"
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 rounded-lg"
            >
              <Send size={16} />
            </Button>
          </div>
          
          {/* Status Bar */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span className={`text-[10px] ${getConnectionColor()}`}>
              {state.connection === 'connected' ? '● Gemini 2.5 Flash Native Audio' : 
               state.connection === 'connecting' ? '◌ Conectando...' :
               state.connection === 'error' ? '✕ Erro de conexão' : '○ Desconectado'}
            </span>
            <span className="text-[10px] text-white/30">
              Voz: {selectedVoice}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScreenAgentPanel;
