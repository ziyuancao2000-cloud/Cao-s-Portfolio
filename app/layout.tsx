import type { Metadata } from 'next';
import '../src/styles.css';

export const metadata: Metadata = {
  title: 'Ziyuan Cao — MLA Portfolio',
  description: 'Ziyuan Cao — MLA portfolio and selected landscape architecture works.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

