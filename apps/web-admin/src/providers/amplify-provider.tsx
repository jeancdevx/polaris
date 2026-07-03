'use client'

import { useEffect } from 'react'

import { configureAmplify } from '@/lib/amplify-config'

export const AmplifyProvider = (): null => {
  useEffect(() => {
    configureAmplify()
  }, [])

  return null
}
