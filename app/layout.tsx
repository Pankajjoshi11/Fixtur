import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css'
import { Providers } from '../providers';

export const metadata: Metadata = {
  title: 'Fixtur - Live Sports Scoring',
  description: 'Multi-sport tournament management and live-scoring platform',
  generator: 'Fixtur',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}