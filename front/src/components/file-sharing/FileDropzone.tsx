import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function FileDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const { addFile, updateFileProgress, setFileStatus } = useFileStore();

  const simulateUpload = useCallback((fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        updateFileProgress(fileId, 100);
        setFileStatus(fileId, 'completed');
        toast.success('File uploaded successfully!');
      } else {
        updateFileProgress(fileId, Math.round(progress));
      }
    }, 200);
  }, [updateFileProgress, setFileStatus]);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    Array.from(fileList).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.name}`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large (max 100MB): ${file.name}`);
        return;
      }

      const fileId = addFile({
        name: file.name,
        size: file.size,
        type: file.type,
        isPasswordProtected: false,
      });

      simulateUpload(fileId);
    });
  }, [addFile, simulateUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative w-full border-2 border-dashed border-border rounded-xl p-8 sm:p-12 text-center transition-all duration-300',
        'bg-background hover:bg-light-blue',
        isDragging ? 'border-primary bg-light-blue' : 'hover:border-primary/50'
      )}
    >
      <input
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
        id="file-input"
        accept={ACCEPTED_TYPES.join(',')}
      />
      <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center justify-center gap-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300',
            isDragging ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
          )}>
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-navy">
              Drag & drop files here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
             <Button asChild className="mt-6" size="lg">
                <span className="font-semibold">Upload Files</span>
             </Button>
          </div>
      </label>
    </div>
  );
}
