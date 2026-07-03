import { useFrame } from '@react-three/fiber/native'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'

type LowPolyCarProps = Readonly<{
  color: string
  /** Modo holograma para plazas reservadas (vehículo aún no llegó). */
  ghost?: boolean
  rotationY?: number
}>

const WHEEL_POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.62, 0.28, 0.95],
  [0.62, 0.28, 0.95],
  [-0.62, 0.28, -0.95],
  [0.62, 0.28, -0.95]
]

/**
 * Carro low-poly procedural: carrocería + cabina + ruedas + luces.
 * En modo ghost parpadea como el LED verde de plaza reservada (Flujo 12).
 */
export const LowPolyCar = ({
  color,
  ghost = false,
  rotationY = 0
}: LowPolyCarProps) => {
  const groupRef = useRef<Group>(null)
  const elapsedRef = useRef(0)

  const materialProps = useMemo(
    () =>
      ghost
        ? {
            color: '#16a34a',
            transparent: true,
            opacity: 0.35,
            emissive: '#16a34a',
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.1
          }
        : {
            color,
            roughness: 0.35,
            metalness: 0.55
          },
    [color, ghost]
  )

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return
    }

    elapsedRef.current += delta
    const time = elapsedRef.current

    if (ghost) {
      const blinkOn = Math.floor(time * 2) % 2 === 0
      groupRef.current.visible = blinkOn
      groupRef.current.position.y = 0.08 + Math.sin(time * 2.2) * 0.05
    }
  })

  return (
    <group ref={groupRef} rotation={[0, rotationY, 0]}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.3, 0.42, 2.5]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      <mesh castShadow position={[0, 0.86, -0.15]}>
        <boxGeometry args={[1.1, 0.4, 1.3]} />
        <meshStandardMaterial
          {...materialProps}
          {...(ghost ? {} : { color, roughness: 0.15, metalness: 0.7 })}
        />
      </mesh>

      {WHEEL_POSITIONS.map((position, index) => (
        <mesh
          castShadow
          key={index}
          position={position as [number, number, number]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.26, 0.26, 0.2, 14]} />
          <meshStandardMaterial
            color={ghost ? '#14532d' : '#27272a'}
            opacity={ghost ? 0.4 : 1}
            roughness={0.9}
            transparent={ghost}
          />
        </mesh>
      ))}

      <mesh position={[-0.4, 0.52, 1.26]}>
        <boxGeometry args={[0.22, 0.12, 0.05]} />
        <meshStandardMaterial
          color='#fef9c3'
          emissive='#fde68a'
          emissiveIntensity={ghost ? 0.3 : 1.2}
        />
      </mesh>
      <mesh position={[0.4, 0.52, 1.26]}>
        <boxGeometry args={[0.22, 0.12, 0.05]} />
        <meshStandardMaterial
          color='#fef9c3'
          emissive='#fde68a'
          emissiveIntensity={ghost ? 0.3 : 1.2}
        />
      </mesh>

      <mesh position={[0, 0.52, -1.26]}>
        <boxGeometry args={[0.9, 0.1, 0.05]} />
        <meshStandardMaterial
          color='#7f1d1d'
          emissive='#ef4444'
          emissiveIntensity={ghost ? 0.2 : 0.8}
        />
      </mesh>
    </group>
  )
}
