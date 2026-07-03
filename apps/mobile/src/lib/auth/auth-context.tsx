import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'

import {
  logoutRequest,
  refreshRequest,
  signInRequest
} from '@/lib/auth/auth-api'
import { decodeJwtClaims, isJwtExpired } from '@/lib/auth/jwt'
import {
  clearStoredTokens,
  loadStoredTokens,
  saveStoredTokens
} from '@/lib/auth/token-store'
import { readMobileEnv } from '@/lib/env'
import type { AuthTokens } from '@/lib/types'

type AuthContextValue = Readonly<{
  ready: boolean
  tokens: AuthTokens | null
  userId: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getFreshTokens: () => Promise<AuthTokens | null>
}>

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false)
  const [tokens, setTokens] = useState<AuthTokens | null>(null)

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      try {
        const stored = await loadStoredTokens()

        // El refreshToken de Cognito es opaco: si el idToken expiró,
        // getFreshTokens() lo renovará o invalidará la sesión.
        if (active && stored) {
          setTokens(stored)
        }
      } finally {
        if (active) {
          setReady(true)
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const env = readMobileEnv()
    const nextTokens = await signInRequest(env.apiUrl, email, password)

    await saveStoredTokens(nextTokens)
    setTokens(nextTokens)
  }, [])

  const signOut = useCallback(async () => {
    if (tokens) {
      const env = readMobileEnv()
      await logoutRequest(env.apiUrl, tokens.accessToken)
    }

    await clearStoredTokens()
    setTokens(null)
  }, [tokens])

  const getFreshTokens = useCallback(async (): Promise<AuthTokens | null> => {
    if (!tokens) {
      return null
    }

    if (!isJwtExpired(tokens.idToken)) {
      return tokens
    }

    try {
      const env = readMobileEnv()
      const refreshed = await refreshRequest(env.apiUrl, tokens.refreshToken)
      // Cognito refresh no rota el refreshToken: preservar el original.
      const merged: AuthTokens = {
        ...refreshed,
        refreshToken: refreshed.refreshToken || tokens.refreshToken
      }

      await saveStoredTokens(merged)
      setTokens(merged)
      return merged
    } catch {
      await clearStoredTokens()
      setTokens(null)
      return null
    }
  }, [tokens])

  const userId = useMemo(
    () => (tokens ? (decodeJwtClaims(tokens.idToken).userId ?? null) : null),
    [tokens]
  )

  const value = useMemo(
    () => ({ ready, tokens, userId, signIn, signOut, getFreshTokens }),
    [ready, tokens, userId, signIn, signOut, getFreshTokens]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}
