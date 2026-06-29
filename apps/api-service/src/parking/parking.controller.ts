import { Controller, Get, Header } from '@nestjs/common'

import type { ParkingStatus } from '@polaris/shared-types'

import { ParkingService } from './parking.service.js'

@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get('availability')
  @Header('Cache-Control', 'public, max-age=30')
  getAvailability(): Promise<ParkingStatus> {
    return this.parkingService.getAvailability()
  }
}
