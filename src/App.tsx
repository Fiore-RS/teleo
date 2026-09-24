import { lazy, Suspense, useEffect, useLayoutEffect, type ComponentType } from "react";
import { Routes, Route, Navigate, useLocation, useNavigationType } from "react-router-dom";
import { LoadingScreen } from "./pages/LoadingScreen";

/* Cada pantalla se descarga recién cuando se abre (lazy), en vez de venir toda en un solo
 * archivo al abrir la app. La pantalla de carga sí va incluida, porque es la primera que se ve. */
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((module) => ({ default: module[name] })));

const Inicio = page(() => import("./pages/Inicio"), "Inicio");
const Bienvenida = page(() => import("./pages/Bienvenida"), "Bienvenida");
const Tutorial = page(() => import("./pages/Tutorial"), "Tutorial");
const Mesa = page(() => import("./pages/Mesa"), "Mesa");
const Estante = page(() => import("./pages/Estante"), "Estante");
const Cuaderno = page(() => import("./pages/Cuaderno"), "Cuaderno");
const Bitacora = page(() => import("./pages/Bitacora"), "Bitacora");
const Login = page(() => import("./pages/Login"), "Login");
const Registro = page(() => import("./pages/Registro"), "Registro");
const Perfil = page(() => import("./pages/Perfil"), "Perfil");
const Configuracion = page(() => import("./pages/Configuracion"), "Configuracion");
const CambiarUsuario = page(() => import("./pages/CambiarUsuario"), "CambiarUsuario");
const CambiarCorreo = page(() => import("./pages/CambiarCorreo"), "CambiarCorreo");
const CambiarContrasena = page(() => import("./pages/CambiarContrasena"), "CambiarContrasena");
const Instalar = page(() => import("./pages/Instalar"), "Instalar");
const RecuperarContrasena = page(() => import("./pages/RecuperarContrasena"), "RecuperarContrasena");
const NuevaContrasena = page(() => import("./pages/NuevaContrasena"), "NuevaContrasena");
const CambiarNickname = page(() => import("./pages/CambiarNickname"), "CambiarNickname");
const CorreoConfirmado = page(() => import("./pages/CorreoConfirmado"), "CorreoConfirmado");
const DetrasDeTeleo = page(() => import("./pages/DetrasDeTeleo"), "DetrasDeTeleo");
const Novedades = page(() => import("./pages/Novedades"), "Novedades");
const Lanzamientos = page(() => import("./pages/Lanzamientos"), "Lanzamientos");
const Privacidad = page(() => import("./pages/LegalPage"), "Privacidad");
const Terminos = page(() => import("./pages/LegalPage"), "Terminos");

/** Las pestañas principales se descargan en segundo plano apenas carga la app, para que al
 *  tocarlas en la barra aparezcan al instante, sin esperar la descarga. */
function preloadMainTabs() {
  void import("./pages/Mesa");
  void import("./pages/Estante");
  void import("./pages/Cuaderno");
  void import("./pages/Bitacora");
  void import("./pages/Perfil");
}

/** Cualquier dirección que no existe (un enlace viejo a /@usuario, una dirección mal escrita)
 *  vuelve a la pantalla de carga, que lleva a La mesa, a Bienvenida o al inicio según la
 *  sesión. Antes quedaba la pantalla en blanco.
 *  Excepción: los enlaces de Supabase llegan con sus datos en el "#" sin ruta
 *  (#access_token=..., #message=...). Esos los resuelve main.tsx; si acá se redirigiera de
 *  inmediato, se borraría el "#" antes de que Supabase termine de leerlo. */
function RutaDesconocida() {
  const hash = window.location.hash;
  const isAuthLink = hash.length > 1 && !hash.startsWith("#/");
  if (isAuthLink) return null;
  return <Navigate to="/" replace />;
}

function App() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Después de la pantalla de carga (unos segundos), sin competir con lo que se ve primero.
  useEffect(() => {
    const timer = window.setTimeout(preloadMainTabs, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // Altura de desplazamiento de cada pantalla visitada (por su entrada en el historial), para
  // devolverla al regresar con el botón de atrás o el gesto del teléfono.
  useEffect(() => {
    let frame = 0;
    function handleScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(`teleo-scroll:${location.key}`, String(window.scrollY));
        } catch {
          // Sin almacenamiento: al regresar simplemente se vuelve arriba.
        }
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.key]);

  // Pantalla nueva: arranca arriba. Al regresar (POP): vuelve a donde estaba. Se reintenta
  // un par de cuadros por si la pantalla todavía está armando su contenido. Los cambios que
  // solo reemplazan la dirección (REPLACE, ej. pestañas de Bitácora o el año del Resumen) no
  // mueven la página.
  useLayoutEffect(() => {
    if (navigationType === "REPLACE") return;
    let saved: string | null = null;
    if (navigationType === "POP") {
      try {
        saved = sessionStorage.getItem(`teleo-scroll:${location.key}`);
      } catch {
        saved = null;
      }
    }
    const y = saved === null ? 0 : Number(saved);
    window.scrollTo(0, y);
    if (y === 0) return;
    let tries = 0;
    let frame = requestAnimationFrame(function retry() {
      window.scrollTo(0, y);
      if (++tries < 10 && Math.abs(window.scrollY - y) > 2) frame = requestAnimationFrame(retry);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, navigationType]);

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
        {/* Mientras llega el archivo de una pantalla que todavía no se abrió, no se muestra
            nada (suele ser un instante); cada pantalla ya trae sus siluetas de carga. */}
        <Suspense fallback={null}>
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
          <Route path="*" element={<RutaDesconocida />} />
        </Routes>
        </Suspense>
        </div>
      </div>
    </div>
  );
}

export default App;