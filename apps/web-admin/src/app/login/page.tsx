import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <main className='relative min-h-screen overflow-hidden'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-grid opacity-40'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-noise'
      />

      <div className='relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12 lg:px-10'>
        <div className='grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
          <section className='animate-fade-up space-y-6'>
            <p className='font-mono text-xs tracking-[0.28em] text-polaris-accent uppercase'>
              Polaris · IoT Parking
            </p>
            <h1 className='max-w-xl text-5xl leading-[1.05] font-semibold tracking-tight text-balance'>
              Sala de control para operadores
            </h1>
            <p className='max-w-lg text-lg leading-relaxed text-polaris-muted'>
              Supervisa la ocupación del estacionamiento con datos en vivo desde
              AppSync. Acceso restringido al grupo admin.
            </p>
            <div className='flex flex-wrap gap-3 font-mono text-xs text-polaris-muted'>
              <span className='rounded-full border border-polaris-border px-3 py-1'>
                Cognito
              </span>
              <span className='rounded-full border border-polaris-border px-3 py-1'>
                AppSync GraphQL
              </span>
              <span className='rounded-full border border-polaris-border px-3 py-1'>
                Subscriptions
              </span>
            </div>
          </section>

          <section
            className='animate-fade-up rounded-3xl border border-polaris-border/80 bg-polaris-panel/80 p-8 shadow-[0_30px_80px_rgb(0_0_0/0.35)] backdrop-blur-md'
            style={{ animationDelay: '120ms' }}
          >
            <div className='mb-8 space-y-2'>
              <h2 className='text-2xl font-semibold tracking-tight'>
                Iniciar sesión
              </h2>
              <p className='text-sm text-polaris-muted'>
                Usa tus credenciales de operador admin.
              </p>
            </div>
            <LoginForm />
          </section>
        </div>
      </div>
    </main>
  )
}
