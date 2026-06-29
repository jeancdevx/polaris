import { registerAs } from '@nestjs/config'

export type ReservationConfig = {
  redisUrl: string
  lockTtlSeconds: number
  reservationDurationMs: number
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export const reservationConfig = registerAs(
  'reservation',
  (): ReservationConfig => ({
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    lockTtlSeconds: Number(process.env.RESERVATION_LOCK_TTL_SECONDS ?? '30'),
    reservationDurationMs: Number(
      process.env.RESERVATION_DURATION_MS ?? String(TWO_HOURS_MS)
    )
  })
)

export const RESERVATION_CONFIG_KEY = 'reservation'
