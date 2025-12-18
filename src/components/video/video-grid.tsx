import type { VideoFile } from '@/lib/types';
import { VideoCard } from '@/components/video/video-card';
import { Button } from '../ui/button';

interface VideoGridProps {
  videos: VideoFile[];
  onRename: (path: string, newName: string) => void;
  onExclude: (path:string) => void;
}

export function VideoGrid({ videos, onRename, onExclude }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-medium text-muted-foreground">Видео не найдены</h2>
        <p className="text-muted-foreground mt-2">В выбранной папке нет видеофайлов или все они были обработаны.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map(video => (
        <VideoCard key={video.path} video={video} onRename={onRename} onExclude={onExclude} />
      ))}
    </div>
  );
}
