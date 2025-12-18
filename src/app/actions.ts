"use server";

import { mockScanVideos, mockRenameVideo, mockExcludeFolder } from "@/lib/video-manager";

export async function scanVideosAction() {
  return await mockScanVideos();
}

export async function renameVideoAction(path: string, newName: string) {
  const result = await mockRenameVideo(path, newName);
  return result;
}

export async function excludeFolderAction(path: string) {
  const result = await mockExcludeFolder(path);
  return result;
}
