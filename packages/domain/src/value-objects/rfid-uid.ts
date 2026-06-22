import { isValidRfidUid } from '@polaris/shared-utils'

import { invalidValue } from '../errors/domain-error.js'

export type RfidUid = Readonly<{
  value: string
}>

export const createRfidUid = (raw: string): RfidUid => {
  const normalized = raw.trim().toUpperCase()
  if (!isValidRfidUid(normalized)) {
    invalidValue('RfidUid', raw)
  }
  return { value: normalized }
}

export const rfidUidEquals = (left: RfidUid, right: RfidUid): boolean =>
  left.value === right.value

export const rfidUidToString = (uid: RfidUid): string => uid.value
