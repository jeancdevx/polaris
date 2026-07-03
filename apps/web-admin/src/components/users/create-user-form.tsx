'use client'

import { PageHeader } from '@/components/admin/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import type { UserType } from '@polaris/shared-types'

import type { AdminUserRole } from '@/lib/admin/types'
import { createUser } from '@/lib/admin/users-api'

export const CreateUserForm = () => {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [rfidUid, setRfidUid] = useState('')
  const [userType, setUserType] = useState<UserType>('registered')
  const [role, setRole] = useState<AdminUserRole>('user')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setTemporaryPassword(null)

    try {
      const created = await createUser({
        name,
        email,
        vehiclePlate,
        rfidUid,
        userType,
        role,
        password: password.trim() || undefined
      })

      if (created.temporaryPassword) {
        setTemporaryPassword(created.temporaryPassword)
      } else {
        router.push('/users')
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo crear el usuario.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (temporaryPassword) {
    return (
      <Card className='max-w-lg'>
        <CardHeader>
          <CardTitle>Usuario creado</CardTitle>
          <CardDescription>
            Cognito generó una contraseña temporal. Compártela de forma segura.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <Alert>
            <AlertTitle>Contraseña temporal</AlertTitle>
            <AlertDescription>
              <code className='font-mono text-sm'>{temporaryPassword}</code>
            </AlertDescription>
          </Alert>
          <Button asChild>
            <Link href='/users'>Volver al listado</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        description='Crea usuario en Cognito, RDS y tabla RFID.'
        title='Nuevo usuario'
      />

      <Card className='max-w-2xl'>
        <CardContent className='pt-6'>
          <form className='flex flex-col gap-5' onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='name'>Nombre</FieldLabel>
                <Input
                  required
                  id='name'
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  required
                  id='email'
                  type='email'
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </Field>

              <div className='grid gap-5 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='vehiclePlate'>Patente</FieldLabel>
                  <Input
                    required
                    id='vehiclePlate'
                    placeholder='ABC-123'
                    value={vehiclePlate}
                    onChange={event => setVehiclePlate(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor='rfidUid'>RFID UID</FieldLabel>
                  <Input
                    required
                    id='rfidUid'
                    placeholder='AA:BB:CC:DD'
                    value={rfidUid}
                    onChange={event => setRfidUid(event.target.value)}
                  />
                </Field>
              </div>

              <div className='grid gap-5 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='userType'>Tipo</FieldLabel>
                  <Select
                    value={userType}
                    onValueChange={value => setUserType(value as UserType)}
                  >
                    <SelectTrigger id='userType'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='registered'>Registrado</SelectItem>
                        <SelectItem value='visitor'>Visitante</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor='role'>Rol</FieldLabel>
                  <Select
                    value={role}
                    onValueChange={value => setRole(value as AdminUserRole)}
                  >
                    <SelectTrigger id='role'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='user'>Usuario</SelectItem>
                        <SelectItem value='admin'>Admin</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor='password'>
                  Contraseña (opcional)
                </FieldLabel>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
                <FieldDescription>
                  Si la dejas vacía, Cognito generará una contraseña temporal.
                </FieldDescription>
              </Field>
            </FieldGroup>

            {error ? (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className='flex flex-wrap gap-2'>
              <Button disabled={loading} type='submit'>
                {loading ? (
                  <>
                    <Spinner data-icon='inline-start' />
                    Creando…
                  </>
                ) : (
                  'Crear usuario'
                )}
              </Button>
              <Button asChild variant='outline'>
                <Link href='/users'>Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
