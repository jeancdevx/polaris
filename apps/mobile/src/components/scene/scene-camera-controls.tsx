import { OrbitControls } from '@react-three/drei/native'
import { useThree } from '@react-three/fiber/native'
import { useEffect } from 'react'
import { PerspectiveCamera, TOUCH } from 'three'

export const AERIAL_CAMERA_POSITION: readonly [number, number, number] = [
  0, 24, 18
]

/** Vista aérea: un dedo rota, dos dedos desplazan; sin pinch-zoom (crash RN en dolly). */
export const SceneCameraControls = () => {
  const { camera } = useThree()

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return
    }

    camera.position.set(...AERIAL_CAMERA_POSITION)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera])

  return (
    <OrbitControls
      dampingFactor={0.08}
      enableDamping
      enablePan
      enableRotate
      enableZoom={false}
      maxPolarAngle={Math.PI / 2.15}
      minPolarAngle={0.12}
      target={[0, 0, 0]}
      touches={{
        ONE: TOUCH.ROTATE,
        TWO: TOUCH.PAN
      }}
    />
  )
}
