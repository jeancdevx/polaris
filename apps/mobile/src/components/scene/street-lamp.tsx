type StreetLampProps = Readonly<{
  position: readonly [number, number, number]
}>

/** Farola decorativa con luz cálida puntual. */
export const StreetLamp = ({ position }: StreetLampProps) => (
  <group position={position as [number, number, number]}>
    <mesh castShadow position={[0, 1.6, 0]}>
      <cylinderGeometry args={[0.06, 0.09, 3.2, 8]} />
      <meshStandardMaterial color='#1f2937' roughness={0.7} metalness={0.4} />
    </mesh>
    <mesh position={[0, 3.25, 0]}>
      <sphereGeometry args={[0.18, 12, 12]} />
      <meshStandardMaterial
        color='#fef3c7'
        emissive='#fbbf24'
        emissiveIntensity={2.2}
      />
    </mesh>
    <pointLight
      color='#fbbf24'
      decay={1.8}
      distance={11}
      intensity={14}
      position={[0, 3.3, 0]}
    />
  </group>
)
