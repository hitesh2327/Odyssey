import type { Metadata } from 'next';
import { AuthProvider } from '../components/auth-provider';
import Providers from '../components/providers/query-provider';
import { ThemeProvider } from '../providers/theme-provider';
import { GlobalLoader } from '../components/ui/global-loader';
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
        <GlobalLoader />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            <AuthProvider>{children}</AuthProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
