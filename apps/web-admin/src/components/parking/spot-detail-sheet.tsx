'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'

import type { ParkingSpot } from '@polaris/shared-types'

import { statusLabel } from '@/lib/parking/occupancy-styles'

type SpotDetailSheetProps = Readonly<{
  spot: ParkingSpot | null
  isAnomaly?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}>

const DetailRow = ({
  label,
  value
}: Readonly<{ label: string; value: string }>) => (
  <div className='flex flex-col gap-0.5'>
    <span className='text-xs text-muted-foreground'>{label}</span>
    <span className='text-sm font-medium'>{value}</span>
  </div>
)

export const SpotDetailSheet = ({
  spot,
  isAnomaly = false,
  open,
  onOpenChange
}: SpotDetailSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className='w-full sm:max-w-md'>
      {spot ? (
        <>
          <SheetHeader>
            <SheetTitle>{spot.spotId.replace('spot-', 'Plaza ')}</SheetTitle>
            <SheetDescription>Zona {spot.zone.toUpperCase()}</SheetDescription>
          </SheetHeader>

          <div className='flex flex-col gap-4 px-4 pb-4'>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='secondary'>
                {isAnomaly ? statusLabel.anomaly : statusLabel[spot.status]}
              </Badge>
              {isAnomaly ? <Badge variant='outline'>Flujo 22</Badge> : null}
            </div>

            <Separator />

            <div className='grid gap-4'>
              <DetailRow label='Estado' value={statusLabel[spot.status]} />
              <DetailRow label='Usuario' value={spot.userId ?? 'Sin asignar'} />
              <DetailRow label='Patente' value={spot.vehiclePlate ?? '—'} />
              <DetailRow label='Reserva' value={spot.reservationId ?? '—'} />
              <DetailRow
                label='Ocupada desde'
                value={
                  spot.occupiedSince
                    ? new Date(spot.occupiedSince * 1000).toLocaleString(
                        'es-ES'
                      )
                    : '—'
                }
              />
            </div>

            {isAnomaly ? (
              <p className='rounded-md border border-spot-anomaly/30 bg-spot-anomaly/10 px-3 py-2 text-sm text-muted-foreground'>
                Ocupación detectada sin ingreso registrado en la barrera de
                entrada. Revisar acceso no autorizado o fallo de lectura RFID.
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </SheetContent>
  </Sheet>
)
