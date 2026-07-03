import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { ParkingStatus } from '@polaris/shared-types'

type OccupancyStatsProps = Readonly<{
  status: ParkingStatus
}>

const statCards = [
  {
    key: 'total',
    label: 'Plazas totales',
    value: (status: ParkingStatus) => status.totalSpots
  },
  {
    key: 'free',
    label: 'Libres',
    value: (status: ParkingStatus) => status.totalAvailable
  },
  {
    key: 'occupied',
    label: 'Ocupadas',
    value: (status: ParkingStatus) => status.totalOccupied
  },
  {
    key: 'reserved',
    label: 'Reservadas',
    value: (status: ParkingStatus) => status.totalReserved
  },
  {
    key: 'visitors',
    label: 'Visitantes',
    value: (status: ParkingStatus) => status.totalVisitors
  }
] as const

export const OccupancyStats = ({ status }: OccupancyStatsProps) => (
  <section
    aria-label='Resumen de ocupación'
    className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'
  >
    {statCards.map(card => (
      <Card key={card.key} size='sm'>
        <CardHeader>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            {card.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-semibold tracking-tight tabular-nums'>
            {card.value(status)}
          </p>
        </CardContent>
      </Card>
    ))}
  </section>
)
