import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

if(!localStorage.getItem('level')) localStorage.setItem('level', 1)
const level = + localStorage.getItem('level') 

createRoot(document.getElementById('root')).render(<App level = {level}  />)
