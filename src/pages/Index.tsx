import { useState } from 'react';
import HUDOverlay from '@/components/hud/HUDOverlay';
import type { LogEntry } from '@/components/hud/NeuralFeed';

const Index = () => {
  // These props can be connected to backend logic
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[] | undefined>(undefined);

  const handleActivateVoice = () => {
    setIsListening(true);
    // Simulate voice activation
    setTimeout(() => {
      setIsListening(false);
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 3000);
    }, 3000);
  };

  const handleIntelScan = () => {
    console.log('Intel scan triggered');
  };

  const handleSettings = () => {
    console.log('Settings opened');
  };

  const handleMinimize = () => {
    console.log('Window minimized');
  };

  const handleClose = () => {
    console.log('Window closed');
  };

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden">
      {/* 
        For actual desktop overlay use, change bg-background to bg-transparent
        The current dark background is for preview purposes
      */}
      <HUDOverlay
        isListening={isListening}
        isProcessing={isProcessing}
        logs={logs}
        onActivateVoice={handleActivateVoice}
        onIntelScan={handleIntelScan}
        onSettings={handleSettings}
        onMinimize={handleMinimize}
        onClose={handleClose}
      />
    </div>
  );
};

export default Index;
