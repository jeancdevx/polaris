import { randomBytes } from 'node:crypto'

import { createReservationId, type ReservationId } from '@polaris/domain'

export const generateReservationId = (): ReservationId =>
  createReservationId(`res-${randomBytes(8).toString('hex')}`)
