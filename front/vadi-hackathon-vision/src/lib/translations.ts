export type Language = 'en' | 'tr';

export const translations = {
    en: {
        auth: {
            login: {
                title: 'Welcome Back',
                subtitle: 'Sign in to your account to continue',
                email: 'Email',
                password: 'Password',
                submit: 'Sign In',
                submitting: 'Signing in...',
                noAccount: "Don't have an account?",
                register: 'Sign Up',
                success: 'Login successful!',
                failed: 'Login failed',
            },
            register: {
                title: 'Create Account',
                subtitle: 'Enter your details to create a new account',
                name: 'Full Name',
                email: 'Email',
                password: 'Password',
                submit: 'Sign Up',
                submitting: 'Signing up...',
                hasAccount: 'Already have an account?',
                login: 'Sign In',
                success: 'Registration successful! Please log in.',
                failed: 'Registration failed',
            }
        },
        nav: {
            dashboard: 'Dashboard',
            upload: 'Upload File',
            myFiles: 'My Files',
            logout: 'Logout',
            logoutSuccess: 'Logged out successfully',
        },
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Overview of your file sharing activity',
            stats: {
                files: 'Total Files',
                downloads: 'Total Downloads',
                shares: 'Active Shares',
                storage: 'Used Storage',
            },
            recentActivity: 'Recent Activity',
            noActivity: 'No recent activity found',
            table: {
                name: 'File Name',
                date: 'Date',
                action: 'Action',
            },
        },
        upload: {
            title: 'Upload & Share Files',
            subtitle: 'Drag and drop your files below to upload them securely. Share them with a generated link.',
            queue: 'Upload Queue',
            clearAll: 'Clear All',
            emptyQueue: {
                title: 'Your files will appear here',
                subtitle: 'Start by dropping some files in the upload area.',
            },
            dropzone: {
                title: 'Drag & drop files here',
                subtitle: 'or click to browse',
                button: 'Upload Files',
            },
            success: {
                title: 'file(s) uploaded!',
                subtitle: 'You can now generate a shareable link for your files.',
                button: 'Generate Shareable Link',
            }
        },
        files: {
            title: 'My Files',
            subtitle: 'Manage and share your uploaded files',
            searchPlaceholder: 'Search files...',
            sortBy: 'Sort by',
            sort: {
                newest: 'Newest',
                oldest: 'Oldest',
                name: 'Name',
                size: 'Size',
            },
            actions: {
                share: 'Share',
                rename: 'Rename',
                delete: 'Delete',
            },
            empty: {
                title: 'No files found',
                subtitle: 'Try adjusting your search or upload new files.',
            }
        },
        common: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            save: 'Save',
        },
        profile: {
            title: 'My Profile',
            subtitle: 'Manage your account settings and view storage usage',
            details: {
                title: 'Personal Information',
                name: 'Full Name',
                email: 'Email Address',
            },
            storage: {
                title: 'Storage Usage',
                used: 'Used Storage',
                total: 'Total Storage',
                available: 'Available',
            }
        }
    },
    tr: {
        auth: {
            login: {
                title: 'Hoş Geldiniz',
                subtitle: 'Hesabınıza giriş yaparak devam edin',
                email: 'E-posta',
                password: 'Şifre',
                submit: 'Giriş Yap',
                submitting: 'Giriş yapılıyor...',
                noAccount: 'Hesabınız yok mu?',
                register: 'Kayıt Ol',
                success: 'Giriş başarılı!',
                failed: 'Giriş başarısız',
            },
            register: {
                title: 'Hesap Oluştur',
                subtitle: 'Yeni bir hesap oluşturmak için bilgilerinizi girin',
                name: 'Ad Soyad',
                email: 'E-posta',
                password: 'Şifre',
                submit: 'Kayıt Ol',
                submitting: 'Kayıt olunuyor...',
                hasAccount: 'Zaten hesabınız var mı?',
                login: 'Giriş Yap',
                success: 'Kayıt başarılı! Lütfen giriş yapın.',
                failed: 'Kayıt başarısız',
            }
        },
        nav: {
            dashboard: 'Kontrol Paneli',
            upload: 'Dosya Yükle',
            myFiles: 'Dosyalarım',
            logout: 'Çıkış',
            logoutSuccess: 'Çıkış yapıldı',
        },
        dashboard: {
            title: 'Kontrol Paneli',
            subtitle: 'Dosya paylaşım aktivitenize genel bakış',
            stats: {
                files: 'Toplam Dosya',
                downloads: 'Toplam İndirme',
                shares: 'Aktif Paylaşımlar',
                storage: 'Kullanılan Alan',
            },
            recentActivity: 'Son Aktiviteler',
            noActivity: 'Henüz bir aktivite yok',
            table: {
                name: 'Dosya Adı',
                date: 'Tarih',
                action: 'İşlem',
            },
        },
        upload: {
            title: 'Dosya Yükle & Paylaş',
            subtitle: 'Dosyalarınızı güvenle yüklemek için aşağıya sürükleyip bırakın. Oluşturulan bağlantı ile paylaşın.',
            queue: 'Yükleme Kuyruğu',
            clearAll: 'Hepsini Temizle',
            emptyQueue: {
                title: 'Dosyalarınız burada görünecek',
                subtitle: 'Yükleme alanına dosya bırakarak başlayın.',
            },
            dropzone: {
                title: 'Dosyaları buraya sürükleyin',
                subtitle: 'veya göz atmak için tıklayın',
                button: 'Dosya Seç',
            },
            success: {
                title: 'dosya yüklendi!',
                subtitle: 'Artık dosyalarınız için paylaşılabilir bağlantı oluşturabilirsiniz.',
                button: 'Paylaşım Bağlantısı Oluştur',
            }
        },
        files: {
            title: 'Dosyalarım',
            subtitle: 'Yüklenen dosyalarınızı yönetin ve paylaşın',
            searchPlaceholder: 'Dosya ara...',
            sortBy: 'Sırala',
            sort: {
                newest: 'En Yeni',
                oldest: 'En Eski',
                name: 'İsim',
                size: 'Boyut',
            },
            actions: {
                share: 'Paylaş',
                rename: 'Yeniden Adlandır',
                delete: 'Sil',
            },
            empty: {
                title: 'Dosya bulunamadı',
                subtitle: 'Aramanızı değiştirmeyi veya yeni dosya yüklemeyi deneyin.',
            }
        },
        common: {
            loading: 'Yükleniyor...',
            error: 'Hata',
            success: 'Başarılı',
            cancel: 'İptal',
            save: 'Kaydet',
        },
        profile: {
            title: 'Profilim',
            subtitle: 'Hesap ayarlarınızı yönetin ve depolama kullanımını görüntüleyin',
            details: {
                title: 'Kişisel Bilgiler',
                name: 'Ad Soyad',
                email: 'E-posta Adresi',
            },
            storage: {
                title: 'Depolama Kullanımı',
                used: 'Kullanılan Alan',
                total: 'Toplam Alan',
                available: 'Boş Alan',
            }
        }
    }
};
