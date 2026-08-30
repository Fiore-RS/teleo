import { Routes, Route } from "react-router-dom";
import { LoadingScreen } from "./pages/LoadingScreen";
import { Inicio } from "./pages/Inicio";
import { Bienvenida } from "./pages/Bienvenida";
import { Tutorial } from "./pages/Tutorial";
import { Mesa } from "./pages/Mesa";
import { Estante } from "./pages/Estante";
import { Cuaderno } from "./pages/Cuaderno";
import { Bitacora } from "./pages/Bitacora";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { Perfil } from "./pages/Perfil";
import { Configuracion } from "./pages/Configuracion";
import { CambiarUsuario } from "./pages/CambiarUsuario";
import { CambiarCorreo } from "./pages/CambiarCorreo";
import { CambiarContrasena } from "./pages/CambiarContrasena";
import { PerfilPublico } from './pages/PerfilPublico'

function App() {
  return (
    // Teleo está pensada para móvil. En pantallas anchas (PC), en vez de
    // estirar el contenido borde a borde, lo centramos en una columna con
    // ancho de teléfono — mismo patrón que usan WhatsApp Web o Notion en
    // su vista móvil.
    <div className="min-h-screen bg-border">
      <div className="mx-auto w-full max-w-120 min-h-screen bg-bg md:shadow-2xl">
        <Routes>
          <Route path="/" element={<LoadingScreen />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/bienvenida" element={<Bienvenida />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/mesa" element={<Mesa />} />
          <Route path="/estante" element={<Estante />} />
          <Route path="/cuaderno" element={<Cuaderno />} />
          <Route path="/bitacora" element={<Bitacora />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/configuracion/usuario" element={<CambiarUsuario />} />
          <Route path="/configuracion/correo" element={<CambiarCorreo />} />
          <Route path="/configuracion/contrasena" element={<CambiarContrasena />} />
          <Route path="/@:username" element={<PerfilPublico />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;