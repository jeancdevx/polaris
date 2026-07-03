'use client'

import { signIn, signOut } from 'aws-amplify/auth'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { requireAmplifyConfig } from '@/lib/amplify-config'
import { isAdminSession } from '@/lib/auth/session'

export const LoginForm = () => {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      requireAmplifyConfig()
      await signIn({ username, password })

      if (!(await isAdminSession())) {
        await signOut()
        setError('Esta cuenta no pertenece al grupo admin.')
        return
      }

      router.replace('/dashboard')
    } catch (signInError) {
      const message =
        signInError instanceof Error
          ? signInError.message
          : 'No se pudo iniciar sesión.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className='space-y-5' onSubmit={handleSubmit}>
      <label className='block space-y-2'>
        <span className='font-mono text-xs tracking-[0.18em] text-polaris-muted uppercase'>
          Usuario
        </span>
        <input
          autoComplete='username'
          className='w-full rounded-xl border border-polaris-border bg-polaris-bg/80 px-4 py-3 text-polaris-ink outline-none transition focus:border-polaris-accent/60 focus:ring-2 focus:ring-polaris-accent/20'
          name='username'
          required
          type='text'
          value={username}
          onChange={event => setUsername(event.target.value)}
        />
      </label>

      <label className='block space-y-2'>
        <span className='font-mono text-xs tracking-[0.18em] text-polaris-muted uppercase'>
          Contraseña
        </span>
        <input
          autoComplete='current-password'
          className='w-full rounded-xl border border-polaris-border bg-polaris-bg/80 px-4 py-3 text-polaris-ink outline-none transition focus:border-polaris-accent/60 focus:ring-2 focus:ring-polaris-accent/20'
          name='password'
          required
          type='password'
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </label>

      {error ? (
        <p className='rounded-xl border border-polaris-occupied/30 bg-polaris-occupied/10 px-4 py-3 text-sm text-red-200'>
          {error}
        </p>
      ) : null}

      <button
        className='w-full rounded-full bg-linear-to-r from-polaris-accent-dim to-polaris-accent px-5 py-3 text-sm font-semibold text-polaris-bg transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70'
        disabled={loading}
        type='submit'
      >
        {loading ? 'Autenticando…' : 'Acceder al panel'}
      </button>
    </form>
  )
}
