import type { VideoFile } from '@/lib/types';

// This is an in-memory store to simulate a database or a local JSON file.
// In a real desktop app, this would read from and write to the user's disk.
let videos: VideoFile[] = [
  { id: '1', path: '/Users/demo/Movies/Vacation/IMG_1234.mp4', name: 'IMG_1234.mp4' },
  { id: '2', path: '/Users/demo/Movies/Vacation/IMG_1235.mov', name: 'IMG_1235.mov' },
  { id: '3', path: '/Users/demo/Videos/Project-X/shot-1.mkv', name: 'shot-1.mkv' },
  { id: '4', path: '/Users/demo/Videos/Project-X/shot-2-final.avi', name: 'shot-2-final.avi' },
  { id: '5', path: '/Users/demo/Downloads/tutorial.webm', name: 'tutorial.webm' },
  { id: '6', path: '/Volumes/External/Wedding/ceremony.mp4', name: 'ceremony.mp4' },
  { id: '7', path: '/Volumes/External/Wedding/reception.mp4', name: 'reception.mp4' },
  { id: '8', path: '/Users/demo/Desktop/screen-recording-1.mp4', name: 'screen-recording-1.mp4' },
  { id: '9', path: '/Users/demo/Movies/Another/Another.mp4', name: 'Another.mp4' },
  { id: '10', path: '/Users/demo/Movies/Another/AnotherOne.mkv', name: 'AnotherOne.mkv' },
  { id: '11', path: '/Volumes/Backup/Old-Videos/Birthday2010.mp4', name: 'Birthday2010.mp4'},
  { id: '12', path: '/Volumes/Backup/Old-Videos/Christmas2011.mov', name: 'Christmas2011.mov'}
];

let excludedFolders: string[] = [];

// Helper function to get the folder path from a file path
const getFolderPath = (filePath: string): string => {
  return filePath.substring(0, filePath.lastIndexOf('/'));
};

export const mockScanVideos = async (): Promise<VideoFile[]> => {
  // Simulate network/filesystem delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const filteredVideos = videos.filter(video => {
    const folderPath = getFolderPath(video.path);
    return !excludedFolders.includes(folderPath);
  });

  return filteredVideos;
};

export const mockRenameVideo = async (filePath: string, newName: string): Promise<VideoFile> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const videoIndex = videos.findIndex(v => v.path === filePath);
  if (videoIndex === -1) {
    throw new Error('Video not found');
  }

  const originalVideo = videos[videoIndex];
  const folderPath = getFolderPath(originalVideo.path);
  const extension = originalVideo.name.substring(originalVideo.name.lastIndexOf('.'));
  
  let finalName = `${newName}${extension}`;
  let newPath = `${folderPath}/${finalName}`;
  let counter = 1;

  // Handle name conflicts by appending _1, _2, etc.
  // This checks if another video already has the target path.
  while (videos.some(v => v.path === newPath && v.id !== originalVideo.id)) {
    finalName = `${newName}_${counter}${extension}`;
    newPath = `${folderPath}/${finalName}`;
    counter++;
  }

  const updatedVideo = { ...originalVideo, name: finalName, path: newPath };
  videos[videoIndex] = updatedVideo;

  return updatedVideo;
};

export const mockExcludeFolder = async (filePath: string): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const folderPath = getFolderPath(filePath);
  if (!excludedFolders.includes(folderPath)) {
    excludedFolders.push(folderPath);
  }
  
  return [...excludedFolders];
};
