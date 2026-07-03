export class AdminApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
  }
}

export const readApiErrorMessage = async (
  response: Response
): Promise<string> => {
  const text = await response.text()

  if (!text) {
    return `Error HTTP ${response.status}`
  }

  try {
    const json = JSON.parse(text) as { message?: string | string[] }

    if (Array.isArray(json.message)) {
      return json.message.join(', ')
    }

    if (typeof json.message === 'string') {
      return json.message
    }
  } catch {
    return text
  }

  return text
}
