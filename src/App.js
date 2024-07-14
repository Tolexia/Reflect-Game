import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Reflect } from './Reflect'
import levels from './levels'


export default function App({level}) {
  
  const [objects, setObjects] = useState([])
  const labelRef = useRef(null)
  const containerRef = useRef(null)

  const next_level = function ()
  {
    containerRef.current.classList.remove("visible")
    level++
    localStorage.setItem("level", level)
	console.log("next_level", level);
    if(levels[level])
    {
      setTimeout(() => {
        if(labelRef.current) labelRef.current.innerText = `Level ${level}`
        setObjects(levels[level])
      }, 2000);
    }
	else 
    {
        alert("Game Over")
        level = 1
        localStorage.setItem("level", 1)
        setTimeout(() => {
            if(labelRef.current) labelRef.current.innerText = `Level ${level}`
            setObjects(levels[level])
          }, 2000);
    }
  }


  useEffect(() => {
    level = +localStorage.getItem("level") 
    if(labelRef.current) labelRef.current.innerText = `Level ${level}`
    setObjects(levels[level])
    console.log("useEffet")
    console.log("containerRef", containerRef)
    if(containerRef.current)
    {
      containerRef.current.classList.add("visible")
    }
  },[objects])

  
  return (
    <div className='container' ref={containerRef}>
      <h1 className='level-label ' ref = {labelRef}>Level {level}</h1>
      <Canvas orthographic camera={{ zoom: 100 }}>
        <color attach="background" args={['#223']} />
        <Scene>
          {/* <Foo scale={0.5} position={[2.5, -0.15, 0]}/> */}
          {/* Any object in here will receive ray events */}
          {objects.map((Object, i) =>  {
            return <Object.type key={i} {...Object.props} next_level={next_level} />
            } )}
        </Scene>
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={2} luminanceSmoothing={0.0} intensity={1} />
        </EffectComposer>
      </Canvas>
    </div>
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

  const [isMouseDown, setIsMouseDown] = useState(false)
  const [rayPosition, setRayPosition] = useState(new THREE.Vector3())
  const [rayRotation, setRayRotation] = useState(0)
  const [initialClickPosition, setInitialClickPosition] = useState(new THREE.Vector2())
//   const [initialRotation, setInitialRotation] = useState(0)

  const { viewport } = useThree()

  useEffect(() => {
	const handleMouseDown = (event) => {
		setIsMouseDown(true)
		const x = (event.clientX / window.innerWidth) * 2 - 1
		const y = -(event.clientY / window.innerHeight) * 2 + 1
		setInitialClickPosition(new THREE.Vector2(x, y))
		// const currentRotation = Math.atan2(y, x)
		// setInitialRotation(currentRotation)
		// setRayRotation(currentRotation)
	}
    const handleMouseUp = () => setIsMouseDown(false)

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useFrame((state) => {
    const { pointer, clock } = state

    // Update ray position when mouse is not clicked
    if (!isMouseDown) {
      setRayPosition(new THREE.Vector3(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0
      ))
    }

	// Mettre à jour la rotation du rayon lorsque la souris est cliquée et déplacée
	if (isMouseDown) {
		// Calculer la distance entre la position initiale et la position actuelle
		const dx = pointer.x - initialClickPosition.x
		const dy = pointer.y - initialClickPosition.y
		const distance = Math.sqrt(dx * dx + dy * dy)

		// Calculer l'angle entre la position initiale et la position actuelle
		const currentAngle = Math.atan2(dy, dx)

		// Appliquer une fonction de lissage pour que la rotation soit plus douce
		const smoothingFactor = Math.min(distance * 2, 1) // Ajustez le facteur 2 pour contrôler la sensibilité

		// Calculer la nouvelle rotation
		const newRotation = rayRotation + (currentAngle - rayRotation) * smoothingFactor

		setRayRotation(newRotation)
	}

	// Calculer le point final en fonction de la position et de la rotation actuelles
	const endPoint = new THREE.Vector3(
		rayPosition.x + Math.cos(rayRotation) * 1.5,
		rayPosition.y + Math.sin(rayRotation) * 1.5,
		0
	)

	reflect.current.setRay([rayPosition.x, rayPosition.y, 0], [endPoint.x, endPoint.y, 0])
	const range = reflect.current.update()

    // Rest of the code for updating streaks and glow remains the same
    for (let i = 0; i < range - 1; i++) {
      f.fromArray(reflect.current.positions, i * 3)
      t.fromArray(reflect.current.positions, i * 3 + 3)
      n.subVectors(t, f).normalize()
      obj.position.addVectors(f, t).divideScalar(2)
      obj.scale.set(t.distanceTo(f) * 3, 6, 1)
      obj.rotation.set(0, 0, Math.atan2(n.y, n.x))
      obj.updateMatrix()
      streaks.current.setMatrixAt(i, obj.matrix)
    }

    streaks.current.count = range - 1
    streaks.current.instanceMatrix.updateRange.count = (range - 1) * 16
    streaks.current.instanceMatrix.needsUpdate = true

    obj.scale.setScalar(0)
    obj.updateMatrix()
    glow.current.setMatrixAt(0, obj.matrix)

    for (let i = 1; i < range; i++) {
      obj.position.fromArray(reflect.current.positions, i * 3)
      obj.scale.setScalar(1)
      obj.rotation.set(0, 0, clock.elapsedTime / 10)
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
      <instancedMesh ref={streaks} args={[null, null, 100]} instanceMatrix-usage={THREE.DynamicDrawUsage}>
        <planeGeometry />
        <meshBasicMaterial map={streakTexture} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={glow} args={[null, null, 100]} instanceMatrix-usage={THREE.DynamicDrawUsage}>
        <planeGeometry />
        <meshBasicMaterial map={glowTexture} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </>
  )
}