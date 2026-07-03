import type { ParkingStatus } from '@polaris/shared-types'

type OccupancyStatsProps = Readonly<{
  status: ParkingStatus
}>

const statCards = [
  {
    key: 'total',
    label: 'Plazas totales',
    value: (status: ParkingStatus) => status.totalSpots,
    accent: 'text-polaris-ink'
  },
  {
    key: 'free',
    label: 'Libres',
    value: (status: ParkingStatus) => status.totalAvailable,
    accent: 'text-polaris-free'
  },
  {
    key: 'occupied',
    label: 'Ocupadas',
    value: (status: ParkingStatus) => status.totalOccupied,
    accent: 'text-polaris-occupied'
  },
  {
    key: 'reserved',
    label: 'Reservadas',
    value: (status: ParkingStatus) => status.totalReserved,
    accent: 'text-polaris-reserved'
  }
] as const

export const OccupancyStats = ({ status }: OccupancyStatsProps) => (
  <section
    aria-label='Resumen de ocupación'
    className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'
  >
    {statCards.map((card, index) => (
      <article
        key={card.key}
        className='animate-fade-up rounded-2xl border border-polaris-border/80 bg-polaris-panel/80 p-5 backdrop-blur-sm'
        style={{ animationDelay: `${index * 70}ms` }}
      >
        <p className='text-sm text-polaris-muted'>{card.label}</p>
        <p
          className={`mt-2 font-mono text-4xl font-semibold tracking-tight ${card.accent}`}
        >
          {card.value(status)}
        </p>
      </article>
    ))}
  </section>
)
