import { LowPolyCar } from '@/components/scene/low-poly-car'
import { ParkingSpotPad } from '@/components/scene/parking-spot-pad'
import { StreetLamp } from '@/components/scene/street-lamp'
import { Canvas, useFrame } from '@react-three/fiber/native'
import { Suspense, useMemo, useRef } from 'react'
import type { Group } from 'three'

import {
  carColorForSpot,
  LANE_HALF_WIDTH,
  SPOT_DEPTH,
  SPOT_TRANSFORMS
} from '@/lib/parking/layout'
import type { ParkingSpot } from '@/lib/types'

type ParkingSceneProps = Readonly<{
  spots: ParkingSpot[]
  myUserId: string | null
  selectedSpotId: string | null
  onSelectSpot: (spotId: string) => void
}>

const LAMP_POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [-8.4, 0, 0],
  [8.4, 0, 0],
  [0, 0, -9.6],
  [0, 0, 9.6]
]

const LotGround = () => (
  <group>
    {/* Asfalto */}
    <mesh
      position={[0, -0.02, 0]}
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[26, 26]} />
      <meshStandardMaterial color='#0b1119' roughness={0.96} />
    </mesh>

    {/* Carril central */}
    <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[17, LANE_HALF_WIDTH * 2 - 0.6]} />
      <meshStandardMaterial color='#0e1622' roughness={0.9} />
    </mesh>

    {/* Línea discontinua del carril */}
    {[-6, -3, 0, 3, 6].map(x => (
      <mesh key={x} position={[x, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 0.14]} />
        <meshStandardMaterial
          color='#facc15'
          emissive='#facc15'
          emissiveIntensity={0.25}
        />
      </mesh>
    ))}
  </group>
)

/** Órbita idle muy sutil de toda la escena para darle vida sin controles. */
const SceneRig = ({ children }: { children: React.ReactNode }) => {
  const rigRef = useRef<Group>(null)

  useFrame(state => {
    if (rigRef.current) {
      rigRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.14) * 0.08
    }
  })

  return <group ref={rigRef}>{children}</group>
}

export const ParkingScene = ({
  spots,
  myUserId,
  selectedSpotId,
  onSelectSpot
}: ParkingSceneProps) => {
  const spotsById = useMemo(
    () => new Map(spots.map(spot => [spot.spotId, spot])),
    [spots]
  )

  return (
    <Canvas
      camera={{ position: [0, 13.5, 14.5], fov: 42 }}
      shadows
      onCreated={({ camera }) => {
        camera.lookAt(0, 0, 0)
      }}
    >
      <color args={['#070b10']} attach='background' />
      <fog args={['#070b10', 24, 42]} attach='fog' />

      <ambientLight color='#94b8d8' intensity={0.55} />
      <directionalLight
        castShadow
        color='#bfdbfe'
        intensity={1.15}
        position={[9, 14, 6]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <pointLight color='#2dd4bf' intensity={26} position={[0, 9, 0]} />

      <Suspense fallback={null}>
        <SceneRig>
          <LotGround />

          {LAMP_POSITIONS.map(position => (
            <StreetLamp key={position.join(',')} position={position} />
          ))}

          {SPOT_TRANSFORMS.map(transform => {
            const spot = spotsById.get(transform.spotId)
            const status = spot?.status ?? 'free'
            const mine = Boolean(
              myUserId && spot?.userId && spot.userId === myUserId
            )

            return (
              <group
                key={transform.spotId}
                position={transform.position as [number, number, number]}
              >
                <ParkingSpotPad
                  mine={mine}
                  selected={selectedSpotId === transform.spotId}
                  status={status}
                  onPress={() => onSelectSpot(transform.spotId)}
                />

                {status === 'occupied' ? (
                  <LowPolyCar
                    color={carColorForSpot(transform.spotId)}
                    rotationY={transform.carRotationY}
                  />
                ) : null}

                {status === 'reserved' ? (
                  <LowPolyCar
                    color='#2dd4bf'
                    ghost
                    rotationY={transform.carRotationY}
                  />
                ) : null}

                {/* Tope de plaza */}
                <mesh
                  castShadow
                  position={[
                    0,
                    0.12,
                    transform.zone === 'a'
                      ? -SPOT_DEPTH / 2 + 0.5
                      : SPOT_DEPTH / 2 - 0.5
                  ]}
                >
                  <boxGeometry args={[1.6, 0.18, 0.24]} />
                  <meshStandardMaterial color='#334155' roughness={0.8} />
                </mesh>
              </group>
            )
          })}
        </SceneRig>
      </Suspense>
    </Canvas>
  )
}
