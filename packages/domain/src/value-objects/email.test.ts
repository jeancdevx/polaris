import { describe, expect, it } from 'vitest'

import { isInvalidValueError } from '../errors/domain-error.js'

import { createEmail, emailEquals, emailToString } from './email.js'

describe('Email', () => {
  it('creates a normalized email', () => {
    const email = createEmail('  Test@Example.COM ')
    expect(email.value).toBe('test@example.com')
  })

  it('rejects invalid emails', () => {
    try {
      createEmail('not-an-email')
      expect.fail('expected invalid email')
    } catch (error) {
      expect(isInvalidValueError(error)).toBe(true)
    }
  })

  it('compares equality', () => {
    const left = createEmail('a@b.com')
    const right = createEmail('a@b.com')
    expect(emailEquals(left, right)).toBe(true)
    expect(emailToString(left)).toBe('a@b.com')
  })
})
