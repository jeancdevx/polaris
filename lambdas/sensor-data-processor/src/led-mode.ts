import type { ParkingSpotStatus } from '@polaris/shared-types'

export type LedSpotMode =
  | 'free'
  | 'occupied'
  | 'blink_blue'
  | 'blink_green'
  | 'off'

export const ledModeForStatus = (status: ParkingSpotStatus): LedSpotMode => {
  switch (status) {
    case 'occupied':
      return 'occupied'
    case 'reserved':
      return 'blink_blue'
    default:
      return 'free'
  }
}
