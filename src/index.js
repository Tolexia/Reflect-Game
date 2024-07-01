import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

const level = localStorage.getItem('level') ? + localStorage.getItem('level') : 1

createRoot(document.getElementById('root')).render(<App level = {level}  />)
