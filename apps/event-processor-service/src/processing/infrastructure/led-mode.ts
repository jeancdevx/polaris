import type { ParkingSpotStatus } from '@polaris/shared-types'

import type { LedSpotMode } from './iot-led-command.publisher.js'

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
