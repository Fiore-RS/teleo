import { Routes, Route } from 'react-router-dom'
import { LoadingScreen } from './pages/LoadingScreen'
import { Inicio } from './pages/Inicio'
import { Mesa } from './pages/Mesa'
import { Login } from './pages/Login'
import { Registro } from './pages/Registro'
import { Playground } from './pages/PlayGround'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoadingScreen />} />
      <Route path="/inicio" element={<Inicio />} />
      <Route path="/mesa" element={<Mesa />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/playground" element={<Playground />} />
    </Routes>
  )
}

export default App