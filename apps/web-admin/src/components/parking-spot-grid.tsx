import type { ParkingSpot } from '@polaris/shared-types'

import { statusClassName, statusLabel } from '@/lib/parking/occupancy-styles'

type ParkingSpotGridProps = Readonly<{
  title: string
  spots: ParkingSpot[]
  animationOffset?: number
}>

export const ParkingSpotGrid = ({
  title,
  spots,
  animationOffset = 0
}: ParkingSpotGridProps) => (
  <section
    className='animate-fade-up rounded-3xl border border-polaris-border bg-polaris-panel/70 p-5 shadow-[0_24px_60px_rgb(0_0_0/0.25)] backdrop-blur-md'
    style={{ animationDelay: `${animationOffset}ms` }}
  >
    <header className='mb-5 flex items-end justify-between gap-3 border-b border-polaris-border/70 pb-4'>
      <div>
        <p className='font-mono text-xs tracking-[0.2em] text-polaris-accent uppercase'>
          Sector
        </p>
        <h2 className='text-2xl font-semibold tracking-tight'>{title}</h2>
      </div>
      <span className='rounded-full border border-polaris-border px-3 py-1 font-mono text-xs text-polaris-muted'>
        {spots.length} plazas
      </span>
    </header>

    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
      {spots.map(spot => (
        <article
          key={spot.spotId}
          aria-label={`${spot.spotId}: ${statusLabel[spot.status]}`}
          className={`rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 ${statusClassName[spot.status]}`}
        >
          <p className='font-mono text-sm font-semibold'>
            {spot.spotId.replace('spot-', 'P-')}
          </p>
          <p className='mt-1 text-xs opacity-90'>{statusLabel[spot.status]}</p>
        </article>
      ))}
    </div>
  </section>
)
