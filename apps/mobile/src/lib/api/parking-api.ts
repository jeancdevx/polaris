import type { ParkingStatus, Reservation } from '@/lib/types'

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json()

    if (!body || typeof body !== 'object') {
      return `Error ${response.status}`
    }

    const record = body as Record<string, unknown>

    if (typeof record.message === 'string') {
      return record.message
    }

    if (Array.isArray(record.message) && record.message.length > 0) {
      return record.message.map(String).join(', ')
    }

    if (typeof record.error === 'string') {
      return record.error
    }
  } catch {
    // ignore body parse errors
  }

  return response.status === 500
    ? 'Error interno del servidor. Revisa que reservation-service, Postgres, Redis y Kafka estén activos.'
    : `Error ${response.status}`
}

/** Flujo 23 — GET /parking/availability (API pública, cache 30 s). */
export const fetchAvailability = async (
  apiUrl: string
): Promise<ParkingStatus> => {
  const response = await fetch(`${apiUrl}/parking/availability`)

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as ParkingStatus
}

/** Flujo 13 — POST /parking/reserve (Cognito JWT). */
export const createReservation = async (
  reservationApiUrl: string,
  idToken: string,
  parkingSpotId: string,
  reservationDate: string
): Promise<Reservation> => {
  const response = await fetch(`${reservationApiUrl}/parking/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({ parkingSpotId, reservationDate })
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as Reservation
}

/** Flujo 14 — DELETE /parking/reserve/{id} (Cognito JWT). */
export const cancelReservation = async (
  reservationApiUrl: string,
  idToken: string,
  reservationId: string
): Promise<Reservation> => {
  const response = await fetch(
    `${reservationApiUrl}/parking/reserve/${reservationId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` }
    }
  )

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as Reservation
}
