import { useFileStore, FileItem } from '@/store/useFileStore';
import { X, CheckCircle, AlertCircle, Share2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileProgressCardProps {
  file: FileItem;
  onShare: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
};

export function FileProgressCard({ file, onShare }: FileProgressCardProps) {
  const { removeFile } = useFileStore();

  return (
    <div className="bg-white border border-border rounded-lg p-4 animate-fade-in shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gray rounded-md flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label="File type icon">
            {getFileIcon(file.type)}
            </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-navy truncate pr-2">
              {file.name}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {file.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-success" aria-label="Completed" />
              )}
              {file.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-destructive" aria-label="Error" />
              )}
               <button
                onClick={() => removeFile(file.id)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatFileSize(file.size)}
          </p>
          {file.status === 'uploading' && (
            <div className="mt-2">
              <Progress value={file.uploadProgress} className="h-2 rounded-full" />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {file.uploadProgress}%
              </p>
            </div>
          )}
           {file.status === 'completed' && (
             <div className="mt-3 flex items-center justify-between">
                <p className="text-xs font-medium text-success flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Upload complete
                </p>
                <Button size="sm" variant="outline" onClick={onShare}>
                    <Share2 className="w-3 h-3 mr-1.5" />
                    Share
                </Button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
