import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

type LiveBadgeProps = Readonly<{
  connected?: boolean
  label?: string
}>

export const LiveBadge = ({
  connected = true,
  label = 'En vivo'
}: LiveBadgeProps) => (
  <Badge
    className={cn(
      'gap-1.5 font-normal',
      connected ? 'text-foreground' : 'text-muted-foreground'
    )}
    variant={connected ? 'secondary' : 'outline'}
  >
    <span
      aria-hidden
      className={cn(
        'size-1.5 rounded-full',
        connected ? 'bg-spot-free animate-pulse' : 'bg-muted-foreground'
      )}
    />
    {connected ? label : 'Sin conexión'}
  </Badge>
)
