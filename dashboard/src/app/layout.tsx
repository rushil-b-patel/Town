import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Town — Engineering Workspace',
  description: 'Interactive pixel-art engineering workspace dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f1117] antialiased">{children}</body>
    </html>
  );
}
