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
import { useEffect, useState, type FormEvent } from 'react'

import { getMetrics } from '@/lib/admin/metrics-api'
import type { AdminMetricsResponse } from '@/lib/admin/types'

const StatCard = ({
  label,
  value
}: Readonly<{ label: string; value: string | number }>) => (
  <Card size='sm'>
    <CardHeader>
      <CardTitle className='text-sm font-medium text-muted-foreground'>
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className='text-3xl font-semibold tracking-tight tabular-nums'>
        {value}
      </p>
    </CardContent>
  </Card>
)

export const MetricsPanel = () => {
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zone, setZone] = useState<'a' | 'b' | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const loadMetrics = async (filters?: {
    zone?: 'a' | 'b'
    from?: string
    to?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await getMetrics(filters)
      setMetrics(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las métricas.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMetrics()
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void loadMetrics({
      zone: zone || undefined,
      from: from || undefined,
      to: to || undefined
    })
  }

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        description='Agregados de ocupación, reservas, usuarios y auditoría (últimas 24 h por defecto).'
        title='Métricas'
      />

      <Card>
        <CardHeader>
          <CardTitle>Rango</CardTitle>
          <CardDescription>Filtra por zona y periodo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className='flex flex-wrap items-end gap-4'
            onSubmit={handleSubmit}
          >
            <FieldGroup className='flex flex-row flex-wrap gap-4'>
              <Field>
                <FieldLabel htmlFor='zone'>Zona</FieldLabel>
                <Select
                  value={zone || 'all'}
                  onValueChange={value =>
                    setZone(value === 'all' ? '' : (value as 'a' | 'b'))
                  }
                >
                  <SelectTrigger className='w-32' id='zone'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value='all'>Todas</SelectItem>
                      <SelectItem value='a'>A</SelectItem>
                      <SelectItem value='b'>B</SelectItem>
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
            <Button type='submit'>Actualizar</Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <LoadingPanel label='Calculando métricas…' /> : null}

      {!loading && metrics ? (
        <div className='flex flex-col gap-6'>
          <p className='text-sm text-muted-foreground'>
            Generado {new Date(metrics.generatedAt).toLocaleString('es-ES')} ·
            rango {new Date(metrics.range.from).toLocaleString('es-ES')} →{' '}
            {new Date(metrics.range.to).toLocaleString('es-ES')}
          </p>

          <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard label='Libres' value={metrics.occupancy.totalAvailable} />
            <StatCard
              label='Ocupadas'
              value={metrics.occupancy.totalOccupied}
            />
            <StatCard
              label='Reservadas'
              value={metrics.occupancy.totalReserved}
            />
            <StatCard label='Plazas' value={metrics.occupancy.totalSpots} />
          </section>

          <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard
              label='Reservas activas'
              value={metrics.reservations.active}
            />
            <StatCard
              label='Ingresadas'
              value={metrics.reservations.checkedIn}
            />
            <StatCard label='Usuarios activos' value={metrics.users.active} />
            <StatCard
              label='Usuarios inactivos'
              value={metrics.users.inactive}
            />
          </section>

          <section className='flex flex-col gap-3'>
            <h2 className='text-lg font-semibold'>Por zona</h2>
            <div className='grid gap-3 md:grid-cols-2'>
              {metrics.occupancy.zones.map(zoneRow => (
                <Card key={zoneRow.zone} size='sm'>
                  <CardHeader>
                    <CardTitle>Zona {zoneRow.zone.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground'>
                      {zoneRow.totalAvailable} libres · {zoneRow.totalOccupied}{' '}
                      ocupadas · {zoneRow.totalReserved} reservadas
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className='flex flex-col gap-3'>
            <h2 className='text-lg font-semibold'>Auditoría en rango</h2>
            <p className='text-sm text-muted-foreground'>
              Total: {metrics.audit.totalInRange}
            </p>
            <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
              {Object.entries(metrics.audit.byEventType).map(
                ([type, count]) => (
                  <Card key={type} size='sm'>
                    <CardContent className='flex items-center justify-between pt-4'>
                      <span className='font-mono text-xs'>{type}</span>
                      <span className='font-semibold tabular-nums'>
                        {count}
                      </span>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
