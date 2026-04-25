/**
 * ShareModal.tsx
 * 
 * Dialog component for sharing files.
 * Allows users to generate a shareable link with optional settings:
 * - Expiration date
 * - Download limit
 * - Password protection
 */
import { useState } from 'react';
import { FileItem, useFileStore } from '@/store/useFileStore';
import { Link2, Calendar, Hash, Lock, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ShareModalProps {
    file: FileItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareModal({ file, open, onOpenChange }: ShareModalProps) {
    const { setShareLink, removeShareLink } = useFileStore();
    const [expiryDays, setExpiryDays] = useState(7);
    const [downloadLimit, setDownloadLimit] = useState<number | ''>('');
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);

    const generateLink = () => {
        const baseUrl = window.location.origin;
        const shareId = crypto.randomUUID().slice(0, 8);
        const link = `${baseUrl}/share/${shareId}`;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        setShareLink(file.id, link, {
            expiresAt,
            downloadLimit: downloadLimit || undefined,
            password: password || undefined,
        });

        toast.success('Share link created!');
    };

    const copyLink = async () => {
        if (file.shareLink) {
            await navigator.clipboard.writeText(file.shareLink);
            setCopied(true);
            toast.success('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRemoveLink = () => {
        removeShareLink(file.id);
        toast.success('Share link removed');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Share File</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* File Info */}
                    <div className="p-3 bg-muted rounded-lg border border-border">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>

                    {file.shareLink ? (
                        /* Existing Link */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Share Link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={file.shareLink}
                                        readOnly
                                        className="input-base text-sm flex-1"
                                    />
                                    <button
                                        onClick={copyLink}
                                        className="btn-primary px-3"
                                        aria-label="Copy link"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Share Info */}
                            <div className="space-y-2 text-sm">
                                {file.expiresAt && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span>Expires: {new Date(file.expiresAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {file.downloadLimit && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Hash className="w-4 h-4" />
                                        <span>Download limit: {file.downloadLimit} ({file.downloadCount} used)</span>
                                    </div>
                                )}
                                {file.isPasswordProtected && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Lock className="w-4 h-4" />
                                        <span>Password protected</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleRemoveLink}
                                className="w-full py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                Remove Share Link
                            </button>
                        </div>
                    ) : (
                        /* Create New Link */
                        <div className="space-y-4">
                            {/* Expiry */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Expires In
                                </label>
                                <select
                                    value={expiryDays}
                                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                                    className="input-base"
                                >
                                    <option value={1}>1 day</option>
                                    <option value={3}>3 days</option>
                                    <option value={7}>7 days</option>
                                    <option value={14}>14 days</option>
                                    <option value={30}>30 days</option>
                                </select>
                            </div>

                            {/* Download Limit */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    Download Limit (optional)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={downloadLimit}
                                    onChange={(e) => setDownloadLimit(e.target.value ? Number(e.target.value) : '')}
                                    placeholder="Unlimited"
                                    className="input-base"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    Password (optional)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Set a password"
                                    className="input-base"
                                />
                            </div>

                            <button
                                onClick={generateLink}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Link2 className="w-4 h-4" />
                                Generate Link
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
