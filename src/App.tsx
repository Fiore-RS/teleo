import { Routes, Route, useLocation } from "react-router-dom";
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
import { Instalar } from "./pages/Instalar";
import { RecuperarContrasena } from "./pages/RecuperarContrasena";
import { NuevaContrasena } from "./pages/NuevaContrasena";
import { CambiarNickname } from "./pages/CambiarNickname";
import { CorreoConfirmado } from "./pages/CorreoConfirmado";
import { DetrasDeTeleo } from "./pages/DetrasDeTeleo";
import { Novedades } from "./pages/Novedades";
import { Lanzamientos } from "./pages/Lanzamientos";
import { Privacidad, Terminos } from "./pages/LegalPage";

function App() {
  const location = useLocation();

  return (
    // Teleo está pensada para móvil. En pantallas anchas (PC), en vez de
    // estirar el contenido borde a borde, lo centramos en una columna con
    // ancho de teléfono — mismo patrón que usan WhatsApp Web o Notion en
    // su vista móvil.
    <div className="min-h-screen bg-border">
      <div className="mx-auto w-full max-w-120 min-h-screen bg-bg md:shadow-2xl">
        {/* key = ruta: al cambiar de pantalla (por la barra de pestañas o navegando) el
            contenedor se vuelve a montar y reproduce el fundido de entrada. */}
        <div key={location.pathname} className="animate-page-in">
        <Routes location={location}>
          <Route path="/" element={<LoadingScreen />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/instalar" element={<Instalar />} />
          <Route path="/bienvenida" element={<Bienvenida />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/mesa" element={<Mesa />} />
          <Route path="/estante" element={<Estante />} />
          <Route path="/cuaderno" element={<Cuaderno />} />
          <Route path="/bitacora" element={<Bitacora />} />
          <Route path="/lanzamientos" element={<Lanzamientos />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/configuracion/usuario" element={<CambiarUsuario />} />
          <Route path="/configuracion/correo" element={<CambiarCorreo />} />
          <Route path="/configuracion/contrasena" element={<CambiarContrasena />} />
          <Route path="/configuracion/nickname" element={<CambiarNickname />} />
          <Route path="/configuracion/detras-de-teleo" element={<DetrasDeTeleo />} />
          <Route path="/configuracion/novedades" element={<Novedades />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/correo-confirmado" element={<CorreoConfirmado />} />
        </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;