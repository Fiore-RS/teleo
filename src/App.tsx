import { Routes, Route } from 'react-router-dom'
import { LoadingScreen } from './pages/LoadingScreen'
import { Inicio } from './pages/Inicio'
import { Mesa } from './pages/Mesa'
import { Login } from './pages/Login'
import { Registro } from './pages/Registro'
import { Playground } from './pages/PlayGround'

function Estante() {
  return <div className="min-h-screen bg-bg p-6 text-text">Estante — pendiente de construir</div>
}
function Cuaderno() {
  return <div className="min-h-screen bg-bg p-6 text-text">Cuaderno — pendiente de construir</div>
}
function Perfil() {
  return <div className="min-h-screen bg-bg p-6 text-text">Perfil — pendiente de construir</div>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoadingScreen />} />
      <Route path="/inicio" element={<Inicio />} />
      <Route path="/mesa" element={<Mesa />} />
      <Route path="/estante" element={<Estante />} />
      <Route path="/cuaderno" element={<Cuaderno />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/playground" element={<Playground />} />
    </Routes>
  )
}

export default App