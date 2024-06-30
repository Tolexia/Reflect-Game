import * as THREE from 'three'
import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Reflect } from './Reflect'

export default function App() {
  return (
    <Canvas orthographic camera={{ zoom: 100 }}>
      <color attach="background" args={['#223']} />
      <Scene>
        {/* Any object in here will receive ray events */}
        <Block scale={0.5} position={[0.25, -0.15, 0]} />
        <Block scale={0.5} position={[-2, 1.2, 0]} rotation={[0, 0, -0.55]} />
        <Triangle scale={0.4} position={[-1.5, -1.2, 0]} rotation={[Math.PI / 2, Math.PI, 0]} />
      </Scene>
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={2} luminanceSmoothing={0.0} intensity={1} />
      </EffectComposer>
    </Canvas>
  )
}
function handle_hovered(data)
{
  // console.log("data",data)
  if(data.game_over)
  {
    console.log("win")
  }
}
function Block(props) {
  const [hovered, hover] = useState(false)
  return (
    <mesh onRayOver={(e) => (hover(true), handle_hovered(e))} onRayOut={(e) => hover(false)} {...props}>
      <boxGeometry />
      <meshBasicMaterial color={hovered ? [4, 2, 0] : 'orange'} />
    </mesh>
  )
}

function Triangle(props) {
  const [hovered, hover] = useState(false)
  return (
    <mesh {...props} 
      onRayOver={(e) => (e.stopPropagation(), hover(true), handle_hovered(e))} 
      onRayOut={(e) => hover(false)} 
      // onRayMove={(e) => null /*console.log(e.direction)*/}
    >
      <cylinderGeometry args={[1, 1, 1, 3, 1]} />
      <meshBasicMaterial color={hovered ? [5.5, 1, 2] : 'hotpink'} />
    </mesh>
  )
}

function Scene({ children }) {
  const streaks = useRef()
  const glow = useRef()
  const reflect = useRef()
  const [streakTexture, glowTexture] = useTexture(['/lensflare/lensflare2.png', '/lensflare/lensflare0_bw.jpg'])

  const obj = new THREE.Object3D()
  const f = new THREE.Vector3()
  const t = new THREE.Vector3()
  const n = new THREE.Vector3()

  let i = 0
  let range = 0

  useFrame((state) => {
    reflect.current.setRay(
      [(state.pointer.x * state.viewport.width) / 2, (state.pointer.y * state.viewport.height) / 2, 0],
      [state.pointer.x * 1.5, state.pointer.y * 1.5, 0]
    )
    range = reflect.current.update()

    for (i = 0; i < range - 1; i++) {
      // Position 1
      f.fromArray(reflect.current.positions, i * 3)
      // Position 2
      t.fromArray(reflect.current.positions, i * 3 + 3)
      // Calculate normal
      n.subVectors(t, f).normalize()
      // Calculate mid-point
      obj.position.addVectors(f, t).divideScalar(2)
      // Stretch by using the distance
      obj.scale.set(t.distanceTo(f) * 3, 6, 1)
      // Convert rotation to euler z
      obj.rotation.set(0, 0, Math.atan2(n.y, n.x))
      obj.updateMatrix()
      streaks.current.setMatrixAt(i, obj.matrix)
    }

    streaks.current.count = range - 1
    streaks.current.instanceMatrix.updateRange.count = (range - 1) * 16
    streaks.current.instanceMatrix.needsUpdate = true

    // First glow isn't shown
    obj.scale.setScalar(0)
    obj.updateMatrix()
    glow.current.setMatrixAt(0, obj.matrix)

    for (i = 1; i < range; i++) {
      obj.position.fromArray(reflect.current.positions, i * 3)
      obj.scale.setScalar(1)
      obj.rotation.set(0, 0, state.clock.elapsedTime / 10)
      obj.updateMatrix()
      glow.current.setMatrixAt(i, obj.matrix)
    }

    glow.current.count = range
    glow.current.instanceMatrix.updateRange.count = range * 16
    glow.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <Reflect ref={reflect} far={10} bounce={10} start={[10, 5, 0]} end={[0, 0, 0]}>
        {children}
      </Reflect>
      {/* Draw stretched pngs to represent the reflect positions */}
      <instancedMesh ref={streaks} args={[null, null, 100]} instanceMatrix-usage={THREE.DynamicDrawUsage}>
        <planeGeometry />
        <meshBasicMaterial map={streakTexture} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      {/* Draw glowing dots on the contact points */}
      <instancedMesh ref={glow} args={[null, null, 100]} instanceMatrix-usage={THREE.DynamicDrawUsage}>
        <planeGeometry />
        <meshBasicMaterial map={glowTexture} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </>
  )
}
