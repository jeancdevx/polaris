export type SpotTransform = Readonly<{
  spotId: string
  zone: 'a' | 'b'
  position: readonly [number, number, number]
  /** Rotación Y del vehículo estacionado (mira hacia el carril central). */
  carRotationY: number
}>

export const SPOT_WIDTH = 3
export const SPOT_DEPTH = 5.4
export const LANE_HALF_WIDTH = 3.4

const spotIdFor = (index: number): string =>
  `spot-${String(index).padStart(2, '0')}`

/**
 * Distribución física del prototipo: 10 plazas en dos filas de 5 con carril
 * central. Zona A (spot-01..05) fila norte, zona B (spot-06..10) fila sur.
 */
export const buildSpotTransforms = (): SpotTransform[] => {
  const transforms: SpotTransform[] = []

  for (let index = 1; index <= 10; index += 1) {
    const zone = index <= 5 ? 'a' : 'b'
    const column = (index - 1) % 5
    const x = (column - 2) * SPOT_WIDTH
    const z =
      zone === 'a'
        ? -(LANE_HALF_WIDTH + SPOT_DEPTH / 2)
        : LANE_HALF_WIDTH + SPOT_DEPTH / 2

    transforms.push({
      spotId: spotIdFor(index),
      zone,
      position: [x, 0, z] as const,
      carRotationY: zone === 'a' ? Math.PI : 0
    })
  }

  return transforms
}

export const SPOT_TRANSFORMS = buildSpotTransforms()

export const spotTransformById = (spotId: string): SpotTransform | undefined =>
  SPOT_TRANSFORMS.find(transform => transform.spotId === spotId)

/** Color determinístico de carrocería por plaza. */
const CAR_BODY_COLORS = [
  '#38bdf8',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
  '#e2e8f0',
  '#f87171',
  '#34d399',
  '#facc15',
  '#94a3b8',
  '#22d3ee'
] as const

export const carColorForSpot = (spotId: string): string => {
  const spotNumber = Number.parseInt(spotId.replace('spot-', ''), 10)
  const index =
    (spotNumber - 1 + CAR_BODY_COLORS.length) % CAR_BODY_COLORS.length
  return CAR_BODY_COLORS[index] ?? '#94a3b8'
}
