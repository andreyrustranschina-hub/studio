
"use client";

import Image from 'next/image';
import { useTransition, useState, useEffect, useRef } from 'react';
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
  const imageSeed = useRef(video.id.replace(/[^a-zA-Z0-9]/g, ''));

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | undefined;

    const generateThumbnail = async () => {
        if (!video.handle) {
            if (!isCancelled) setImageUrl(`https://picsum.photos/seed/${imageSeed.current}/400/225`);
            return;
        }

        try {
            const file = await video.handle.getFile();
            objectUrl = URL.createObjectURL(file);
            const videoElement = document.createElement('video');
            videoElement.src = objectUrl;
            videoElement.currentTime = 1; // Seek to 1 second

            const onLoadedData = () => {
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
                videoElement.removeEventListener('loadeddata', onLoadedData);
                videoElement.removeEventListener('error', onError);
            };

            const onError = () => {
                if (!isCancelled) {
                    setImageUrl(`https://picsum.photos/seed/${imageSeed.current}/400/225`);
                }
                URL.revokeObjectURL(videoElement.src);
                videoElement.removeEventListener('loadeddata', onLoadedData);
                videoElement.removeEventListener('error', onError);
            };
            
            videoElement.addEventListener('loadeddata', onLoadedData);
            videoElement.addEventListener('error', onError);

        } catch (error) {
            console.error("Error generating thumbnail for", video.name, error);
            if (!isCancelled) {
                setImageUrl(`https://picsum.photos/seed/${imageSeed.current}/400/225`);
            }
        }
    };

    if (!imageUrl) {
        generateThumbnail();
    }

    return () => {
        isCancelled = true;
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [video.handle, video.name, imageUrl]);
  
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
                  unoptimized={imageUrl.startsWith('data:')} // Disable optimization for data URIs
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
