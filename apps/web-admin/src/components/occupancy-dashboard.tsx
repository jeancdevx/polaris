'use client'

import { LoadingPanel } from '@/components/admin/loading-panel'
import { PageHeader } from '@/components/admin/page-header'
import { OccupancyStats } from '@/components/occupancy-stats'
import { ParkingSpotGrid } from '@/components/parking-spot-grid'
import { SpotDetailSheet } from '@/components/parking/spot-detail-sheet'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LiveBadge } from '@/components/ui/live-badge'
import { generateClient } from 'aws-amplify/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ParkingSpot, ParkingStatus } from '@polaris/shared-types'

import { loadActiveAnomalySpotIds } from '@/lib/admin/alerts'
import {
  AVAILABILITY_QUERY,
  ON_OCCUPANCY_CHANGED_SUBSCRIPTION
} from '@/lib/appsync/operations'
import {
  mergeOccupancyChange,
  type OccupancyChangedEvent
} from '@/lib/parking/occupancy'
import { statusDotClassName, statusLabel } from '@/lib/parking/occupancy-styles'

type AvailabilityQueryResult = Readonly<{
  availability: ParkingStatus
}>

type OccupancySubscriptionResult = Readonly<{
  onOccupancyChanged: OccupancyChangedEvent
}>

type GraphqlSubscription = Readonly<{
  subscribe: (handlers: {
    next: (value: { data?: OccupancySubscriptionResult }) => void
    error?: (error: unknown) => void
  }) => { unsubscribe: () => void }
}>

const client = generateClient()
const POLL_INTERVAL_MS = 30_000

const legendItems = [
  { status: 'free' as const, label: statusLabel.free },
  { status: 'occupied' as const, label: statusLabel.occupied },
  { status: 'reserved' as const, label: statusLabel.reserved },
  { status: 'anomaly' as const, label: statusLabel.anomaly }
]

export const OccupancyDashboard = () => {
  const [status, setStatus] = useState<ParkingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)
  const [anomalySpotIds, setAnomalySpotIds] = useState<Set<string>>(new Set())
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchAvailability = useCallback(async () => {
    const response = (await client.graphql({
      query: AVAILABILITY_QUERY,
      authMode: 'userPool'
    })) as { data: AvailabilityQueryResult }

    setStatus(response.data.availability)
    setError(null)
  }, [])

  useEffect(() => {
    let active = true
    let subscription: { unsubscribe: () => void } | undefined
    let pollTimer: ReturnType<typeof setInterval> | undefined

    const load = async () => {
      try {
        await fetchAvailability()

        if (!active) {
          return
        }

        try {
          const anomalies = await loadActiveAnomalySpotIds()

          if (active) {
            setAnomalySpotIds(anomalies)
          }
        } catch {
          // Anomalies are supplementary; occupancy still works without them.
        }

        subscription = (
          client.graphql({
            query: ON_OCCUPANCY_CHANGED_SUBSCRIPTION,
            authMode: 'userPool'
          }) as GraphqlSubscription
        ).subscribe({
          next: ({ data }) => {
            const change = data?.onOccupancyChanged

            if (!change) {
              return
            }

            setConnected(true)
            setStatus(current =>
              current ? mergeOccupancyChange(current, change) : current
            )
          },
          error: () => {
            setConnected(false)
          }
        })

        pollTimer = setInterval(() => {
          void fetchAvailability().catch(() => {
            setConnected(false)
          })
        }, POLL_INTERVAL_MS)
      } catch (loadError) {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar el dashboard.'

        setError(message)
        setConnected(false)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
      subscription?.unsubscribe()
      if (pollTimer) {
        clearInterval(pollTimer)
      }
    }
  }, [fetchAvailability])

  const zones = useMemo(() => {
    if (!status) {
      return { a: [] as ParkingSpot[], b: [] as ParkingSpot[] }
    }

    return {
      a: status.spots.filter(spot => spot.zone === 'a'),
      b: status.spots.filter(spot => spot.zone === 'b')
    }
  }, [status])

  const handleSpotSelect = (spot: ParkingSpot) => {
    setSelectedSpot(spot)
    setSheetOpen(true)
  }

  if (loading) {
    return <LoadingPanel label='Sincronizando ocupación…' />
  }

  if (error || !status) {
    return (
      <Alert variant='destructive'>
        <AlertTitle>Error de carga</AlertTitle>
        <AlertDescription>
          {error ?? 'Sin datos de ocupación.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        description='Disponibilidad en tiempo real vía AppSync con respaldo por sondeo cada 30 s.'
        title={
          <span className='inline-flex flex-wrap items-center gap-2'>
            Ocupación
            <LiveBadge connected={connected} />
          </span>
        }
      />

      <p className='-mt-2 text-sm text-muted-foreground'>
        Última actualización ·{' '}
        {new Date(status.updatedAt).toLocaleString('es-ES')}
      </p>

      {anomalySpotIds.size > 0 ? (
        <Alert>
          <AlertTitle>Anomalías activas</AlertTitle>
          <AlertDescription>
            {anomalySpotIds.size} plaza(s) con ocupación sin ingreso registrado
            en las últimas 24 h.
          </AlertDescription>
        </Alert>
      ) : null}

      <OccupancyStats status={status} />

      <div
        aria-label='Leyenda de estados'
        className='flex flex-wrap gap-4 text-sm text-muted-foreground'
      >
        {legendItems.map(item => (
          <span key={item.status} className='inline-flex items-center gap-2'>
            <span
              aria-hidden
              className={`size-2 rounded-full ${statusDotClassName[item.status]}`}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div className='grid gap-4 xl:grid-cols-2'>
        <ParkingSpotGrid
          anomalySpotIds={anomalySpotIds}
          spots={zones.a}
          title='Zona A'
          onSpotSelect={handleSpotSelect}
        />
        <ParkingSpotGrid
          anomalySpotIds={anomalySpotIds}
          spots={zones.b}
          title='Zona B'
          onSpotSelect={handleSpotSelect}
        />
      </div>

      <SpotDetailSheet
        isAnomaly={
          selectedSpot ? anomalySpotIds.has(selectedSpot.spotId) : false
        }
        open={sheetOpen}
        spot={selectedSpot}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
