"use client";

import Image from 'next/image';
import { useTransition, useState, useEffect } from 'react';
import { HardDriveDownload, Package, Ship, Trash2 } from 'lucide-react';
import type { VideoFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface VideoCardProps {
  video: VideoFile;
  onRename: (path: string, newName: string) => void;
  onExclude: (path: string) => void;
}

const renameOptions = [
  { name: 'Стрельников', icon: HardDriveDownload },
  { name: 'Отправка груза', icon: Ship },
  { name: 'Выдача груза', icon: Package },
];

export function VideoCard({ video, onRename, onExclude }: VideoCardProps) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    // Create a seed that is less likely to have special characters
    const imageSeed = encodeURIComponent(video.id.replace(/[^a-zA-Z0-9]/g, ''));

    const generateThumbnail = async (videoHandle?: FileSystemFileHandle) => {
      if (!videoHandle) {
        // Fallback for mock data or when handle is not available
        setImageUrl(`https://picsum.photos/seed/${imageSeed}/400/225`);
        return;
      }
      try {
        const file = await videoHandle.getFile();
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(file);
        videoElement.currentTime = 1; // Seek to 1 second
        
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
        }

      } catch (error) {
        console.error("Error generating thumbnail:", error);
        if (!isCancelled) {
          setImageUrl(`https://picsum.photos/seed/${imageSeed}/400/225`);
        }
      }
    };

    generateThumbnail(video.handle);

    return () => {
      isCancelled = true;
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Card className={`flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPending ? 'opacity-60 animate-pulse' : ''}`}>
          <CardHeader className="p-0">
            <div className="relative aspect-video">
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
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-sm font-medium break-all" title={video.name}>
              {video.name}
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
                  e.stopPropagation(); // Prevent dropdown from closing
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={handleExclude} disabled={isPending} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Исключить папку</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
