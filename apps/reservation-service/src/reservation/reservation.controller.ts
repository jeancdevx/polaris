import { Body, Controller, Delete, Headers, Param, Post } from '@nestjs/common'

import type { Reservation } from '@polaris/shared-types'

import {
  parseCreateReserveBody,
  parseReservationIdParam,
  parseUserIdHeader
} from './reservation-body.validation.js'
import { ReservationService } from './reservation.service.js'

@Controller('parking')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('reserve')
  create(
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: unknown
  ): Promise<Reservation> {
    return this.reservationService.create(
      parseUserIdHeader(userId),
      parseCreateReserveBody(body)
    )
  }

  @Delete('reserve/:id')
  cancel(
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') reservationId: string
  ): Promise<Reservation> {
    return this.reservationService.cancel(
      parseUserIdHeader(userId),
      parseReservationIdParam(reservationId)
    )
  }
}
