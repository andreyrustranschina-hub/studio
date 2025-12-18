
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { VideoFile } from "@/lib/types";

interface VideoPlayerDialogProps {
  video: VideoFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPlayerDialog({ video, open, onOpenChange }: VideoPlayerDialogProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const generateSrc = async () => {
      if (open && video.handle) {
        try {
          const file = await video.handle.getFile();
          objectUrl = URL.createObjectURL(file);
          setVideoSrc(objectUrl);
        } catch (error) {
          console.error("Error creating object URL for video:", error);
          setVideoSrc(null);
        }
      }
    };

    generateSrc();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setVideoSrc(null);
    };
  }, [video, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="truncate">{video.name}</DialogTitle>
          <DialogDescription className="truncate">{video.path}</DialogDescription>
        </DialogHeader>
        <div className="aspect-video">
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              autoPlay
              className="w-full h-full object-contain bg-black"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black text-white">
              Loading video...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
