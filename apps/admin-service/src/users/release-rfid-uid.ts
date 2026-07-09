import { createHash } from 'node:crypto'

/** Placeholder RFID for inactive users after their physical card was reassigned. */
export const releasedRfidUidForUser = (userId: string): string => {
  const digest = createHash('sha256')
    .update(userId)
    .digest('hex')
    .slice(0, 4)
    .toUpperCase()

  return `00:RV:${digest.slice(0, 2)}:${digest.slice(2, 4)}`
}
