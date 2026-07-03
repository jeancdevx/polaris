import type { ReactNode } from 'react'

type PageHeaderProps = Readonly<{
  title: ReactNode
  description?: string
  actions?: ReactNode
}>

export const PageHeader = ({
  title,
  description,
  actions
}: PageHeaderProps) => (
  <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
    <div className='flex flex-col gap-1'>
      <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
      {description ? (
        <p className='max-w-2xl text-sm text-muted-foreground'>{description}</p>
      ) : null}
    </div>
    {actions ? <div className='flex flex-wrap gap-2'>{actions}</div> : null}
  </div>
)
