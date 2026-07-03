import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth'

import { configureAmplify, requireAmplifyConfig } from '@/lib/amplify-config'

const readGroups = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }

  if (typeof value === 'string') {
    return [value]
  }

  return []
}

export const isAdminSession = async (): Promise<boolean> => {
  if (!configureAmplify()) {
    return false
  }

  try {
    await getCurrentUser()
  } catch {
    return false
  }

  const session = await fetchAuthSession()
  const groups = readGroups(session.tokens?.idToken?.payload['cognito:groups'])

  return groups.includes('admin')
}

export const requireAdminSession = async (): Promise<void> => {
  requireAmplifyConfig()

  const allowed = await isAdminSession()

  if (!allowed) {
    await signOut()
    throw new Error('Se requiere una cuenta del grupo admin.')
  }
}
