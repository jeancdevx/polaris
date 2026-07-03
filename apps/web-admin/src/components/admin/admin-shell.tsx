'use client'

import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { signOut } from 'aws-amplify/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

import { requireAdminSession } from '@/lib/auth/session'

type AdminGateProps = Readonly<{
  children: ReactNode
}>

export const AdminGate = ({ children }: AdminGateProps) => {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    const verify = async () => {
      try {
        await requireAdminSession()

        if (active) {
          setReady(true)
        }
      } catch {
        if (active) {
          router.replace('/login')
        }
      }
    }

    void verify()

    return () => {
      active = false
    }
  }, [router])

  if (!ready) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground'>
        <Spinner className='size-6' />
        <p className='text-sm'>Verificando sesión…</p>
      </div>
    )
  }

  return <>{children}</>
}

type AdminShellProps = Readonly<{
  children: ReactNode
}>

export const AdminShell = ({ children }: AdminShellProps) => {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <SidebarProvider>
      <AdminSidebar onSignOut={() => void handleSignOut()} />
      <SidebarInset>
        <header className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger />
          <Separator className='mr-2 h-4' orientation='vertical' />
          <span className='text-sm text-muted-foreground'>
            Consola de operaciones
          </span>
        </header>
        <div className='flex flex-1 flex-col gap-6 p-6 md:p-8'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
