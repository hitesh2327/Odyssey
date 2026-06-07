import type { Metadata } from 'next';
import { AuthProvider } from '../components/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI-Powered Interview Preparation Platform',
  description: 'Practice conceptual technical interview questions with live AI assistance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
