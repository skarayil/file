/**
 * useAuthStore.ts
 * 
 * Zustand store for authentication management.
 * Handles user login, registration, and session persistence.
 * Uses a mock user database for demonstration purposes.
 */
import { create } from 'zustand';
import { persist, StateStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
}

// Mock users database
const mockUsers: { email: string; password: string; name: string }[] = [
  { email: 'user@example.com', password: 'user123', name: 'Test User' },
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      login: async (email, password) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const user = mockUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (user) {
          set({
            user: {
              id: crypto.randomUUID(),
              email: user.email,
              name: user.name,
            },
            isAuthenticated: true,
          });
          return { success: true };
        }

        return { success: false, error: 'E-posta veya şifre hatalı' };
      },

      register: async (email, password, name) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const existingUser = mockUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
          return { success: false, error: 'Bu e-posta adresi zaten kullanılıyor' };
        }

        if (password.length < 6) {
          return { success: false, error: 'Şifre en az 6 karakter olmalıdır' };
        }

        // Add new user to mock database
        mockUsers.push({ email, password, name });

        set({
          user: {
            id: crypto.randomUUID(),
            email,
            name,
          },
          isAuthenticated: true,
        });

        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
