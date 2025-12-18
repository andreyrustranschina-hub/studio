"use client";

import { useState, useEffect, useCallback } from 'react';
import type { VideoFile } from '@/lib/types';
import { scanVideosAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";

export function useVideoScanner() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const loadVideos = useCallback(() => {
    setIsScanning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 100);

    scanVideosAction().then(foundVideos => {
      clearInterval(interval);
      setProgress(100);
      setVideos(foundVideos);
      setTimeout(() => {
        setIsScanning(false);
      }, 500);
    }).catch(error => {
        console.error("Scan failed:", error);
        clearInterval(interval);
        toast({
          variant: "destructive",
          title: "Scan Failed",
          description: "Could not load video files.",
        });
        setIsScanning(false);
    });
  }, [toast]);
  
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return { videos, setVideos, isScanning, progress, reload: loadVideos };
}
