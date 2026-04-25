/**
 * RenameModal.tsx
 * 
 * Modal dialog for renaming files.
 * Validates the new name and updates the file store.
 */
import { useState } from 'react';
import { FileItem, useFileStore } from '@/store/useFileStore';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface RenameModalProps {
  file: FileItem;
  onClose: () => void;
}

export function RenameModal({ file, onClose }: RenameModalProps) {
  const { renameFile } = useFileStore();
  const [newName, setNewName] = useState(file.name);

  const handleRename = () => {
    if (!newName.trim()) {
      toast.error('Dosya adı boş olamaz');
      return;
    }

    if (newName === file.name) {
      onClose();
      return;
    }

    renameFile(file.id, newName.trim());
    toast.success('Dosya adı değiştirildi');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl border border-border w-full max-w-sm shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Yeniden Adlandır</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="filename" className="block text-sm font-medium text-foreground mb-1.5">
              Dosya Adı
            </label>
            <input
              id="filename"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-base"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              İptal
            </button>
            <button
              onClick={handleRename}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
