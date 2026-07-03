export const statusLabel = {
  free: 'Libre',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  anomaly: 'Anomalía'
} as const

export const statusClassName = {
  free: 'border-border bg-muted/40 hover:bg-muted/60',
  occupied: 'border-border bg-destructive/8 hover:bg-destructive/12',
  reserved: 'border-border bg-amber-500/10 hover:bg-amber-500/15',
  anomaly:
    'border-spot-anomaly/40 bg-spot-anomaly/12 ring-1 ring-spot-anomaly/25 hover:bg-spot-anomaly/18'
} as const

export const statusDotClassName = {
  free: 'bg-spot-free',
  occupied: 'bg-spot-occupied',
  reserved: 'bg-spot-reserved',
  anomaly: 'bg-spot-anomaly'
} as const

export const statusBadgeVariant = {
  free: 'secondary',
  occupied: 'destructive',
  reserved: 'outline',
  anomaly: 'default'
} as const
