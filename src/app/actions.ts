"use server";

// These actions are no longer used with the new client-side file system access approach.
// They can be removed or kept for potential future server-side operations.

export async function renameVideoAction(path: string, newName: string) {
  console.log("Server action 'renameVideoAction' called, but is not implemented for client-side file access.");
  throw new Error("This operation is not supported with the new scanning method.");
}

export async function excludeFolderAction(path: string) {
  console.log("Server action 'excludeFolderAction' called, but is not implemented for client-side file access.");
   throw new Error("This operation is not supported with the new scanning method.");
}
