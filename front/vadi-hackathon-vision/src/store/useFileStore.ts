/**
 * useFileStore.ts
 * 
 * Zustand store for file management.
 * Manages the global state of files, uploads, and shared links.
 * Actions include adding, removing, renaming files, and managing share settings.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShareSettings {
  expiresAt?: Date;
  downloadLimit?: number;
  password?: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
  uploadedAt?: Date;
  expiresAt?: Date;
  downloadLimit?: number;
  downloadCount: number;
  shareLink?: string;
  isPasswordProtected: boolean;
}

interface FileStore {
  files: FileItem[];
  addFile: (file: Omit<FileItem, 'id' | 'downloadCount' | 'status' | 'uploadProgress'>) => string;
  updateFileProgress: (id: string, progress: number) => void;
  setFileStatus: (id: string, status: FileItem['status']) => void;
  setShareLink: (id: string, link: string, settings?: ShareSettings) => void;
  removeFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  incrementDownload: (id: string) => void;
  removeShareLink: (id: string) => void;
  clearAllFiles: () => void;
}

export const useFileStore = create<FileStore>()(
  persist(
    (set) => ({
      files: [],

      addFile: (file) => {
        const id = crypto.randomUUID();
        set((state) => ({
          files: [
            ...state.files,
            {
              ...file,
              id,
              downloadCount: 0,
              status: 'uploading',
              uploadProgress: 0,
            },
          ],
        }));
        return id;
      },

      updateFileProgress: (id, progress) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, uploadProgress: progress } : f
          ),
        }));
      },

      setFileStatus: (id, status) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, status, uploadedAt: status === 'completed' ? new Date() : f.uploadedAt } : f
          ),
        }));
      },

      setShareLink: (id, link, settings) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? {
              ...f,
              shareLink: link,
              expiresAt: settings?.expiresAt,
              downloadLimit: settings?.downloadLimit,
              isPasswordProtected: !!settings?.password,
            } : f
          ),
        }));
      },

      removeShareLink: (id) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? {
              ...f,
              shareLink: undefined,
              expiresAt: undefined,
              downloadLimit: undefined,
              isPasswordProtected: false,
            } : f
          ),
        }));
      },

      removeFile: (id) => {
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        }));
      },

      renameFile: (id, newName) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, name: newName } : f
          ),
        }));
      },

      incrementDownload: (id) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, downloadCount: f.downloadCount + 1 } : f
          ),
        }));
      },

      clearAllFiles: () => {
        set(() => ({
          files: [],
        }));
      },
    }),
    {
      name: 'file-storage',
    }
  )
);
