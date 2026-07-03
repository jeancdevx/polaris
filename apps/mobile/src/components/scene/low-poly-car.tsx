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

  const materialProps = useMemo(
    () =>
      ghost
        ? {
            color: '#2dd4bf',
            transparent: true,
            opacity: 0.32,
            emissive: '#2dd4bf',
            emissiveIntensity: 0.6,
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

  useFrame(state => {
    if (!groupRef.current) {
      return
    }

    if (ghost) {
      // Parpadeo 500 ms ON/OFF, como el firmware del LED de plaza reservada.
      const blinkOn = Math.floor(state.clock.elapsedTime * 2) % 2 === 0
      groupRef.current.visible = blinkOn
      groupRef.current.position.y =
        0.08 + Math.sin(state.clock.elapsedTime * 2.2) * 0.05
    }
  })

  return (
    <group ref={groupRef} rotation={[0, rotationY, 0]}>
      {/* Carrocería */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.3, 0.42, 2.5]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* Cabina */}
      <mesh castShadow position={[0, 0.86, -0.15]}>
        <boxGeometry args={[1.1, 0.4, 1.3]} />
        <meshStandardMaterial
          {...materialProps}
          {...(ghost ? {} : { color, roughness: 0.15, metalness: 0.7 })}
        />
      </mesh>

      {/* Ruedas */}
      {WHEEL_POSITIONS.map((position, index) => (
        <mesh
          castShadow
          key={index}
          position={position as [number, number, number]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.26, 0.26, 0.2, 14]} />
          <meshStandardMaterial
            color={ghost ? '#134e4a' : '#111827'}
            transparent={ghost}
            opacity={ghost ? 0.4 : 1}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Faros delanteros */}
      <mesh position={[-0.4, 0.52, 1.26]}>
        <boxGeometry args={[0.22, 0.12, 0.05]} />
        <meshStandardMaterial
          color='#fef9c3'
          emissive='#fde68a'
          emissiveIntensity={ghost ? 0.3 : 1.4}
        />
      </mesh>
      <mesh position={[0.4, 0.52, 1.26]}>
        <boxGeometry args={[0.22, 0.12, 0.05]} />
        <meshStandardMaterial
          color='#fef9c3'
          emissive='#fde68a'
          emissiveIntensity={ghost ? 0.3 : 1.4}
        />
      </mesh>

      {/* Luces traseras */}
      <mesh position={[0, 0.52, -1.26]}>
        <boxGeometry args={[0.9, 0.1, 0.05]} />
        <meshStandardMaterial
          color='#7f1d1d'
          emissive='#ef4444'
          emissiveIntensity={ghost ? 0.2 : 0.9}
        />
      </mesh>
    </group>
  )
}
