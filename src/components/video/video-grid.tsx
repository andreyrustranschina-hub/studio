
import { useState, useEffect, useRef, useCallback } from 'react';
import type { VideoFile } from '@/lib/types';
import { VideoCard } from '@/components/video/video-card';
import { VideoPlayerDialog } from './video-player-dialog';

interface VideoGridProps {
  videos: VideoFile[];
  onRename: (path: string, newName: string) => void;
  onExclude: (path:string) => void;
}

const BATCH_SIZE = 24; // Number of videos to load at a time

export function VideoGrid({ videos, onRename, onExclude }: VideoGridProps) {
  const [visibleVideos, setVisibleVideos] = useState<VideoFile[]>([]);
  const [loadMore, setLoadMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoFile | null>(null);
  
  useEffect(() => {
    // Reset when the main video list changes (e.g., new scan)
    setVisibleVideos(videos.slice(0, BATCH_SIZE));
    setLoadMore(videos.length > BATCH_SIZE);
  }, [videos]);


  const lastVideoElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && loadMore) {
        // Load next batch
        const currentLength = visibleVideos.length;
        const nextBatch = videos.slice(currentLength, currentLength + BATCH_SIZE);
        if (nextBatch.length > 0) {
          setVisibleVideos(prev => [...prev, ...nextBatch]);
        }
        
        // Stop observing if all videos are loaded
        if (currentLength + BATCH_SIZE >= videos.length) {
          setLoadMore(false);
        }
      }
    });

    if (node) observer.current.observe(node);
  }, [loadMore, visibleVideos.length, videos]);

  const handlePlayVideo = (video: VideoFile) => {
    setPlayingVideo(video);
  };

  const handleClosePlayer = () => {
    setPlayingVideo(null);
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-medium text-muted-foreground">Видео не найдены</h2>
        <p className="text-muted-foreground mt-2">В выбранной папке нет видеофайлов или все они были обработаны.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleVideos.map((video, index) => {
          const card = <VideoCard key={video.id} video={video} onRename={onRename} onExclude={onExclude} onPlay={handlePlayVideo} />;
          if (visibleVideos.length === index + 1) {
            return (
              <div ref={lastVideoElementRef} key={video.id}>
                {card}
              </div>
            )
          } else {
             return card;
          }
        })}
      </div>
      {playingVideo && (
        <VideoPlayerDialog
          video={playingVideo}
          open={!!playingVideo}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              handleClosePlayer();
            }
          }}
        />
      )}
    </>
  );
}
