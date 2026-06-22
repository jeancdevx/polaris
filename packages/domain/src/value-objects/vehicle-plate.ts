import { isValidVehiclePlate } from '@polaris/shared-utils'

import { invalidValue } from '../errors/domain-error.js'

export type VehiclePlate = Readonly<{
  value: string
}>

export const createVehiclePlate = (raw: string): VehiclePlate => {
  const normalized = raw.trim().toUpperCase()
  if (!isValidVehiclePlate(normalized)) {
    invalidValue('VehiclePlate', raw)
  }
  return { value: normalized }
}

export const vehiclePlateEquals = (
  left: VehiclePlate,
  right: VehiclePlate
): boolean => left.value === right.value

export const vehiclePlateToString = (plate: VehiclePlate): string => plate.value
