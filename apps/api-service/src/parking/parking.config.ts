import { registerAs } from '@nestjs/config'

export type ParkingConfig = {
  redisUrl: string
}

export const parkingConfig = registerAs(
  'parking',
  (): ParkingConfig => ({
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379'
  })
)

export const PARKING_CONFIG_KEY = 'parking'
