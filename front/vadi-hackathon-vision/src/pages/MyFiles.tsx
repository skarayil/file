import { MainLayout } from '@/components/layout/MainLayout';
import { useFileStore, FileItem } from '@/store/useFileStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Search, MoreVertical, Share2, Trash2, Download, Folder, FolderOpen, Grid, List, Edit3, Link2, FileUp, Clock } from 'lucide-react';
import { useState } from 'react';
import { ShareModal } from '@/components/file-sharing/ShareModal';
import { RenameModal } from '@/components/file-sharing/RenameModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function MyFiles() {
  const { files, removeFile } = useFileStore();
  const { t } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [shareModalFile, setShareModalFile] = useState<FileItem | null>(null);
  const [renameModalFile, setRenameModalFile] = useState<FileItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Safety check for files
  const safeFiles = Array.isArray(files) ? files : [];
  const completedFiles = safeFiles.filter(f => f.status === 'completed');
  const totalDownloads = safeFiles.reduce((sum, f) => sum + (f.downloadCount || 0), 0);
  const activeShares = safeFiles.filter(f => f.shareLink).length;

  const filteredFiles = completedFiles
    .filter((file) => file?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDelete = (file: FileItem) => {
    removeFile(file.id);
    toast.success(`${file.name} ${t('files.actions.delete')} ${t('common.success')}`);
    setOpenMenuId(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('files.title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{completedFiles.length} {t('dashboard.stats.uploaded').toLowerCase()}</p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('files.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-card shadow-sm' : 'hover:bg-card/50'
              )}
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-card shadow-sm' : 'hover:bg-card/50'
              )}
              aria-label="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File List/Grid */}
        {filteredFiles.length > 0 ? (
          viewMode === 'list' ? (
            <div className="card-base overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('dashboard.table.name')}</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t('files.sort.size')}</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Tarih</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t('files.actions.share')}</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">{t('common.success')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getFileIcon(file.type)}</span>
                            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          {formatDate(file.uploadedAt)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {file.shareLink ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                              <Link2 className="w-3 h-3" />
                              {t('dashboard.table.active')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative inline-block">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                                  aria-label={t('common.success')}
                                >
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setShareModalFile(file)}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  {t('files.actions.share')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRenameModalFile(file)}>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  {t('files.actions.rename')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(file)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t('files.actions.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="card-base p-4 hover:border-primary/50 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{getFileIcon(file.type)}</span>
                    <div className="relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={t('common.success')}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShareModalFile(file)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            {t('files.actions.share')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRenameModalFile(file)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            {t('files.actions.rename')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(file)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('files.actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="font-medium text-foreground truncate text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatFileSize(file.size)}</p>
                  {file.shareLink && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                      <Link2 className="w-3 h-3" />
                      {t('dashboard.table.active')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="card-base text-center py-16">
            <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? t('files.empty.title') : t('files.empty.title')}
            </p>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? t('files.empty.subtitle')
                : t('files.empty.subtitle')}
            </p>
            {!searchQuery && (
              <a href="/upload" className="btn-primary inline-block">
                {t('dashboard.empty.action')}
              </a>
            )}
          </div>
        )}
      </div>

      {shareModalFile && (
        <ShareModal
          file={shareModalFile}
          open={!!shareModalFile}
          onOpenChange={(open) => !open && setShareModalFile(null)}
        />
      )}
      {renameModalFile && (
        <RenameModal file={renameModalFile} onClose={() => setRenameModalFile(null)} />
      )}
    </MainLayout>
  );
}
