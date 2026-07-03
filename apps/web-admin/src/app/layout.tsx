import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'

import { AmplifyProvider } from '@/providers/amplify-provider'

import { cn } from '@/lib/utils'

import './globals.css'

export const metadata: Metadata = {
  title: 'Polaris Admin',
  description: 'Consola de operaciones del estacionamiento'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang='es'>
      <body className={GeistSans.className}>
        <TooltipProvider>
          <AmplifyProvider />
          {children}
          <Toaster position='top-right' richColors />
        </TooltipProvider>
      </body>
    </html>
  )
}
