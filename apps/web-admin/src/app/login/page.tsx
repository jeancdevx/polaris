import { LoginForm } from '@/components/login-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className='flex min-h-screen items-center justify-center bg-muted/30 p-6'>
      <div className='grid w-full max-w-4xl gap-8 lg:grid-cols-[1fr_400px] lg:items-center'>
        <section className='flex flex-col gap-4'>
          <p className='text-sm font-medium tracking-wide text-muted-foreground uppercase'>
            Polaris · Estacionamiento IoT
          </p>
          <h1 className='text-3xl font-semibold tracking-tight text-balance lg:text-4xl'>
            Consola de administración
          </h1>
          <p className='max-w-md text-sm leading-relaxed text-muted-foreground'>
            Supervisa ocupación, gestiona usuarios y revisa auditoría y alertas
            operativas. Acceso restringido al grupo admin de Cognito.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>
              Credenciales de operador administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className='mt-6 text-center text-xs text-muted-foreground'>
              ¿Problemas de acceso?{' '}
              <Link className='underline-offset-4 hover:underline' href='#'>
                Contactar soporte
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
