import { Spinner } from '@/components/ui/spinner'

type LoadingPanelProps = Readonly<{
  label?: string
}>

export const LoadingPanel = ({ label = 'Cargando…' }: LoadingPanelProps) => (
  <div className='flex min-h-[24vh] flex-col items-center justify-center gap-3 text-muted-foreground'>
    <Spinner className='size-6' />
    <p className='text-sm'>{label}</p>
  </div>
)
