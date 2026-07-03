import { Redirect } from 'expo-router'

import { useAuth } from '@/lib/auth/auth-context'

export default function IndexScreen() {
  const { ready, tokens } = useAuth()

  if (!ready) {
    return null
  }

  return <Redirect href={tokens ? '/parking' : '/login'} />
}
