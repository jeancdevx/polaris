import * as SecureStore from 'expo-secure-store'

import type { AuthTokens } from '@/lib/types'

const SESSION_KEY = 'polaris.session'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const loadStoredTokens = async (): Promise<AuthTokens | null> => {
  const raw = await SecureStore.getItemAsync(SESSION_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (
      isRecord(parsed) &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.idToken === 'string' &&
      typeof parsed.refreshToken === 'string'
    ) {
      return parsed as AuthTokens
    }
  } catch {
    // corrupted entry: fall through and clear
  }

  await SecureStore.deleteItemAsync(SESSION_KEY)
  return null
}

export const saveStoredTokens = async (tokens: AuthTokens): Promise<void> => {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(tokens))
}

export const clearStoredTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SESSION_KEY)
}
