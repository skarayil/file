import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language } from '@/lib/translations';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'tr', // Default to Turkish as per previous context implies Turkish user base
            setLanguage: (language) => set({ language }),
            t: (key: string) => {
                const state = get();
                const lang = state.language || 'tr';
                const keys = key.split('.');
                let value: any = translations[lang] || translations['tr'];

                for (const k of keys) {
                    if (value && typeof value === 'object' && k in value) {
                        value = value[k];
                    } else {
                        return key; // Return key if not found
                    }
                }

                return typeof value === 'string' ? value : key;
            },
        }),
        {
            name: 'language-storage',
        }
    )
);
