import { randomBytes } from 'node:crypto'

export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(4).toString('hex')
  return `${prefix}-${timestamp}-${random}`
}

export const formatTimestamp = (date: Date = new Date()): string => {
  return date.toISOString()
}

export const parseTimestamp = (timestamp: string): Date => {
  return new Date(timestamp)
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

export const isValidVehiclePlate = (plate: string): boolean => {
  const plateRegex = /^[A-Z]{3}-\d{3,4}$/
  return plateRegex.test(plate.toUpperCase())
}

export const isValidRfidUid = (uid: string): boolean => {
  const rfidRegex = /^([0-9A-F]{2}:){3}[0-9A-F]{2}$/i
  return rfidRegex.test(uid)
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await sleep(delayMs)
      }
    }
  }

  throw lastError
}
