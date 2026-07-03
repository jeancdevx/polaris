import type { AuthTokens } from '@/lib/types'

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

const postJson = async <T>(url: string, payload: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as T
}

export const signInRequest = (
  apiUrl: string,
  email: string,
  password: string
): Promise<AuthTokens> =>
  postJson<AuthTokens>(`${apiUrl}/auth/signin`, { email, password })

export const refreshRequest = (
  apiUrl: string,
  refreshToken: string
): Promise<AuthTokens> =>
  postJson<AuthTokens>(`${apiUrl}/auth/refresh`, { refreshToken })

export const logoutRequest = async (
  apiUrl: string,
  accessToken: string
): Promise<void> => {
  await fetch(`${apiUrl}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({})
  }).catch(() => undefined)
}
