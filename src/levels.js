import { useState } from "react"

let level_won = false
function handle_hovered(data, next_level)
{
  if(data.game_over && !level_won)
  {
    level_won = true
    setTimeout(() => {
      next_level()
    }, 1000);
  }
}

function Block(props) {

    // console.log(props)
    const [hovered, hover] = useState(false)
    return (
      <mesh onRayOver={(e) => (hover(true), handle_hovered(e, props.next_level))} onRayOut={(e) => hover(false)} {...props}>
        <boxGeometry />
        <meshBasicMaterial color={hovered ? [4, 2, 0] : 'orange'} />
      </mesh>
    )
}

function Triangle(props) {
    const [hovered, hover] = useState(false)
    return (
        <mesh {...props} 
        onRayOver={(e) => (e.stopPropagation(), hover(true), handle_hovered(e, props.next_level))} 
        onRayOut={(e) => hover(false)} 
        // onRayMove={(e) => null /*console.log(e.direction)*/}
        >
        <cylinderGeometry args={[1, 1, 1, 3, 1]} />
        <meshBasicMaterial color={hovered ? [5.5, 1, 2] : 'hotpink'} />
        </mesh>
    )
}
function Disc(props) {
    const [hovered, hover] = useState(false)
    return (
        <mesh {...props} 
        onRayOver={(e) => ( hover(true), handle_hovered(e, props.next_level))} 
        onRayOut={(e) => hover(false)} 
        // onRayMove={(e) => null /*console.log(e.direction)*/}
        >
        <sphereGeometry args={[0.5, 15, 15]} />
        <meshBasicMaterial color={hovered ? [1, 5.5, 2] : 'lightgreen'} />
        </mesh>
    )
}

const levels = {}

const level1 =  [
    <Block scale={0.5} position={[0.25, -0.15, 0]} />,
    <Block scale={0.5} position={[-2, 1.2, 0]} rotation={[0, 0, -0.55]} />,
    <Triangle scale={0.4} position={[-1.5, -1.2, 0]} rotation={[Math.PI / 2, Math.PI, 0]} />
]
levels[1] = level1 

const level2 =  [
    <Block scale={0.5} position={[-2.5, -2.5, 0]} />,
    <Disc scale={0.5} position={[2.5, -2.5, 0]} />,
    <Block scale={0.5} position={[-2, 1.2, 0]} rotation={[0, 0, -0.55]} />,
    <Triangle scale={0.4} position={[2.5, 0, 0]} rotation={[Math.PI / 2, Math.PI, 0]} />
]
levels[2] = level2 



export default levels