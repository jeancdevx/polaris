'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import type { ParkingSpot } from '@polaris/shared-types'

import { statusClassName, statusLabel } from '@/lib/parking/occupancy-styles'
import { cn } from '@/lib/utils'

type ParkingSpotGridProps = Readonly<{
  title: string
  spots: ParkingSpot[]
  anomalySpotIds?: ReadonlySet<string>
  onSpotSelect?: (spot: ParkingSpot) => void
}>

const formatSpotId = (spotId: string): string => spotId.replace('spot-', 'P-')

export const ParkingSpotGrid = ({
  title,
  spots,
  anomalySpotIds,
  onSpotSelect
}: ParkingSpotGridProps) => (
  <Card>
    <CardHeader className='flex flex-row items-center justify-between gap-4'>
      <div className='flex flex-col gap-1'>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{spots.length} plazas</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5'>
        {spots.map(spot => {
          const isAnomaly = anomalySpotIds?.has(spot.spotId) ?? false
          const visualKey = isAnomaly ? 'anomaly' : spot.status

          return (
            <Button
              key={spot.spotId}
              aria-label={`${spot.spotId}: ${isAnomaly ? statusLabel.anomaly : statusLabel[spot.status]}`}
              className={cn(
                'h-auto flex-col items-start gap-1 rounded-md border px-3 py-3 text-left font-normal',
                statusClassName[visualKey]
              )}
              type='button'
              variant='ghost'
              onClick={() => onSpotSelect?.(spot)}
            >
              <span className='text-sm font-medium'>
                {formatSpotId(spot.spotId)}
              </span>
              <span className='text-xs text-muted-foreground'>
                {isAnomaly ? statusLabel.anomaly : statusLabel[spot.status]}
              </span>
              {isAnomaly ? (
                <Badge className='mt-1' variant='outline'>
                  Revisar
                </Badge>
              ) : null}
            </Button>
          )
        })}
      </div>
    </CardContent>
  </Card>
)
