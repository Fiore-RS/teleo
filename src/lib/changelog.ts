/** Historial de versiones de Teleo para la pantalla Novedades (Configuración).
 *  La primera de la lista es la más nueva. Al publicar una versión nueva, se agrega arriba:
 *  el puntito de "hay novedades" aparece solo para quien todavía no la vio. */

export interface ChangelogEntry {
  version: string
  /** Fecha como se muestra, ej. "22 de septiembre de 2026". */
  date: string
  title: string
  items: string[]
  /** true si la versión tuvo hoja de anuncio en La mesa (un cambio considerable). Cuenta
   *  para el aviso de novedades acumuladas (V.2.1.2). */
  announced?: boolean
}

export const changelog: ChangelogEntry[] = [
  {
    version: '2.2.1',
    date: '3 de octubre de 2026',
    title: 'Puliendo detalles',
    items: [
      'Los menús para elegir categoría, idioma o estado ya no se cortan dentro de las hojas.',
      'En "¿Qué leo ahora?", al tocar "Otra vez" ahora también cambian las portadas, como una ruleta.',
      'La pantalla ya no se queda sin poder desplazarse después de eliminar un libro.',
    ],
  },
  {
    version: '2.2.0',
    announced: true,
    date: '1 de octubre de 2026',
    title: 'Todo en su lugar',
    items: [
      'Agregar y editar libros, sagas y citas ahora tiene un diseño más ordenado y fácil de leer.',
      'Los detalles de cada libro y de cada saga estrenan diseño.',
      'El estado de una saga se calcula solo a partir de sus libros, y su categoría (novela, cómic, etc.) se completa automáticamente.',
      'Reseñar, actualizar tu progreso y fijar tu meta ahora es más rápido.',
      'Lanzamientos también se renovó.',
      'Tu usuario, nombre, correo y contraseña ahora se editan desde paneles en Configuración, sin cambiar de página.',
      'Elegir un libro para reseñar o compartir ahora tiene buscador.',
      'Las confirmaciones son más claras y te muestran el libro del que se trata.',
    ],
  },
  {
    version: '2.1.2',
    date: '29 de septiembre de 2026',
    title: 'Para ponerte al día',
    items: [
      'Si pasas un tiempo sin entrar, Teleo te cuenta al volver qué actualizaciones importantes te perdiste y te lleva directo a verlas en Novedades.',
    ],
  },
  {
    version: '2.1.1',
    announced: true,
    date: '29 de septiembre de 2026',
    title: 'Leer con cuidado',
    items: [
      'Avisos de contenido: agrégalos a tu reseña desde "Agregar avisos de contenido". Al leerla aparecen ocultos hasta que tocas Ver.',
      'Cada cita de Mis citas tiene un menú (⋯) para compartirla, ver su reseña, editarla o eliminarla.',
      'En tu perfil, los botones del banner ya no se salen de la cabecera, y en Editar perfil tu nickname ya no se corta.',
      'Los menús de la app se abren con una animación suave.',
      'Al actualizar tu progreso, lo que escribes ya no se borra si pones la fecha de inicio en ese momento.',
      'Las confirmaciones para eliminar una reseña, una saga o una cita ahora dicen "eliminada".',
    ],
  },
  {
    version: '2.1.0',
    announced: true,
    date: '29 de septiembre de 2026',
    title: 'Tu rincón con más vida',
    items: [
      'Seis temas de color para toda la app: Atardecer, Aurora boreal, Biblioteca, Algodón de azúcar, Bosque y Margarita. Elígelo en Configuración › Apariencia.',
      'Diez banners para la cabecera de tu perfil. Tócalo desde el lápiz para cambiarlo; también aparece en tu tarjeta para compartir.',
      'Teleo ahora sigue el modo claro u oscuro de tu teléfono. Si prefieres uno fijo, cámbialo en Configuración › Apariencia.',
      'Mis citas: una pestaña nueva en Cuaderno con todas tus citas, búsqueda, una cita al azar y la opción de compartirlas como imagen decorada.',
      'Anota citas mientras lees, con su página. Cuando terminas el libro y escribes la reseña, ya están ahí.',
      'Importa tu biblioteca desde Goodreads en Configuración › Tus datos, con tus sagas, estantes y portadas.',
      'Marca un libro como regalo y anota quién te lo dio. Los regalos cuentan como ₡0 y tienen su propio filtro en Compras.',
      'Ritmo de lectura: en La mesa ves cuándo terminarías el libro que estás leyendo si sigues al mismo ritmo.',
      'Bitácora muestra por categoría y formato lo que leíste, en Estadísticas y en el Resumen de cada año.',
      'En Compras, "En terminados" reemplaza a "Promedio por libro".',
      'En tu perfil, Favoritos, Recomendados, Deseados y Abandonados ahora muestran cinco libros en cada visita.',
      'Tu foto, nickname, bio y banner se cambian desde el lápiz de tu perfil. Se quitó el código QR de la tarjeta.',
      'Pestañas nuevas en el Resumen de Bitácora y arreglos en la tarjeta para compartir: la fecha y el borde de la foto.',
    ],
  },
  {
    version: '2.0.1',
    date: '25 de septiembre de 2026',
    title: 'Pequeños ajustes',
    items: [
      'En Compras de Bitácora, todos los montos se ven del mismo tamaño en el teléfono.',
      'El precio que le pones a un lanzamiento ahora queda como precio del libro en tu lista de deseados.',
      'Tu respaldo de datos ahora guarda todo: metas, racha, historial de lecturas, favoritos del mes y del año, y lanzamientos.',
      'Si abres un enlace que ya no existe, Teleo te lleva a tu mesa en vez de mostrar una pantalla en blanco.',
      'Teleo abre más rápido y ocupa menos espacio en tu celular.',
    ],
  },
  {
    version: '2.0.0',
    announced: true,
    date: '24 de septiembre de 2026',
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
