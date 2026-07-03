/** Tokens de la sala de control Polaris — espejo de web-admin. */
export const palette = {
  bg: '#070b10',
  surface: '#0f1620',
  panel: '#141e2b',
  border: '#243247',
  muted: '#8fa3bc',
  ink: '#e8eef6',
  accent: '#2dd4bf',
  accentDim: '#0f766e',
  live: '#fbbf24',
  free: '#4ade80',
  occupied: '#f87171',
  reserved: '#fbbf24',
  danger: '#f87171'
} as const

export const fonts = {
  sans: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemiBold: 'Geist_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium'
} as const

export const statusColor = {
  free: palette.free,
  occupied: palette.occupied,
  reserved: palette.reserved
} as const
