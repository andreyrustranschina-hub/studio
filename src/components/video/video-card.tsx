
"use client";

import Image from 'next/image';
import { useTransition, useState, useEffect } from 'react';
import { HardDriveDownload, Package, Ship, Trash2, PlayCircle } from 'lucide-react';
import type { VideoFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface VideoCardProps {
  video: VideoFile;
  onRename: (path: string, newName: string) => void;
  onExclude: (path: string) => void;
  onPlay: (video: VideoFile) => void;
}

const renameOptions = [
  { name: 'Стрельников', icon: HardDriveDownload },
  { name: 'Отправка груза', icon: Ship },
  { name: 'Выдача груза', icon: Package },
];

export function VideoCard({ video, onRename, onExclude, onPlay }: VideoCardProps) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | undefined;

    const generateThumbnail = async (videoHandle?: FileSystemFileHandle) => {
        // Sanitize the seed to be URL-friendly, allowing only alphanumeric characters.
        const imageSeed = video.id.replace(/[^a-zA-Z0-9]/g, '');
        
        if (!videoHandle) {
            setImageUrl(`https://picsum.photos/seed/${imageSeed}/400/225`);
            return;
        }

        try {
            const file = await videoHandle.getFile();
            objectUrl = URL.createObjectURL(file);
            const videoElement = document.createElement('video');
            videoElement.src = objectUrl;
            videoElement.currentTime = 1;

            videoElement.onloadeddata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    if (!isCancelled) {
                        setImageUrl(canvas.toDataURL('image/jpeg'));
                    }
                }
                URL.revokeObjectURL(videoElement.src);
            };

            videoElement.onerror = () => {
                if (!isCancelled) {
                    setImageUrl(`https://picsum.photos/seed/${imageSeed}/400/225`);
                }
                URL.revokeObjectURL(videoElement.src);
            };
        } catch (error) {
            console.error("Error generating thumbnail:", error);
            if (!isCancelled) {
                setImageUrl(`https://picsum.photos/seed/${imageSeed}/400/225`);
            }
        }
    };

    if (!imageUrl) {
        generateThumbnail(video.handle);
    }

    return () => {
        isCancelled = true;
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [video.handle, video.id, imageUrl]);
  
  const handleRename = (newName: string) => {
    startTransition(() => {
      onRename(video.path, newName);
    });
  };
  
  const handleExclude = () => {
    startTransition(() => {
      onExclude(video.path);
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening video player if a button inside the card was clicked
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onPlay(video);
  };

  return (
    <DropdownMenu>
        <Card 
          onClick={handleCardClick}
          className={`flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isPending ? 'opacity-60 animate-pulse' : ''}`}
        >
          <CardHeader className="p-0">
            <div className="relative aspect-video group">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={`Preview for ${video.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  data-ai-hint="video still"
                />
              ) : (
                <Skeleton className="h-full w-full" />
              )}
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle className="h-16 w-16 text-white/80" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-sm font-medium break-all" title={video.name}>
              <DropdownMenuTrigger asChild>
                <span className="cursor-pointer hover:underline">{video.name}</span>
              </DropdownMenuTrigger>
            </CardTitle>
             <p className="text-xs text-muted-foreground break-all mt-1" title={video.path}>
              {video.path}
            </p>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex-col items-stretch gap-2">
            {renameOptions.map(option => (
              <Button
                key={option.name}
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={(e) => {
                  e.stopPropagation(); 
                  handleRename(option.name);
                }}
                disabled={isPending}
              >
                <option.icon className="h-4 w-4 text-muted-foreground" />
                <span>{option.name}</span>
              </Button>
            ))}
          </CardFooter>
        </Card>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={handleExclude} disabled={isPending} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Исключить папку</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
