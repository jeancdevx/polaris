import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'

import { AmplifyProvider } from '@/providers/amplify-provider'

import './globals.css'

export const metadata: Metadata = {
  title: 'Polaris Admin',
  description: 'Dashboard de ocupación en tiempo real'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={`${GeistSans.variable} ${GeistMono.variable}`} lang='es'>
      <body className={GeistSans.className}>
        <AmplifyProvider />
        {children}
      </body>
    </html>
  )
}
