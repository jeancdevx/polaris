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
  free: '#4ade80',
  occupied: '#f87171',
  reserved: '#fbbf24'
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

  useFrame(state => {
    if (!ringRef.current || !ringMaterialRef.current) {
      return
    }

    const time = state.clock.elapsedTime

    if (selected) {
      const scale = 1 + Math.sin(time * 5) * 0.04
      ringRef.current.scale.setScalar(scale)
      ringMaterialRef.current.emissiveIntensity = 1.6
      return
    }

    ringRef.current.scale.setScalar(1)

    if (status === 'reserved') {
      // Respiración lenta del aro ámbar mientras espera al vehículo.
      ringMaterialRef.current.emissiveIntensity =
        0.7 + (Math.sin(time * 3) + 1) * 0.45
    } else {
      ringMaterialRef.current.emissiveIntensity = status === 'free' ? 0.75 : 0.5
    }
  })

  const color = STATUS_COLORS[status]

  return (
    <group>
      {/* Piso de la plaza (objetivo de toque) */}
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
          color={selected ? '#1c2a3d' : '#101825'}
          roughness={0.95}
        />
      </mesh>

      {/* Líneas laterales pintadas */}
      {[-1, 1].map(side => (
        <mesh
          key={side}
          position={[side * (SPOT_WIDTH / 2 - 0.12), 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.12, SPOT_DEPTH - 0.2]} />
          <meshStandardMaterial
            color='#cbd5e1'
            emissive='#94a3b8'
            emissiveIntensity={0.08}
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* Aro de estado (LED de la plaza) */}
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
          opacity={0.9}
        />
      </mesh>

      {/* Marcador de "mi reserva" */}
      {mine ? (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.18, 1.3, 40]} />
          <meshStandardMaterial
            color='#2dd4bf'
            emissive='#2dd4bf'
            emissiveIntensity={1.1}
            transparent
            opacity={0.95}
          />
        </mesh>
      ) : null}
    </group>
  )
}
