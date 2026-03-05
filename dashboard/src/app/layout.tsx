import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeTown — Engineering City',
  description: 'Explore your engineering organization as a living city',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-pixel antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
