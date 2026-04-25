import { MainLayout } from '@/components/layout/MainLayout';
import { useFileStore } from '@/store/useFileStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { FileText, Download, Share2, HardDrive, Clock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { files } = useFileStore();
    const { t } = useLanguageStore();

    // Safety check
    const safeFiles = Array.isArray(files) ? files : [];
    const completedFiles = safeFiles.filter(f => f.status === 'completed');

    // Stats
    const totalFiles = completedFiles.length;
    const totalDownloads = safeFiles.reduce((sum, f) => sum + (f.downloadCount || 0), 0);
    const activeShares = safeFiles.filter(f => f.shareLink).length;

    // Storage
    const totalStorageBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    const usedStorageBytes = files.reduce((acc, file) => acc + file.size, 0);
    const usedPercentage = Math.min((usedStorageBytes / totalStorageBytes) * 100, 100);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const recentFiles = [...completedFiles]
        .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())
        .slice(0, 5);

    const stats = [
        {
            label: t('dashboard.stats.files'),
            value: totalFiles,
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            label: t('dashboard.stats.downloads'),
            value: totalDownloads,
            icon: Download,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
        },
        {
            label: t('dashboard.stats.shares'),
            value: activeShares,
            icon: Share2,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
        },
        {
            label: t('dashboard.stats.storage'),
            value: formatSize(usedStorageBytes),
            icon: HardDrive,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            progress: usedPercentage,
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="card-base p-4 transition-all hover:shadow-md">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                {stat.progress !== undefined && (
                                    <span className="text-xs font-medium text-muted-foreground">{stat.progress.toFixed(0)}%</span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                {stat.progress !== undefined && (
                                    <div className="h-1.5 w-full bg-muted rounded-full mt-3 overflow-hidden">
                                        <div
                                            className={`h-full ${stat.color.replace('text-', 'bg-')}`}
                                            style={{ width: `${stat.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="card-base overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            {t('dashboard.recentActivity')}
                        </h2>
                        <Link to="/files" className="text-sm text-primary hover:underline flex items-center gap-1">
                            {t('nav.myFiles')} <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="relative">
                        {recentFiles.length > 0 ? (
                            <div className="divide-y divide-border">
                                {recentFiles.map((file) => (
                                    <div key={file.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                                            {file.type.startsWith('image') ? '🖼️' : '📄'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : '-'} • {formatSize(file.size)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                                                {t('common.success')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <p>{t('dashboard.noActivity')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
