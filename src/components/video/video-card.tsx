"use client";

import Image from 'next/image';
import { useTransition } from 'react';
import { HardDriveDownload, Package, Ship, Trash2 } from 'lucide-react';
import type { VideoFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

  const imageUrl = `https://picsum.photos/seed/${video.id}/400/225`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Card className={`flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPending ? 'opacity-60 animate-pulse' : ''}`}>
          <CardHeader className="p-0">
            <div className="relative aspect-video">
              <Image
                src={imageUrl}
                alt={`Preview for ${video.name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint="video still"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-sm font-medium break-all" title={video.name}>
              {video.name}
            </CardTitle>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex-col items-stretch gap-2">
            {renameOptions.map(option => (
              <Button
                key={option.name}
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={() => handleRename(option.name)}
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
        <DropdownMenuItem onClick={handleExclude} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Исключить папку</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
