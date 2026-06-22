import { isValidEmail } from '@polaris/shared-utils'

import { invalidValue } from '../errors/domain-error.js'

export type Email = Readonly<{
  value: string
}>

export const createEmail = (raw: string): Email => {
  const trimmed = raw.trim()
  if (!isValidEmail(trimmed)) {
    invalidValue('Email', raw)
  }
  return { value: trimmed.toLowerCase() }
}

export const emailEquals = (left: Email, right: Email): boolean =>
  left.value === right.value

export const emailToString = (email: Email): string => email.value
