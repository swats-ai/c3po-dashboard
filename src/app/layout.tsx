import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MISSION CONTROL | C3PO Monitor',
  description: 'C3PO Monitor Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
