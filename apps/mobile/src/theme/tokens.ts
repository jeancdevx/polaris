/** Tokens alineados con web-admin (shadcn Lyra, tema claro neutral). */
export const palette = {
  background: '#fafafa',
  foreground: '#1a1a1a',
  card: '#ffffff',
  muted: '#737373',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  primary: '#1a1a1a',
  primaryForeground: '#fafafa',
  secondary: '#f5f5f5',
  destructive: '#dc2626',
  destructiveMuted: '#fef2f2',
  spotFree: '#16a34a',
  spotOccupied: '#dc2626',
  spotReserved: '#d97706',
  spotMine: '#2563eb',
  ring: '#a3a3a3'
} as const

export const fonts = {
  sans: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemiBold: 'Geist_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium'
} as const

export const statusColor = {
  free: palette.spotFree,
  occupied: palette.spotOccupied,
  reserved: palette.spotReserved
} as const

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999
} as const
