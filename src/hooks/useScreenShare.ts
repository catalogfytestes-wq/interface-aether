// Screen Sharing Hook
// Captures screen content and provides frames for AI analysis

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ScreenShareState } from '@/lib/gemini/types';

interface UseScreenShareOptions {
  frameRate?: number; // Frames per second for capture
  quality?: number; // JPEG quality 0-1
  maxWidth?: number;
  maxHeight?: number;
  onFrame?: (base64Frame: string) => void;
  onError?: (error: Error) => void;
}

interface UseScreenShareReturn {
  state: ScreenShareState;
  startSharing: () => Promise<void>;
  stopSharing: () => void;
  captureFrame: () => Promise<string | null>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useScreenShare(options: UseScreenShareOptions = {}): UseScreenShareReturn {
  const {
    frameRate = 1, // 1 FPS by default (sufficient for AI analysis)
    quality = 0.8,
    maxWidth = 1280,
    maxHeight = 720,
    onFrame,
    onError,
  } = options;

  const [state, setState] = useState<ScreenShareState>({
    isSharing: false,
    stream: null,
    error: null,
    frameRate,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  // Create canvas on mount
  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
    return () => {
      canvasRef.current = null;
    };
  }, []);

  // Capture a single frame as base64
  const captureFrame = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !state.stream) {
      return null;
    }

    try {
      // Calculate dimensions maintaining aspect ratio
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, width, height);
      
      // Get base64 without the data URL prefix
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      
      return base64;
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }, [state.stream, quality, maxWidth, maxHeight]);

  // Start frame capture loop
  const startFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    if (!onFrame) return;

    const intervalMs = Math.floor(1000 / frameRate);
    
    frameIntervalRef.current = window.setInterval(async () => {
      const frame = await captureFrame();
      if (frame) {
        onFrame(frame);
      }
    }, intervalMs);
  }, [frameRate, captureFrame, onFrame]);

  // Stop frame capture loop
  const stopFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }, []);

  // Start screen sharing
  const startSharing = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false, // We handle audio separately
      });

      // Set up video element
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      // Handle stream end (user clicks "Stop sharing")
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopSharing();
      });

      setState({
        isSharing: true,
        stream,
        error: null,
        frameRate,
      });

      // Start capturing frames if callback provided
      if (onFrame) {
        // Wait for video to be ready
        setTimeout(startFrameCapture, 500);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start screen sharing';
      console.error('Screen share error:', error);
      
      setState(prev => ({
        ...prev,
        isSharing: false,
        stream: null,
        error: errorMessage,
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [frameRate, onFrame, onError, startFrameCapture]);

  // Stop screen sharing
  const stopSharing = useCallback(() => {
    stopFrameCapture();

    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setState({
      isSharing: false,
      stream: null,
      error: null,
      frameRate,
    });
  }, [state.stream, frameRate, stopFrameCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFrameCapture();
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    state,
    startSharing,
    stopSharing,
    captureFrame,
    videoRef,
  };
}
