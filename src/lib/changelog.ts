/** Historial de versiones de Teleo para la pantalla Novedades (Configuración).
 *  La primera de la lista es la más nueva. Al publicar una versión nueva, se agrega arriba:
 *  el puntito de "hay novedades" aparece solo para quien todavía no la vio. */

export interface ChangelogEntry {
  version: string
  /** Fecha como se muestra, ej. "22 de septiembre de 2026". */
  date: string
  title: string
  items: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '2.0.0',
    date: 'Próximamente',
    title: 'Teleo crece',
    items: [
      '¿Qué leo ahora? elige al azar uno de tus pendientes cuando no sabes con cuál seguir.',
      'Agrega varios libros a una saga de una sola vez.',
      'Guarda las fechas de inicio y fin sin tener que escribir la reseña. Todo libro con fecha de fin cuenta para tu meta del año.',
      'Calendario de lectura con tu racha actual, tu racha más larga y los números de cada mes.',
      'Perfil renovado: tus números, tu actividad del mes, tu lista de temporada, el estante de abandonados y un botón para compartir.',
      'Configuración reorganizada, con Novedades, Detrás de Teleo, política de privacidad y términos de uso.',
      'Lanzamientos: anota los libros que esperas, míralos en un calendario y en una cuenta atrás, y el próximo aparece en La mesa.',
      'Nueva tarjeta para compartir en formato historia, con tu foto, tu meta, tu racha y las portadas de tu última lectura, la actual y la próxima.',
      'Bitácora ahora tiene Resumen, con tus libros de cada mes y año y tus favoritos, y Compras, con lo que invertiste libro por libro.',
      'Desde la primera vez que escribes una reseña ya puedes agregar calificaciones personalizadas y citas favoritas.',
      'En tu perfil, Favoritos, Recomendados, Deseados y Abandonados muestran cuatro libros distintos en cada visita.',
      'Todas las ventanas se abren desde arriba, los calendarios se deslizan al cambiar de mes y, al regresar, vuelves a la misma altura de la pantalla.',
    ],
  },
  {
    version: '1.2.2',
    date: '23 de septiembre de 2026',
    title: 'Más color y tu nickname',
    items: [
      'Nueva paleta con naranja, rosa y magenta para que cada sección tenga su propio color.',
      'Elige un nickname: Teleo te saluda con él en La mesa y aparece grande en tu perfil.',
      'Edita tu foto, nickname y bio desde el lápiz de tu perfil.',
      'Ahora puedes cambiar tu @usuario cada 7 días.',
    ],
  },
  {
    version: '1.2.1',
    date: '23 de septiembre de 2026',
    title: 'Instalar y contraseñas',
    items: [
      'Página para instalar Teleo en tu celular desde un enlace.',
      'Botón para ver u ocultar la contraseña mientras la escribes.',
      '¿Olvidaste tu contraseña? Ahora puedes recuperarla desde el correo.',
    ],
  },
  {
    version: '1.2.0',
    date: '22 de septiembre de 2026',
    title: 'Rediseño',
    items: [
      'Teleo estrena diseño: el vino del ícono como color de marca, tipografías nuevas y tarjetas en todas las secciones.',
      'Las pantallas cargan más rápido y muestran siluetas mientras llegan tus datos.',
      'Animaciones suaves al cambiar de pantalla y al abrir hojas y diálogos.',
    ],
  },
  {
    version: '1.1.1',
    date: 'Agosto de 2026',
    title: 'La primera Teleo',
    items: [
      'La mesa, Estante, Cuaderno, Bitácora y tu perfil.',
      'Sagas, relecturas, lista de temporada, racha diaria y meta anual.',
      'Tarjeta para compartir tu perfil y PDF de tu lista de deseados.',
      'Teleo se puede instalar como app en el celular.',
    ],
  },
]

export const LATEST_VERSION = changelog[0].version

const SEEN_KEY = 'teleo-novedades-vistas'

/** true si la versión más nueva todavía no se abrió en Novedades en este dispositivo. */
export function hasUnseenChangelog(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== LATEST_VERSION
  } catch {
    return false
  }
}

export function markChangelogSeen() {
  try {
    localStorage.setItem(SEEN_KEY, LATEST_VERSION)
  } catch {
    // Sin almacenamiento (modo privado): el puntito simplemente vuelve a aparecer.
  }
}
