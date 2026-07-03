'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar'
import {
  BellIcon,
  ChartBarIcon,
  ClipboardTextIcon,
  GaugeIcon,
  SignOutIcon,
  UsersIcon
} from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Ocupación', icon: GaugeIcon },
  { href: '/alerts', label: 'Alertas', icon: BellIcon },
  { href: '/users', label: 'Usuarios', icon: UsersIcon },
  { href: '/audit', label: 'Auditoría', icon: ClipboardTextIcon },
  { href: '/metrics', label: 'Métricas', icon: ChartBarIcon }
] as const

type AdminSidebarProps = Readonly<{
  onSignOut: () => void
}>

export const AdminSidebar = ({ onSignOut }: AdminSidebarProps) => {
  const pathname = usePathname()

  return (
    <Sidebar collapsible='icon' variant='inset'>
      <SidebarHeader className='border-b border-sidebar-border'>
        <div className='flex flex-col gap-0.5 px-2 py-1'>
          <span className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
            Polaris
          </span>
          <span className='text-sm font-semibold'>Administración</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operaciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='border-t border-sidebar-border'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} tooltip='Cerrar sesión'>
              <SignOutIcon />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
