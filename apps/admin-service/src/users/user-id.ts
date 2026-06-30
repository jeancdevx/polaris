import { randomBytes } from 'node:crypto'

import { createUserId, type UserId } from '@polaris/domain'

export const generateUserId = (): UserId =>
  createUserId(`usr-${randomBytes(8).toString('hex')}`)

export const generateTemporaryPassword = (): string => {
  const suffix = randomBytes(6).toString('base64url')
  return `Polaris!${suffix}1`
}
