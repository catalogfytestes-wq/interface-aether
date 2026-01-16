import { useState, useRef, useEffect } from 'react';
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
  Minimize2
} from 'lucide-react';
import { useGeminiScreenAgent } from '@/hooks/useGeminiScreenAgent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScreenAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  transparentMode?: boolean;
  onPlaySound?: (type: 'hover' | 'click' | 'activate') => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ScreenAgentPanel = ({ isOpen, onClose, transparentMode = false, onPlaySound }: ScreenAgentPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    onError: (error) => {
      console.error('Screen Agent error:', error);
      addMessage('assistant', `Erro: ${error.message}`);
    },
  });

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Derived state helpers
  const isConnected = state.connection === 'connected';
  const isConnecting = state.connection === 'connecting';
  const isSharing = state.screenShare.isSharing;
  const isMicActive = state.audio.isMicActive;

  const handleConnect = async () => {
    onPlaySound?.('activate');
    if (isConnected) {
      stop();
    } else {
      await start();
      addMessage('assistant', 'Conectado! Compartilhe sua tela para eu poder ver o que você está fazendo.');
    }
  };

  const handleScreenShare = async () => {
    onPlaySound?.('click');
    if (isSharing) {
      stopScreenShare();
      addMessage('assistant', 'Parei de ver sua tela.');
    } else {
      await startScreenShare();
      addMessage('assistant', 'Agora estou vendo sua tela! Pode me perguntar qualquer coisa sobre o que estou vendo.');
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

  const getConnectionStatusColor = () => {
    switch (state.connection) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-white/40';
    }
  };

  const getConnectionStatusText = () => {
    switch (state.connection) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Erro';
      default:
        return 'Desconectado';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        // ALTERAÇÃO 1: Animação vindo da esquerda (negativo)
        initial={{ opacity: 0, x: -300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -300 }}
        // ALTERAÇÃO 2: Posição 'left-24' para ficar após a barra lateral
        className={`fixed left-24 top-1/2 -translate-y-1/2 z-50 ${
          isExpanded ? 'w-[500px] h-[80vh]' : 'w-[380px] h-[500px]'
        } flex flex-col rounded-lg border backdrop-blur-xl transition-all duration-300 ${
          transparentMode
            ? 'bg-white/10 border-white/20'
            : 'bg-black/90 border-white/10'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-3 border-b ${
          transparentMode ? 'border-white/20' : 'border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-white/30'
            }`} />
            <span className="text-sm font-medium text-white/80">Screen Agent</span>
            <span className={`text-xs ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              onMouseEnter={() => onPlaySound?.('hover')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded text-white/50 hover:text-white transition-colors"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </motion.button>
            <motion.button
              onClick={onClose}
              onMouseEnter={() => onPlaySound?.('hover')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded text-white/50 hover:text-white transition-colors"
            >
              <X size={14} />
            </motion.button>
          </div>
        </div>

        {/* Control Bar */}
        <div className={`flex items-center justify-center gap-3 p-3 border-b ${
          transparentMode ? 'border-white/20' : 'border-white/10'
        }`}>
          {/* Connect Button */}
          <motion.button
            onClick={handleConnect}
            onMouseEnter={() => onPlaySound?.('hover')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              isConnected
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-white/10 border border-white/20 text-white/70 hover:text-white hover:border-white/40'
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
            {isConnected ? 'Conectado' : 'Conectar'}
          </motion.button>

          {/* Screen Share Button */}
          <motion.button
            onClick={handleScreenShare}
            onMouseEnter={() => onPlaySound?.('hover')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              isSharing
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                : 'bg-white/10 border border-white/20 text-white/70 hover:text-white hover:border-white/40'
            }`}
            disabled={!isConnected}
          >
            {isSharing ? <Monitor size={14} /> : <MonitorOff size={14} />}
            {isSharing ? 'Compartilhando' : 'Compartilhar'}
          </motion.button>

          {/* Microphone Button */}
          <motion.button
            onClick={handleMicrophone}
            onMouseEnter={() => onPlaySound?.('hover')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              isMicActive
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                : 'bg-white/10 border border-white/20 text-white/70 hover:text-white hover:border-white/40'
            }`}
            disabled={!isConnected}
          >
            {isMicActive ? <Mic size={14} /> : <MicOff size={14} />}
            {isMicActive ? 'Mic On' : 'Mic Off'}
          </motion.button>
        </div>

        {/* Screen Preview (hidden video element + preview) */}
        <video ref={screenVideoRef} autoPlay muted className="hidden" />
        
        {isSharing && (
          <div className={`relative h-32 mx-3 mt-3 rounded overflow-hidden border ${
            transparentMode ? 'border-white/20' : 'border-white/10'
          }`}>
            <video 
              ref={screenVideoRef}
              autoPlay 
              muted 
              className="w-full h-full object-contain bg-black/50"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono">LIVE</span>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-white/40 text-xs py-8">
                <Monitor className="mx-auto mb-2 opacity-50" size={24} />
                <p>Conecte-se e compartilhe sua tela</p>
                <p>para começar a conversar com o JARVIS</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 text-cyan-100 rounded-br-sm'
                      : 'bg-white/10 text-white/80 rounded-bl-sm'
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
          transparentMode ? 'border-white/20' : 'border-white/10'
        }`}>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isConnected ? "Digite sua pergunta..." : "Conecte-se primeiro..."}
              disabled={!isConnected}
              className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !inputText.trim()}
              size="icon"
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence