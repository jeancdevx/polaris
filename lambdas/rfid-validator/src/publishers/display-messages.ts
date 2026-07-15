import type { AccessDenialReason } from '@polaris/domain'

export type DisplayMessage = Readonly<{
  line1: string
  line2: string
  idle?: boolean
  freeSpots?: number
}>

export const displayMessageIdle = (freeSpots: number): DisplayMessage => ({
  line1: 'Bienvenido',
  line2: `Libres: ${freeSpots}`,
  idle: true,
  freeSpots
})

export const displayMessageForDenied = (
  reason: AccessDenialReason | string | undefined,
  freeSpots?: number
): DisplayMessage => {
  const withFree = (message: DisplayMessage): DisplayMessage =>
    freeSpots === undefined ? message : { ...message, freeSpots }

  switch (reason) {
    case 'rfid_not_found_or_inactive':
      return withFree({
        line1: 'Tarjeta no registrada',
        line2: 'Contacte administracion'
      })
    case 'parking_full':
      return withFree({
        line1: 'Estacionamiento lleno',
        line2: 'Intente mas tarde'
      })
    case 'session_already_open':
      return withFree({
        line1: 'Ya ingreso',
        line2: 'Use la salida primero'
      })
    case 'no_active_session':
      return withFree({
        line1: 'Sin ingreso previo',
        line2: 'Use la entrada primero'
      })
    case 'reservation_expired':
      return withFree({
        line1: 'Reserva expirada',
        line2: 'Renueve en la app'
      })
    case 'no_active_reservation':
      return withFree({
        line1: 'Sin reserva activa',
        line2: 'Use tarjeta o reserve'
      })
    default:
      return withFree({
        line1: 'Acceso denegado',
        line2: 'Intente nuevamente'
      })
  }
}

export const displayMessageForAllowed = (input: {
  readerLocation: 'entry' | 'exit'
  accessType?: 'reserved' | 'walk_in'
  parkingSpotId?: string
  freeSpots?: number
}): DisplayMessage => {
  const withFree = (message: DisplayMessage): DisplayMessage =>
    input.freeSpots === undefined
      ? message
      : { ...message, freeSpots: input.freeSpots }

  if (input.readerLocation === 'exit') {
    return withFree({
      line1: 'Hasta pronto',
      line2: 'Salida autorizada'
    })
  }

  if (input.accessType === 'walk_in') {
    return withFree({
      line1: 'Bienvenido',
      line2:
        input.freeSpots === undefined
          ? 'Busque plaza libre'
          : `Libres: ${input.freeSpots}`
    })
  }

  if (input.parkingSpotId) {
    return withFree({
      line1: 'Bienvenido',
      line2: `Plaza ${input.parkingSpotId.replace('spot-', '')} reservada`
    })
  }

  return withFree({
    line1: 'Bienvenido',
    line2:
      input.freeSpots === undefined
        ? 'Acceso autorizado'
        : `Libres: ${input.freeSpots}`
  })
}
