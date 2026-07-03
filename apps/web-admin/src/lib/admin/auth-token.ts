import { fetchAuthSession } from 'aws-amplify/auth'

import { configureAmplify } from '@/lib/amplify-config'

export const getAdminIdToken = async (): Promise<string> => {
  if (!configureAmplify()) {
    throw new Error('Amplify no está configurado.')
  }

  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()

  if (!token) {
    throw new Error('Sesión expirada. Vuelve a iniciar sesión.')
  }

  return token
}
