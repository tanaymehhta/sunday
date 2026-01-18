import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sunday - Voice Activity Tracker',
  description: 'Voice recording app for capturing activities',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
