import { MainLayout } from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { useFileStore } from '@/store/useFileStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { User, HardDrive, Mail, Database } from 'lucide-react';

export default function Profile() {
    const { user } = useAuthStore();
    const { files } = useFileStore();
    const { t } = useLanguageStore();

    // Calculate storage usage
    const totalStorageBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    const usedStorageBytes = files.reduce((acc, file) => acc + file.size, 0);
    const usedPercentage = Math.min((usedStorageBytes / totalStorageBytes) * 100, 100);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('profile.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('profile.subtitle')}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* User Details Card */}
                    <div className="card-base p-6 space-y-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-border">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">{t('profile.details.title')}</h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {t('profile.details.name')}
                                </label>
                                <p className="text-base font-medium">{user?.name || '-'}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {t('profile.details.email')}
                                </label>
                                <p className="text-base font-medium">{user?.email || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Storage Usage Card */}
                    <div className="card-base p-6 space-y-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-border">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                                <HardDrive className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">{t('profile.storage.title')}</h2>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('profile.storage.used')}</span>
                                    <span className="font-bold">{usedPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="h-4 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                        style={{ width: `${usedPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <Database className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('profile.storage.used')}</p>
                                        <p className="text-sm font-bold">{formatSize(usedStorageBytes)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('profile.storage.total')}</p>
                                        <p className="text-sm font-bold">10 GB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
