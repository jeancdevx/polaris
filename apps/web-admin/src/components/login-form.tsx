'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
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
    <form className='flex flex-col gap-5' onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='username'>Usuario</FieldLabel>
          <Input
            autoComplete='username'
            id='username'
            name='username'
            required
            type='text'
            value={username}
            onChange={event => setUsername(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='password'>Contraseña</FieldLabel>
          <Input
            autoComplete='current-password'
            id='password'
            name='password'
            required
            type='password'
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        </Field>
      </FieldGroup>

      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button className='w-full' disabled={loading} type='submit'>
        {loading ? (
          <>
            <Spinner data-icon='inline-start' />
            Autenticando…
          </>
        ) : (
          'Acceder'
        )}
      </Button>

      <FieldDescription className='text-center'>
        La sesión usa Cognito y el token se reenvía al API admin vía BFF.
      </FieldDescription>
    </form>
  )
}
