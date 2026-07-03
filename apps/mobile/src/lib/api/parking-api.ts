import type { ParkingStatus, Reservation } from '@/lib/types'

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json()

    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
    ) {
      return (body as { message: string }).message
    }
  } catch {
    // ignore body parse errors
  }

  return `Error ${response.status}`
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
  apiUrl: string,
  idToken: string,
  parkingSpotId: string,
  reservationDate: string
): Promise<Reservation> => {
  const response = await fetch(`${apiUrl}/parking/reserve`, {
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
  apiUrl: string,
  idToken: string,
  reservationId: string
): Promise<Reservation> => {
  const response = await fetch(`${apiUrl}/parking/reserve/${reservationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` }
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as Reservation
}
