'use client'

import { LoadingPanel } from '@/components/admin/loading-panel'
import { PageHeader } from '@/components/admin/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { AdminUser } from '@/lib/admin/types'
import { deactivateUser, listUsers } from '@/lib/admin/users-api'

export const UsersPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const loadUsers = async (withInactive: boolean) => {
    setLoading(true)
    setError(null)

    try {
      const response = await listUsers(withInactive)
      setUsers(response.users)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo cargar la lista de usuarios.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers(includeInactive)
  }, [includeInactive])

  const handleDeactivate = async () => {
    if (!pendingUser) {
      return
    }

    setBusyUserId(pendingUser.userId)
    setError(null)

    try {
      await deactivateUser(pendingUser.userId)
      toast.success('Usuario desactivado')
      await loadUsers(includeInactive)
    } catch (deactivateError) {
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : 'No se pudo desactivar el usuario.'
      )
    } finally {
      setBusyUserId(null)
      setPendingUser(null)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        actions={
          <Button asChild>
            <Link href='/users/new'>Nuevo usuario</Link>
          </Button>
        }
        description='Alta y baja de usuarios con RFID y cuenta Cognito.'
        title='Usuarios'
      />

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={includeInactive}
            id='include-inactive'
            onCheckedChange={checked => setIncludeInactive(checked === true)}
          />
          <Label htmlFor='include-inactive'>Incluir inactivos</Label>
        </div>
        <Button
          type='button'
          variant='outline'
          onClick={() => void loadUsers(includeInactive)}
        >
          Actualizar
        </Button>
      </div>

      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <LoadingPanel label='Cargando usuarios…' /> : null}

      {!loading && users.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Sin usuarios</EmptyTitle>
            <EmptyDescription>
              No hay usuarios para mostrar con los filtros actuales.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!loading && users.length > 0 ? (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Patente</TableHead>
                <TableHead>RFID</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.userId}>
                  <TableCell className='font-medium'>{user.name}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {user.email}
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {user.vehiclePlate}
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {user.rfidUid}
                  </TableCell>
                  <TableCell className='capitalize'>{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    {user.isActive ? (
                      <Button
                        disabled={busyUserId === user.userId}
                        size='sm'
                        type='button'
                        variant='destructive'
                        onClick={() => setPendingUser(user)}
                      >
                        Desactivar
                      </Button>
                    ) : (
                      <span className='text-xs text-muted-foreground'>—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <AlertDialog
        open={pendingUser !== null}
        onOpenChange={open => {
          if (!open) {
            setPendingUser(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desactivar a {pendingUser?.name} ({pendingUser?.email})? No podrá
              acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeactivate()}>
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
