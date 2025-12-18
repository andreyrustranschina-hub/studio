"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { VideoGrid } from '@/components/video/video-grid';
import { useToast } from "@/hooks/use-toast";
import type { VideoFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FolderOpen, Loader2 } from 'lucide-react';

const videoExtensions = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];

// This type alias is for clarity, representing the root directory handle.
type DirectoryHandle = FileSystemDirectoryHandle;

export default function Home() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [excludedFolders, setExcludedFolders] = useState<string[]>([]);
  const [rootHandle, setRootHandle] = useState<DirectoryHandle | null>(null);
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
      // Request read and write permissions
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setRootHandle(dirHandle);
      setIsScanning(true);
      setVideos([]);
      let filesFound = 0;

      const processDirectory = async (directoryHandle: FileSystemDirectoryHandle, path: string) => {
        if (isScanning === false) return;
        for await (const entry of directoryHandle.values()) {
          const currentPath = `${path}/${entry.name}`;
          if (excludedFolders.some(excluded => currentPath.startsWith(excluded))) {
            continue;
          }

          if (entry.kind === 'file' && videoExtensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
            const file = await entry.getFile();
            const newVideo: VideoFile = {
              id: `${file.name}-${file.lastModified}`,
              path: currentPath,
              name: file.name,
              handle: entry,
            };
            setVideos(prevVideos => [...prevVideos, newVideo]);
            filesFound++;
          } else if (entry.kind === 'directory') {
            await processDirectory(entry, currentPath);
          }
        }
      };

      await processDirectory(dirHandle, dirHandle.name);

      toast({
        title: "Сканирование завершено",
        description: `Найдено ${filesFound} видео.`,
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled the picker
      } else if (error.name === 'NotAllowedError') {
        toast({
          variant: "destructive",
          title: "Разрешение не предоставлено",
          description: "Невозможно изменить файлы без разрешения на запись.",
        });
        // You might want to fall back to a read-only mode here
      }
      else {
        console.error("Ошибка сканирования:", error);
        toast({
          variant: "destructive",
          title: "Ошибка сканирования",
          description: "Не удалось прочитать файлы из выбранной папки.",
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleRename = async (path: string, newName: string) => {
    const videoToUpdate = videos.find(v => v.path === path);
    if (!videoToUpdate || !videoToUpdate.handle) return;
    
    // Check if we have a handle with write permissions
    if (!rootHandle) {
         toast({
            variant: "destructive",
            title: "Переименование невозможно",
            description: "Корневая папка не была выбрана с правами на запись.",
        });
        return;
    }

    const oldName = videoToUpdate.name;
    const extension = oldName.substring(oldName.lastIndexOf('.'));
    const finalNewName = `${newName}${extension}`;

    try {
        // The 'move' method is available on FileSystemFileHandle to rename it.
        // It requires a directory handle, but we can just use the handle itself to move/rename in place.
        // The spec is a bit tricky here. To rename, you 'move' it within its current directory.
        // For that, we need the parent directory handle.
        
        const pathParts = videoToUpdate.path.split('/').slice(1, -1); // remove root dir name and filename
        let currentDirHandle: FileSystemDirectoryHandle = rootHandle;

        for (const part of pathParts) {
            currentDirHandle = await currentDirHandle.getDirectoryHandle(part);
        }

        // Now we have the parent directory handle, we can move the file.
        // Note: The File System Access API does not have a direct 'rename' method. 'move' is used.
        // The first argument to `move` is the destination directory.
        await videoToUpdate.handle.move(currentDirHandle, finalNewName);
        
        const newPath = `${path.substring(0, path.lastIndexOf('/'))}/${finalNewName}`;

        setVideos(currentVideos =>
            currentVideos.map(v => (v.id === videoToUpdate.id ? { ...v, name: finalNewName, path: newPath } : v))
        );

        toast({
            title: "Файл переименован",
            description: `"${oldName}" был переименован в "${finalNewName}" на вашем диске.`,
        });

    } catch (error: any) {
        console.error("Ошибка переименования:", error);
        let description = "Произошла неизвестная ошибка.";
        if (error.name === 'NotAllowedError') {
            description = "У вас нет прав на изменение этого файла. Пожалуйста, предоставьте доступ на запись при выборе папки.";
        } else if (error.name === 'InvalidModificationError') {
            description = "Файл с таким именем уже существует.";
        }
        
        toast({
            variant: "destructive",
            title: "Ошибка переименования",
            description: description,
        });
    }
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
  
  const stopScan = () => {
    setIsScanning(false);
    toast({
      title: "Сканирование остановлено",
      description: "Процесс сканирования был прерван пользователем.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onScan={handleScan} isScanning={isScanning} onStopScan={stopScan} />
      <main className="container mx-auto p-4 md:p-8">
        {isScanning && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Сканирование выбранной папки...</p>
          </div>
        )}

        {videos.length > 0 ? (
           <>
            {isScanning && (
              <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Идет сканирование... Найдено: {videos.length}</span>
              </div>
            )}
            <VideoGrid videos={videos} onRename={handleRename} onExclude={handleExclude} />
           </>
        ) : !isScanning ? (
          <div className="text-center py-24">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-medium text-muted-foreground">Папка не выбрана</h2>
            <p className="text-muted-foreground mt-2">Нажмите "Выбрать папку для сканирования", чтобы начать.</p>
            <Button onClick={handleScan} className="mt-6">
              Выбрать папку для сканирования
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
