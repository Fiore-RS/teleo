import { Routes, Route } from "react-router-dom";
import { LoadingScreen } from "./pages/LoadingScreen";
import { Inicio } from "./pages/Inicio";
import { Mesa } from "./pages/Mesa";
import { Estante } from "./pages/Estante";
import { Cuaderno } from "./pages/Cuaderno";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { Playground } from "./pages/PlayGround";
import { Perfil } from "./pages/Perfil";
import { Configuracion } from "./pages/Configuracion";
import { CambiarUsuario } from "./pages/CambiarUsuario";
import { CambiarCorreo } from "./pages/CambiarCorreo";
import { CambiarContrasena } from "./pages/CambiarContrasena";
import { PerfilPublico } from './pages/PerfilPublico'

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
      <Route path="/configuracion" element={<Configuracion />} />
      <Route path="/configuracion/usuario" element={<CambiarUsuario />} />
      <Route path="/configuracion/correo" element={<CambiarCorreo />} />
      <Route path="/configuracion/contrasena" element={<CambiarContrasena />} />
      <Route path="/@:username" element={<PerfilPublico />} />
    </Routes>
  );
}

export default App;
