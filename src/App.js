import * as THREE from 'three'
import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Reflect } from './Reflect'
import levels from './levels'


export default function App({level}) {
  
  console.log(level)
  const [objects, setObjects] = useState(levels[level])
  const labelRef = useRef(null)

  const next_level = function ()
  {
    level++
    localStorage.setItem("level", level)
    if(levels[level])
    {
      if(labelRef.content) labelRef.content.innerText = `Level ${level}`
      setObjects(levels[level])
    }
    else
      alert("Game Over")
  }

  if(!objects)
  {
    alert("Erreur")
    return
  }

  
  return (
    <>
      <h1 className='level-label ' ref = {labelRef}>Level {level}</h1>
      <Canvas orthographic camera={{ zoom: 100 }}>
        <color attach="background" args={['#223']} />
        <Scene>
          {/* <Foo scale={0.5} position={[2.5, -0.15, 0]}/> */}
          {/* Any object in here will receive ray events */}
          {objects.map((Object) =>  {
            return <Object.type {...Object.props} next_level={next_level} />
            } )}
        </Scene>
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={2} luminanceSmoothing={0.0} intensity={1} />
        </EffectComposer>
      </Canvas>
    </>
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
