export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString()
}

export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidVehiclePlate(plate: string): boolean {
  const plateRegex = /^[A-Z]{3}-\d{3,4}$/
  return plateRegex.test(plate.toUpperCase())
}

export function isValidRFIDUid(uid: string): boolean {
  const rfidRegex = /^([0-9A-F]{2}:){3}[0-9A-F]{2}$/i
  return rfidRegex.test(uid)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const attempt = (remaining: number): void => {
      fn()
        .then(resolve)
        .catch((error: unknown) => {
          if (remaining <= 1) {
            reject(error)
          } else {
            setTimeout(() => attempt(remaining - 1), delayMs)
          }
        })
    }
    attempt(maxAttempts)
  })
}
