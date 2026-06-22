import { invalidValue } from '../errors/domain-error.js'

const SPOT_ID_PATTERN = /^spot-(0[1-9]|10)$/

export type ParkingZone = 'a' | 'b'

export type SpotId = Readonly<{
  value: string
  zone: ParkingZone
}>

export const createSpotId = (raw: string): SpotId => {
  const normalized = raw.trim().toLowerCase()
  if (!SPOT_ID_PATTERN.test(normalized)) {
    invalidValue('SpotId', raw)
  }
  const spotNumber = Number.parseInt(normalized.replace('spot-', ''), 10)
  const zone: ParkingZone = spotNumber <= 5 ? 'a' : 'b'
  return { value: normalized, zone }
}

export const allSpotIds = (): SpotId[] =>
  Array.from({ length: 10 }, (_, index) =>
    createSpotId(`spot-${String(index + 1).padStart(2, '0')}`)
  )

export const spotIdEquals = (left: SpotId, right: SpotId): boolean =>
  left.value === right.value

export const spotIdToString = (spotId: SpotId): string => spotId.value
