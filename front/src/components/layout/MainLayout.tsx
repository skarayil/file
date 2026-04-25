/**
 * MainLayout.tsx
 * 
 * Wrapper layout component for authenticated pages.
 * Includes the Header and a responsive container for page content.
 */
import { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-screen-2xl">
        <div className="p-4 md:p-8 pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
