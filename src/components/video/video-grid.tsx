import type { VideoFile } from '@/lib/types';
import { VideoCard } from '@/components/video/video-card';

interface VideoGridProps {
  videos: VideoFile[];
  onRename: (path: string, newName: string) => void;
  onExclude: (path:string) => void;
}

export function VideoGrid({ videos, onRename, onExclude }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-medium text-muted-foreground">No Videos Found</h2>
        <p className="text-muted-foreground mt-2">All scanned videos have been processed or their folders excluded.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} onRename={onRename} onExclude={onExclude} />
      ))}
    </div>
  );
}
