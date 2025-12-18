"use client";

import { useTransition } from 'react';
import { renameVideoAction, excludeFolderAction } from '@/app/actions';
import { Header } from '@/components/layout/header';
import { VideoGrid } from '@/components/video/video-grid';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { useVideoScanner } from '@/hooks/use-video-scanner';

export default function Home() {
  const { videos, setVideos, isScanning, progress, reload } = useVideoScanner();
  const { toast } = useToast();

  const handleRename = (path: string, newName: string) => {
    renameVideoAction(path, newName).then((updatedVideo) => {
        toast({
          title: "Success",
          description: `File renamed to ${updatedVideo.name}.`,
        });
        setVideos(currentVideos =>
          currentVideos.map(v => (v.id === updatedVideo.id ? updatedVideo : v))
        );
    }).catch(error => {
        console.error("Rename failed:", error);
        toast({
          variant: "destructive",
          title: "Rename Failed",
          description: (error as Error).message || "Could not rename the file.",
        });
    });
  };

  const handleExclude = (path: string) => {
     excludeFolderAction(path).then(() => {
        toast({
          title: "Folder Excluded",
          description: "The folder will be ignored in future scans.",
        });
        const folderPath = path.substring(0, path.lastIndexOf('/'));
        setVideos(currentVideos => 
          currentVideos.filter(v => !v.path.startsWith(folderPath))
        );
     }).catch(error => {
        console.error("Exclude failed:", error);
        toast({
          variant: "destructive",
          title: "Exclude Failed",
          description: "Could not exclude the folder.",
        });
     });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {isScanning ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <p className="text-muted-foreground">Scanning computer for video files...</p>
            <Progress value={progress} className="w-full max-w-md" />
          </div>
        ) : (
          <VideoGrid videos={videos} onRename={handleRename} onExclude={handleExclude} />
        )}
      </main>
    </div>
  );
}
