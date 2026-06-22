// oxlint-disable no-underscore-dangle
export type InvalidValueError = {
  readonly _tag: 'InvalidValueError'
  readonly field: string
  readonly value: string
  readonly message: string
}

export type BusinessRuleViolationError = {
  readonly _tag: 'BusinessRuleViolationError'
  readonly code: string
  readonly message: string
}

export type DomainError = InvalidValueError | BusinessRuleViolationError

export const invalidValue = (field: string, value: string): never => {
  throw {
    _tag: 'InvalidValueError',
    field,
    value,
    message: `Invalid ${field}: ${value}`
  } satisfies InvalidValueError
}

export const businessRuleViolation = (code: string, message: string): never => {
  throw {
    _tag: 'BusinessRuleViolationError',
    code,
    message
  } satisfies BusinessRuleViolationError
}

export const isInvalidValueError = (
  error: unknown
): error is InvalidValueError =>
  typeof error === 'object' &&
  error !== null &&
  '_tag' in error &&
  (error as InvalidValueError)._tag === 'InvalidValueError'

export const isBusinessRuleViolationError = (
  error: unknown
): error is BusinessRuleViolationError =>
  typeof error === 'object' &&
  error !== null &&
  '_tag' in error &&
  (error as BusinessRuleViolationError)._tag === 'BusinessRuleViolationError'
