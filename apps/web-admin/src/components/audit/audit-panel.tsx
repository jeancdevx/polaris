'use client'

import { LoadingPanel } from '@/components/admin/loading-panel'
import { PageHeader } from '@/components/admin/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useEffect, useState, type FormEvent } from 'react'

import type { AuditLog } from '@polaris/shared-types'

import { listAuditLogs } from '@/lib/admin/audit-api'
import {
  AUDIT_EVENT_TYPE_OPTIONS,
  formatAuditEventType
} from '@/lib/admin/audit-event-labels'

export const AuditPanel = () => {
  const [items, setItems] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [eventType, setEventType] = useState('')
  const [userId, setUserId] = useState('')
  const [parkingSpotId, setParkingSpotId] = useState('')
  const [gate, setGate] = useState('')
  const [userType, setUserType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const loadPage = async (targetPage: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await listAuditLogs({
        page: targetPage,
        limit: 20,
        eventType: eventType || undefined,
        userId: userId || undefined,
        parkingSpotId: parkingSpotId || undefined,
        gate: gate || undefined,
        userType: userType ? (userType as 'registered' | 'visitor') : undefined,
        from: from || undefined,
        to: to || undefined
      })

      setItems(response.items)
      setPage(response.page)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo cargar la auditoría.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage(1)
  }, [])

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void loadPage(1)
  }

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        description='Trazabilidad de eventos operativos con filtros por tipo, usuario, plaza y rango temporal.'
        title='Auditoría'
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refina el listado de eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className='flex flex-col gap-4' onSubmit={handleFilterSubmit}>
            <FieldGroup className='grid gap-4 md:grid-cols-3'>
              <Field>
                <FieldLabel htmlFor='eventType'>Tipo de evento</FieldLabel>
                <Select
                  value={eventType || 'all'}
                  onValueChange={value =>
                    setEventType(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger id='eventType'>
                    <SelectValue placeholder='Todos' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value='all'>Todos</SelectItem>
                      {AUDIT_EVENT_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor='userId'>Usuario</FieldLabel>
                <Input
                  id='userId'
                  placeholder='userId'
                  value={userId}
                  onChange={event => setUserId(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='parkingSpotId'>Plaza</FieldLabel>
                <Input
                  id='parkingSpotId'
                  placeholder='parkingSpotId'
                  value={parkingSpotId}
                  onChange={event => setParkingSpotId(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='gate'>Gate</FieldLabel>
                <Input
                  id='gate'
                  placeholder='gate'
                  value={gate}
                  onChange={event => setGate(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='userType'>Tipo de usuario</FieldLabel>
                <Select
                  value={userType || 'all'}
                  onValueChange={value =>
                    setUserType(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger id='userType'>
                    <SelectValue placeholder='Todos' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value='all'>Todos</SelectItem>
                      <SelectItem value='registered'>Registrado</SelectItem>
                      <SelectItem value='visitor'>Visitante</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor='from'>Desde</FieldLabel>
                <Input
                  id='from'
                  type='datetime-local'
                  value={from}
                  onChange={event => setFrom(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='to'>Hasta</FieldLabel>
                <Input
                  id='to'
                  type='datetime-local'
                  value={to}
                  onChange={event => setTo(event.target.value)}
                />
              </Field>
            </FieldGroup>
            <Button className='self-start' type='submit'>
              Aplicar filtros
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <LoadingPanel label='Cargando auditoría…' /> : null}

      {!loading ? (
        <>
          <p className='text-sm text-muted-foreground'>
            {total} eventos · página {page} de {totalPages}
          </p>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Plaza</TableHead>
                  <TableHead>Gate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.logId}>
                    <TableCell className='text-muted-foreground'>
                      {new Date(item.timestamp).toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell>
                      {formatAuditEventType(item.eventType)}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {item.userId ?? '—'}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {item.parkingSpotId ?? '—'}
                    </TableCell>
                    <TableCell>{item.gate ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              disabled={page <= 1 || loading}
              type='button'
              variant='outline'
              onClick={() => void loadPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              disabled={page >= totalPages || loading}
              type='button'
              variant='outline'
              onClick={() => void loadPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
