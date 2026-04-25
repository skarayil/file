import { MainLayout } from '@/components/layout/MainLayout';
import { FileDropzone } from '@/components/file-sharing/FileDropzone';
import { FileProgressCard } from '@/components/file-sharing/FileProgressCard';
import { useFileStore, FileItem } from '@/store/useFileStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';
import { Share2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ShareModal } from '@/components/file-sharing/ShareModal';

export default function FileUpload() {
  const { files, clearAllFiles } = useFileStore();
  const { t } = useLanguageStore();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const completedFiles = files.filter(f => f.status === 'completed');

  const handleShareLatest = () => {
    const latestCompleted = completedFiles.sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime())[0];
    if (latestCompleted) {
      setSelectedFile(latestCompleted);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('upload.title')}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {t('upload.subtitle')}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Dropzone */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-card rounded-xl border border-border/50 shadow-sm transition-all duration-300 dark:border-border dark:bg-card/40 dark:backdrop-blur-sm">
              <FileDropzone />
            </div>
          </div>

          {/* Right Column: File List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">
                {t('upload.queue')} ({files.length})
              </h2>
              {files.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFiles} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('upload.clearAll')}
                </Button>
              )}
            </div>

            {files.length > 0 ? (
              <div className="space-y-4">
                {files.map((file) => (
                  <FileProgressCard
                    key={file.id}
                    file={file}
                    onShare={() => setSelectedFile(file)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-border rounded-xl bg-card/40 text-center transition-colors hover:bg-card/60 dark:bg-card/20 dark:hover:bg-card/40">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                  <Share2 className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">{t('upload.emptyQueue.title')}</h3>
                <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
                  {t('upload.emptyQueue.subtitle')}
                </p>
              </div>
            )}

            {completedFiles.length > 0 && (
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm mt-6 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {completedFiles.length} {t('upload.success.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('upload.success.subtitle')}
                    </p>
                  </div>
                  <Button size="lg" className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105" onClick={handleShareLatest}>
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('upload.success.button')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedFile && <ShareModal file={selectedFile} open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)} />}
    </MainLayout>
  );
}
