import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

interface Track {
  title: string;
  artist: string;
  duration: number;
}

interface MusicPlayerProps {
  track?: Track;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const MusicPlayer = ({
  track: externalTrack,
  isPlaying: externalIsPlaying,
  onPlayPause,
  onNext,
  onPrev,
}: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(externalIsPlaying || false);
  const [waveData, setWaveData] = useState<number[]>(Array(32).fill(0));
  const [progress, setProgress] = useState(0);

  const defaultTrack: Track = {
    title: 'SISTEMA ATIVO',
    artist: 'AETHER.OS',
    duration: 180,
  };

  const track = externalTrack || defaultTrack;

  // Simulate audio wave visualization
  useEffect(() => {
    if (!isPlaying) {
      setWaveData(Array(32).fill(5));
      return;
    }

    const interval = setInterval(() => {
      setWaveData(
        Array(32).fill(0).map(() => Math.random() * 100)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Simulate progress
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    onPlayPause?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * track.duration;

  return (
    <div className="hud-glass holo-border p-4 w-64">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-3 h-3 text-primary/60" />
        <span className="text-[9px] uppercase tracking-widest text-primary/60 font-orbitron">
          PLAYER DE ÁUDIO
        </span>
      </div>

      {/* Wave visualization */}
      <div className="h-16 flex items-center justify-center gap-0.5 mb-4 px-2">
        {waveData.map((height, i) => (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-primary/30 to-primary rounded-full"
            animate={{ 
              height: `${Math.max(8, height * 0.6)}%`,
              opacity: isPlaying ? [0.5, 1, 0.5] : 0.3,
            }}
            transition={{ 
              height: { duration: 0.1 },
              opacity: { duration: 0.5, repeat: Infinity, delay: i * 0.02 }
            }}
          />
        ))}
      </div>

      {/* Track info */}
      <div className="text-center mb-3">
        <motion.div
          className="text-xs font-orbitron text-primary truncate"
          animate={isPlaying ? { opacity: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {track.title}
        </motion.div>
        <div className="text-[9px] text-primary/50 font-mono mt-0.5">
          {track.artist}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/60 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[8px] font-mono text-primary/40">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          className="p-2 hover:bg-primary/10 rounded-full transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onPrev}
        >
          <SkipBack className="w-4 h-4 text-primary/60" />
        </motion.button>

        <motion.button
          className="p-3 bg-primary/20 hover:bg-primary/30 rounded-full transition-colors border border-primary/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-primary" />
          ) : (
            <Play className="w-5 h-5 text-primary ml-0.5" />
          )}
        </motion.button>

        <motion.button
          className="p-2 hover:bg-primary/10 rounded-full transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onNext}
        >
          <SkipForward className="w-4 h-4 text-primary/60" />
        </motion.button>
      </div>
    </div>
  );
};

export default MusicPlayer;
