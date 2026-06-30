import { Body, Controller, Delete, Headers, Param, Post } from '@nestjs/common'

import type { Reservation } from '@polaris/shared-types'

import {
  parseCreateReserveBody,
  parseReservationIdParam,
  parseUserIdentity
} from './reservation-body.validation.js'
import { ReservationService } from './reservation.service.js'

@Controller('parking')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('reserve')
  create(
    @Headers('x-user-id') userId: string | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown
  ): Promise<Reservation> {
    return this.reservationService.create(
      parseUserIdentity(userId, authorization),
      parseCreateReserveBody(body)
    )
  }

  @Delete('reserve/:id')
  cancel(
    @Headers('x-user-id') userId: string | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Param('id') reservationId: string
  ): Promise<Reservation> {
    return this.reservationService.cancel(
      parseUserIdentity(userId, authorization),
      parseReservationIdParam(reservationId)
    )
  }
}
