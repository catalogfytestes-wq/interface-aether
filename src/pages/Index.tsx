import { useState } from 'react';
import HUDOverlay from '@/components/hud/HUDOverlay';

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 
        Para usar como overlay real de desktop, mude para bg-transparent
        O fundo escuro atual é para visualização no preview
      */}
      <HUDOverlay
        isListening={isListening}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default Index;
