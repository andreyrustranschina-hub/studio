"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { VideoGrid } from '@/components/video/video-grid';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import type { VideoFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';

const videoExtensions = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];

export default function Home() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [excludedFolders, setExcludedFolders] = useState<string[]>([]);
  const { toast } = useToast();

  const handleScan = async () => {
    if (typeof window.showDirectoryPicker !== 'function') {
      toast({
        variant: 'destructive',
        title: 'Браузер не поддерживается',
        description: 'Для этой функции требуется браузер с поддержкой File System Access API.',
      });
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker();
      setIsScanning(true);
      setVideos([]);
      setProgress(0);

      const foundVideos: VideoFile[] = [];
      const processDirectory = async (directoryHandle: FileSystemDirectoryHandle, path: string) => {
        for await (const entry of directoryHandle.values()) {
          const currentPath = `${path}/${entry.name}`;
          if (excludedFolders.some(excluded => currentPath.startsWith(excluded))) {
            continue;
          }

          if (entry.kind === 'file' && videoExtensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
            const file = await entry.getFile();
            foundVideos.push({
              id: `${file.name}-${file.lastModified}`,
              path: currentPath,
              name: file.name,
              handle: entry,
            });
          } else if (entry.kind === 'directory') {
            // This is a rough progress calculation, assuming linear scan time.
            // A more accurate progress would require counting all files first.
            setProgress(p => Math.min(p + 0.1, 95));
            await processDirectory(entry, currentPath);
          }
        }
      };

      await processDirectory(dirHandle, dirHandle.name);

      setProgress(100);
      setVideos(foundVideos);
      toast({
        title: "Сканирование завершено",
        description: `Найдено ${foundVideos.length} видео.`,
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Ошибка сканирования:", error);
        toast({
          variant: "destructive",
          title: "Ошибка сканирования",
          description: "Не удалось прочитать файлы из выбранной папки.",
        });
      }
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 500);
    }
  };

  const handleRename = (path: string, newName: string) => {
    // This is a UI-only rename as we can't modify the user's file system directly.
    const videoToUpdate = videos.find(v => v.path === path);
    if (!videoToUpdate) return;

    const extension = videoToUpdate.name.substring(videoToUpdate.name.lastIndexOf('.'));
    const finalName = `${newName}${extension}`;
    
    // Check for name conflicts in the UI state
    let conflictCounter = 1;
    let tempName = finalName;
    while(videos.some(v => v.name === tempName && v.path !== path)) {
        tempName = `${newName}_${conflictCounter}${extension}`;
        conflictCounter++;
    }

    setVideos(currentVideos =>
      currentVideos.map(v => (v.path === path ? { ...v, name: tempName } : v))
    );
    toast({
      title: "Файл переименован (в приложении)",
      description: `Файл "${videoToUpdate.name}" теперь отображается как "${tempName}".`,
    });
  };

  const handleExclude = (path: string) => {
    const folderPath = path.substring(0, path.lastIndexOf('/'));
    if (!excludedFolders.includes(folderPath)) {
      setExcludedFolders(prev => [...prev, folderPath]);
    }
    setVideos(currentVideos => 
      currentVideos.filter(v => !v.path.startsWith(folderPath))
    );
    toast({
      title: "Папка исключена",
      description: `Папка "${folderPath}" будет проигнорирована при следующем сканировании.`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onScan={handleScan} isScanning={isScanning} />
      <main className="container mx-auto p-4 md:p-8">
        {isScanning ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <p className="text-muted-foreground">Сканирование выбранной папки...</p>
            <Progress value={progress} className="w-full max-w-md" />
          </div>
        ) : videos.length > 0 ? (
          <VideoGrid videos={videos} onRename={handleRename} onExclude={handleExclude} />
        ) : (
          <div className="text-center py-24">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-medium text-muted-foreground">Папка не выбрана</h2>
            <p className="text-muted-foreground mt-2">Нажмите "Выбрать папку для сканирования", чтобы начать.</p>
            <Button onClick={handleScan} className="mt-6">
              Выбрать папку для сканирования
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
