export const statusLabel = {
  free: 'Libre',
  occupied: 'Ocupada',
  reserved: 'Reservada'
} as const

export const statusClassName = {
  free: 'border-polaris-free/35 bg-polaris-free/10 text-emerald-200 shadow-[inset_0_1px_0_0_rgb(74_222_128/0.15)]',
  occupied:
    'border-polaris-occupied/35 bg-polaris-occupied/10 text-red-200 shadow-[inset_0_1px_0_0_rgb(248_113_113/0.15)]',
  reserved:
    'border-polaris-reserved/35 bg-polaris-reserved/10 text-amber-200 shadow-[inset_0_1px_0_0_rgb(251_191_36/0.15)]'
} as const

export const statusDotClassName = {
  free: 'bg-polaris-free',
  occupied: 'bg-polaris-occupied',
  reserved: 'bg-polaris-reserved'
} as const
