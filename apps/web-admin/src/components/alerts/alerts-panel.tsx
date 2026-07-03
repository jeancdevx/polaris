'use client'

import { LoadingPanel } from '@/components/admin/loading-panel'
import { PageHeader } from '@/components/admin/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty'
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

import type { AuditLog } from '@polaris/shared-types'

import {
  alertTypeLabel,
  loadOperationalAlerts,
  type OperationalAlertType
} from '@/lib/admin/alerts'

const formatAlertType = (eventType: string): string => {
  if (eventType in alertTypeLabel) {
    return alertTypeLabel[eventType as OperationalAlertType]
  }

  return eventType
}

export const AlertsPanel = () => {
  const [alerts, setAlerts] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAlerts = async () => {
    setLoading(true)
    setError(null)

    try {
      const items = await loadOperationalAlerts()
      setAlerts(items)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las alertas.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAlerts()
  }, [])

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        actions={
          <Button
            type='button'
            variant='outline'
            onClick={() => void loadAlerts()}
          >
            Actualizar
          </Button>
        }
        description='Eventos operativos de las últimas 24 h: anomalías de ocupación, vehículos estancados y timeouts de barrera.'
        title='Alertas'
      />

      {error ? (
        <Alert variant='destructive'>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <LoadingPanel label='Cargando alertas…' /> : null}

      {!loading && alerts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Sin alertas recientes</EmptyTitle>
            <EmptyDescription>
              No hay eventos operativos en las últimas 24 horas.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!loading && alerts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Eventos recientes</CardTitle>
            <CardDescription>{alerts.length} alertas en 24 h</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plaza</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(alert => (
                  <TableRow key={alert.logId}>
                    <TableCell className='text-muted-foreground'>
                      {new Date(alert.timestamp).toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        {formatAlertType(alert.eventType)}
                      </Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {alert.parkingSpotId ? (
                        <Link
                          className='underline-offset-4 hover:underline'
                          href='/dashboard'
                        >
                          {alert.parkingSpotId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{alert.gate ?? '—'}</TableCell>
                    <TableCell className='font-mono text-xs'>
                      {alert.userId ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
