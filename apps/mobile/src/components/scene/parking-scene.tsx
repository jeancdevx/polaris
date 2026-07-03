import { LowPolyCar } from '@/components/scene/low-poly-car'
import { ParkingSpotPad } from '@/components/scene/parking-spot-pad'
import { SceneCameraControls } from '@/components/scene/scene-camera-controls'
import { StreetLamp } from '@/components/scene/street-lamp'
import { Canvas } from '@react-three/fiber/native'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'

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

const SCENE_BACKGROUND = '#f4f4f5'
const ASPHALT = '#d4d4d8'
const LANE = '#e4e4e7'

const LotGround = () => (
  <group>
    <mesh
      position={[0, -0.02, 0]}
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[26, 26]} />
      <meshStandardMaterial color={ASPHALT} roughness={0.92} />
    </mesh>

    <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[17, LANE_HALF_WIDTH * 2 - 0.6]} />
      <meshStandardMaterial color={LANE} roughness={0.9} />
    </mesh>

    {[-6, -3, 0, 3, 6].map(x => (
      <mesh key={x} position={[x, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 0.14]} />
        <meshStandardMaterial color='#ca8a04' roughness={0.8} />
      </mesh>
    ))}
  </group>
)

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
      camera={{ fov: 38, near: 0.1, far: 120, position: [0, 24, 18] }}
      shadows
      onCreated={({ camera, gl }) => {
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFShadowMap
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
      }}
    >
      <color args={[SCENE_BACKGROUND]} attach='background' />

      <ambientLight color='#ffffff' intensity={0.85} />
      <directionalLight
        castShadow
        color='#ffffff'
        intensity={1.1}
        position={[12, 22, 10]}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      <hemisphereLight
        args={['#ffffff', '#a1a1aa', 0.35]}
        position={[0, 20, 0]}
      />

      <SceneCameraControls />

      <Suspense fallback={null}>
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
                  color='#16a34a'
                  ghost
                  rotationY={transform.carRotationY}
                />
              ) : null}

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
                <meshStandardMaterial color='#71717a' roughness={0.8} />
              </mesh>
            </group>
          )
        })}
      </Suspense>
    </Canvas>
  )
}
