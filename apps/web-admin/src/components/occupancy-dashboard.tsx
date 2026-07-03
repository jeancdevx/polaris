'use client'

import { OccupancyStats } from '@/components/occupancy-stats'
import { ParkingSpotGrid } from '@/components/parking-spot-grid'
import { LiveBadge } from '@/components/ui/live-badge'
import { generateClient } from 'aws-amplify/api'
import { signOut } from 'aws-amplify/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import type { ParkingSpot, ParkingStatus } from '@polaris/shared-types'

import {
  AVAILABILITY_QUERY,
  ON_OCCUPANCY_CHANGED_SUBSCRIPTION
} from '@/lib/appsync/operations'
import { requireAdminSession } from '@/lib/auth/session'
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

const legendItems = [
  { status: 'free' as const, label: statusLabel.free },
  { status: 'occupied' as const, label: statusLabel.occupied },
  { status: 'reserved' as const, label: statusLabel.reserved }
]

export const OccupancyDashboard = () => {
  const router = useRouter()
  const [status, setStatus] = useState<ParkingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let subscription: { unsubscribe: () => void } | undefined

    const load = async () => {
      try {
        await requireAdminSession()

        const response = (await client.graphql({
          query: AVAILABILITY_QUERY,
          authMode: 'userPool'
        })) as { data: AvailabilityQueryResult }

        if (!active) {
          return
        }

        setStatus(response.data.availability)
        setError(null)

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

            setStatus(current =>
              current ? mergeOccupancyChange(current, change) : current
            )
          },
          error: (subscriptionError: unknown) => {
            console.error('AppSync subscription error', subscriptionError)
          }
        })
      } catch (loadError) {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar el dashboard.'

        setError(message)
        router.replace('/login')
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
    }
  }, [router])

  const zones = useMemo(() => {
    if (!status) {
      return { a: [] as ParkingSpot[], b: [] as ParkingSpot[] }
    }

    return {
      a: status.spots.filter(spot => spot.zone === 'a'),
      b: status.spots.filter(spot => spot.zone === 'b')
    }
  }, [status])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-polaris-muted'>
        <div className='h-10 w-10 animate-spin rounded-full border-2 border-polaris-border border-t-polaris-accent' />
        <p className='font-mono text-sm tracking-wide uppercase'>
          Sincronizando ocupación…
        </p>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className='rounded-2xl border border-polaris-occupied/40 bg-polaris-occupied/10 px-6 py-8 text-center text-red-200'>
        {error ?? 'Sin datos de ocupación.'}
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <header className='animate-fade-up flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <p className='font-mono text-xs tracking-[0.24em] text-polaris-accent uppercase'>
              Polaris Control
            </p>
            <LiveBadge />
          </div>
          <h1 className='max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl'>
            Mapa de ocupación en tiempo real
          </h1>
          <p className='font-mono text-sm text-polaris-muted'>
            Última actualización ·{' '}
            {new Date(status.updatedAt).toLocaleString('es-ES')}
          </p>
        </div>

        <button
          className='inline-flex items-center justify-center rounded-full border border-polaris-border bg-polaris-surface px-5 py-2.5 text-sm font-medium text-polaris-muted transition hover:border-polaris-accent/40 hover:text-polaris-ink'
          type='button'
          onClick={handleSignOut}
        >
          Cerrar sesión
        </button>
      </header>

      <OccupancyStats status={status} />

      <div
        aria-label='Leyenda de estados'
        className='animate-fade-up flex flex-wrap gap-4 text-sm text-polaris-muted'
        style={{ animationDelay: '280ms' }}
      >
        {legendItems.map(item => (
          <span key={item.status} className='inline-flex items-center gap-2'>
            <span
              aria-hidden
              className={`size-2.5 rounded-full ${statusDotClassName[item.status]}`}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <ParkingSpotGrid animationOffset={360} spots={zones.a} title='Zona A' />
        <ParkingSpotGrid animationOffset={430} spots={zones.b} title='Zona B' />
      </div>
    </div>
  )
}
