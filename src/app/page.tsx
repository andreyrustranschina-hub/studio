
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
  const [recursiveScan, setRecursiveScan] = useState(true);
  const [scanController, setScanController] = useState<AbortController | null>(null);

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
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setRootHandle(dirHandle);
      setIsScanning(true);
      setVideos([]);
      
      const controller = new AbortController();
      setScanController(controller);

      let filesFound = 0;

      const processDirectory = async (directoryHandle: FileSystemDirectoryHandle, path: string) => {
        if (controller.signal.aborted) return;
        
        for await (const entry of directoryHandle.values()) {
          if (controller.signal.aborted) return;
          
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
          } else if (entry.kind === 'directory' && recursiveScan) {
            await processDirectory(entry, currentPath);
          }
        }
      };

      await processDirectory(dirHandle, dirHandle.name);

      if (!controller.signal.aborted) {
        toast({
          title: "Сканирование завершено",
          description: `Найдено ${filesFound} видео.`,
        });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled the directory picker.
        // This does not trigger on our custom stop button.
      } else if (error.name === 'NotAllowedError') {
        toast({
          variant: "destructive",
          title: "Разрешение не предоставлено",
          description: "Невозможно изменить файлы без разрешения на запись.",
        });
      } else {
        console.error("Ошибка сканирования:", error);
        toast({
          variant: "destructive",
          title: "Ошибка сканирования",
          description: "Не удалось прочитать файлы из выбранной папки.",
        });
      }
    } finally {
      setIsScanning(false);
      setScanController(null);
    }
  };

  const handleRename = async (path: string, newName: string) => {
    const videoToUpdate = videos.find(v => v.path === path);
    if (!videoToUpdate || !videoToUpdate.handle) return;
    
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
        const pathParts = videoToUpdate.path.split('/').slice(1, -1);
        let currentDirHandle: FileSystemDirectoryHandle = rootHandle;

        for (const part of pathParts) {
            currentDirHandle = await currentDirHandle.getDirectoryHandle(part);
        }
        
        await (videoToUpdate.handle as FileSystemFileHandle).move(currentDirHandle, finalNewName);
        
        const newPath = `${path.substring(0, path.lastIndexOf('/'))}/${finalNewName}`;

        // Get the new handle after move
        const newFileHandle = await currentDirHandle.getFileHandle(finalNewName);

        setVideos(currentVideos =>
            currentVideos.map(v => (v.id === videoToUpdate.id ? { ...v, name: finalNewName, path: newPath, handle: newFileHandle } : v))
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
        } else if (error.name === 'NoModificationAllowedError') {
            description = 'Невозможно изменить файл. Возможно, у вас нет прав на запись в эту папку.';
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
    if (scanController) {
      scanController.abort();
      setIsScanning(false);
      toast({
        title: "Сканирование остановлено",
        description: "Процесс сканирования был прерван пользователем.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        onScan={handleScan} 
        isScanning={isScanning} 
        onStopScan={stopScan}
        recursiveScan={recursiveScan}
        onRecursiveScanChange={setRecursiveScan}
      />
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
