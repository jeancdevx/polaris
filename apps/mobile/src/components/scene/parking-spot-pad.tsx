import { useFrame } from '@react-three/fiber/native'
import { useRef } from 'react'
import type { Mesh, MeshStandardMaterial } from 'three'

import { SPOT_DEPTH, SPOT_WIDTH } from '@/lib/parking/layout'
import type { ParkingSpotStatus } from '@/lib/types'

type ParkingSpotPadProps = Readonly<{
  status: ParkingSpotStatus
  selected: boolean
  mine: boolean
  onPress: () => void
}>

const STATUS_COLORS: Record<ParkingSpotStatus, string> = {
  free: '#16a34a',
  occupied: '#dc2626',
  reserved: '#d97706'
}

/** Superficie interactiva de la plaza: piso, líneas pintadas y aro de estado. */
export const ParkingSpotPad = ({
  status,
  selected,
  mine,
  onPress
}: ParkingSpotPadProps) => {
  const ringRef = useRef<Mesh>(null)
  const ringMaterialRef = useRef<MeshStandardMaterial>(null)
  const elapsedRef = useRef(0)

  useFrame((_, delta) => {
    elapsedRef.current += delta
    const time = elapsedRef.current

    if (!ringRef.current || !ringMaterialRef.current) {
      return
    }

    if (selected) {
      const scale = 1 + Math.sin(time * 5) * 0.04
      ringRef.current.scale.setScalar(scale)
      ringMaterialRef.current.emissiveIntensity = 1.2
      return
    }

    ringRef.current.scale.setScalar(1)

    if (status === 'reserved') {
      ringMaterialRef.current.emissiveIntensity =
        0.55 + (Math.sin(time * 3) + 1) * 0.35
    } else {
      ringMaterialRef.current.emissiveIntensity = status === 'free' ? 0.6 : 0.45
    }
  })

  const color = STATUS_COLORS[status]

  return (
    <group>
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={event => {
          event.stopPropagation()
          onPress()
        }}
      >
        <planeGeometry args={[SPOT_WIDTH - 0.3, SPOT_DEPTH - 0.3]} />
        <meshStandardMaterial
          color={selected ? '#e4e4e7' : '#f4f4f5'}
          roughness={0.95}
        />
      </mesh>

      {[-1, 1].map(side => (
        <mesh
          key={side}
          position={[side * (SPOT_WIDTH / 2 - 0.12), 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.12, SPOT_DEPTH - 0.2]} />
          <meshStandardMaterial color='#fafafa' roughness={0.85} />
        </mesh>
      ))}

      <mesh
        position={[0, 0.03, 0]}
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.85, 1.05, 40]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          ref={ringMaterialRef}
          transparent
          opacity={0.92}
        />
      </mesh>

      {mine ? (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.18, 1.3, 40]} />
          <meshStandardMaterial
            color='#2563eb'
            emissive='#2563eb'
            emissiveIntensity={0.9}
            transparent
            opacity={0.95}
          />
        </mesh>
      ) : null}
    </group>
  )
}
