import type { AccessDenialReason } from '@polaris/domain'

export type DisplayMessage = Readonly<{
  line1: string
  line2: string
}>

export const displayMessageForDenied = (
  reason: AccessDenialReason | string | undefined
): DisplayMessage => {
  switch (reason) {
    case 'rfid_not_found_or_inactive':
      return {
        line1: 'Tarjeta no registrada',
        line2: 'Contacte administracion'
      }
    case 'parking_full':
      return {
        line1: 'Estacionamiento lleno',
        line2: 'Intente mas tarde'
      }
    case 'session_already_open':
      return {
        line1: 'Ya ingreso',
        line2: 'Use la salida primero'
      }
    case 'no_active_session':
      return {
        line1: 'Sin ingreso previo',
        line2: 'Use la entrada primero'
      }
    case 'reservation_expired':
      return {
        line1: 'Reserva expirada',
        line2: 'Renueve en la app'
      }
    case 'no_active_reservation':
      return {
        line1: 'Sin reserva activa',
        line2: 'Use tarjeta o reserve'
      }
    default:
      return {
        line1: 'Acceso denegado',
        line2: 'Intente nuevamente'
      }
  }
}

export const displayMessageForAllowed = (input: {
  readerLocation: 'entry' | 'exit'
  accessType?: 'reserved' | 'walk_in'
  parkingSpotId?: string
}): DisplayMessage => {
  if (input.readerLocation === 'exit') {
    return {
      line1: 'Hasta pronto',
      line2: 'Salida autorizada'
    }
  }

  if (input.accessType === 'walk_in') {
    return {
      line1: 'Bienvenido',
      line2: 'Busque plaza libre'
    }
  }

  if (input.parkingSpotId) {
    return {
      line1: 'Bienvenido',
      line2: `Plaza ${input.parkingSpotId.replace('spot-', '')} reservada`
    }
  }

  return {
    line1: 'Bienvenido',
    line2: 'Acceso autorizado'
  }
}
