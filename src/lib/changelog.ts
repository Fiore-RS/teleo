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
    version: '3.4.1',
    date: '1 de noviembre de 2026',
    title: 'Tu ticket, completo',
    items: [
      'En el ticket de tu mes y tu año, tu favorito (o el último libro que terminaste) va como una línea más, igual que el autor, y su título se ve completo aunque sea largo.',
      'Al pie del ticket queda solo tu @usuario.',
      'Las tarjetas de tu mes y tu año hablan en primera persona ("Mis lecturas de octubre", "Mi racha"), para que se sientan tuyas al compartirlas en historias.',
      'Arreglado: al compartir o descargar una tarjeta, a veces se repetía la misma portada en lugar de mostrar la de cada libro.',
    ],
  },
  {
    version: '3.4.0',
    announced: true,
    date: '30 de octubre de 2026',
    title: 'Toda la saga',
    items: [
      'Ponle género y ánimo a una saga desde Agregar saga o Editar saga, y llegan a todos sus libros. El ritmo sigue siendo de cada libro.',
      'Cada libro se puede cambiar en Editar libro. En Editar saga verás cuáles tienen su propio género o ánimo.',
      'Si cambias el género o el ánimo de una saga y algunos libros tienen otro puesto por ti, Teleo te pregunta una sola vez si los cambias.',
      'Al sumar libros a una saga, los que no tienen género ni ánimo reciben los de la saga. Si alguno tiene otros, Teleo te pregunta qué hacer.',
      'Si borras el género o el ánimo de una saga, o sacas un libro de ella, los libros conservan el suyo.',
      'Detalles de la saga muestra su género y su ánimo.',
      'En Estante › Sagas puedes filtrar por género y ánimo: aparecen las sagas que lo tienen, o que tienen algún libro con él.',
      'Los filtros de Estante se despliegan con sus opciones: estado, categoría, idioma y formato ahora se eligen con un toque, como el género y el ánimo.',
      '"Completar géneros" busca una sola vez por saga y guarda el género en la saga, en vez de uno por libro.',
    ],
  },
  {
    version: '3.3.1',
    date: '27 de octubre de 2026',
    title: 'Todas tus portadas',
    items: [
      'Las tarjetas de tu mes y tu año suman una nueva, justo después de tus libros y páginas: las portadas de todo lo que terminaste, en una cuadrícula que se ajusta a cuántos libros son.',
      'Si releíste un libro en ese tiempo, su portada aparece una sola vez. Con más de 30 libros, ves los primeros 29 y cuántos más hay.',
    ],
  },
  {
    version: '3.3.0',
    announced: true,
    date: '27 de octubre de 2026',
    title: 'Llegar a Teleo',
    items: [
      'Invita a alguien a Teleo desde Perfil › Compartir o desde Configuración: envía un enlace con un mensaje listo o una tarjeta en imagen con tu foto, un código QR y tu código.',
      'Cada cuenta tiene su código de Teleo, como TL-K7MQ-4XRA. Lo ves en Perfil › Compartir y en Configuración; tócalo para copiarlo.',
      'Quien abre tu invitación ve tu foto y tu @usuario en la portada, y al crear su cuenta aparece "Te invitó".',
      'Nuevo tutorial: un recorrido corto sobre la misma app, paso por paso. Lo ofrece la Bienvenida y lo puedes repetir desde Configuración › Información › Tutorial.',
      'El antiguo Tutorial ahora se llama Guía de Teleo: la explicación detallada de cada sección.',
      'La Bienvenida es más sencilla: un saludo con tu nombre y la opción de empezar el tutorial.',
      'Iniciar sesión, Crear cuenta, Recuperar contraseña e Instalar estrenan diseño. Al crear tu cuenta, Teleo te avisa mientras escribes si tu @usuario está libre, y te pide confirmar la contraseña.',
      'Mientras esperas el correo de confirmación, puedes instalar Teleo en tu pantalla de inicio.',
      'Tu lista de la temporada ahora se llama Mis próximas lecturas. Con "Agregar libros" eliges qué pendientes entran y cuáles salen, todos de una vez.',
      'El importador de Goodreads se renovó: las estanterías que coinciden con un género quedan como género, y al terminar Teleo te ofrece sugerir géneros para los libros que quedaron sin uno.',
      'Con el Estante vacío, un atajo te lleva a traer tu biblioteca de Goodreads.',
      'Compartir tu perfil, una cita o tu lista de deseados tiene botones más claros: "Compartir imagen" o "Compartir PDF", y "Descargar".',
      'Los títulos de las tarjetas se ven más limpios, sin íconos.',
      'Las hojas que se abren desde Perfil ahora bajan desde arriba, como todas, en vez de aparecer de golpe.',
      'En las tarjetas de tu año, el mes más lector ya no choca con la etiqueta de libros cuando hay muchos meses empatados, y se ven todos los lomos.',
      'La política de privacidad suma tu código de Teleo y quién te invitó.',
    ],
  },
  {
    version: '3.2.2',
    date: '20 de octubre de 2026',
    title: 'Tu @usuario',
    items: [
      'Los @usuario nuevos usan solo minúsculas, números, punto y guion bajo, entre 3 y 30 caracteres. Si ya tienes tu @, no cambia nada.',
      'Al crear tu cuenta o cambiar tu @, Teleo te avisa mientras escribes si algún carácter no se puede usar.',
      'Ya no se pueden tener dos @ iguales que solo cambien en mayúsculas.',
    ],
  },
  {
    version: '3.2.1',
    date: '20 de octubre de 2026',
    title: 'La lista de temporada',
    items: [
      'En tu lista de la temporada, el menú de opciones suma "Elegir uno al azar": "¿Qué leo ahora?" elige solo entre los libros de tu lista.',
      '"¿Qué leo ahora?" también tiene "Elegir de", para cambiar entre todos tus pendientes y tu lista de la temporada cuando la abres desde La mesa o Estante.',
      'El botón de opciones de tu lista de la temporada ya no tapa la esquina de la tarjeta.',
      'Las tarjetas para compartir tu mes y tu año se ven más limpias, sin destellos que choquen con lo demás.',
      'Los nombres largos de saga ya no se salen de la pantalla en los detalles de un libro: se ven en dos líneas.',
    ],
  },
  {
    version: '3.2.0',
    announced: true,
    date: '15 de octubre de 2026',
    title: 'Tu lectura en Teleo',
    items: [
      'Comparte tu mes o tu año en tarjetas tipo historia: tus libros y páginas, tu mes más lector, tus géneros y ánimos, tu autor del año, tu racha más larga, tus relecturas, tu favorito y un ticket con todo junto.',
      'En Bitácora, en Resumen › Mes, toca "Compartir mi mes". En Resumen › Año, "Compartir mi año". Durante el mes o el año en curso, las tarjetas dicen "Hasta hoy" o "Hasta ahora".',
      'Pasa las tarjetas con un toque (a la derecha avanza, a la izquierda vuelve) y comparte la que estás viendo o todas juntas.',
      'Las tarjetas toman los colores de tu tema y se saltan solas lo que no aplica: si un mes tiene un solo libro, no verás tarjetas vacías.',
      'En diciembre, La mesa te avisa cuando tu año esté listo para compartir.',
    ],
  },
  {
    version: '3.1.0',
    announced: true,
    date: '13 de octubre de 2026',
    title: 'Conocer mejor lo que lees',
    items: [
      'Cada libro puede tener hasta 3 géneros (también BL y GL), hasta 3 ánimos y su ritmo. Ponlos en Editar libro o al terminar un libro, en el nuevo paso "¿Cómo fue?".',
      'Crea tus propios ánimos con "+ Otro ánimo": quedan como opción para todos tus libros.',
      'Al agregar un libro desde la búsqueda, el género viene sugerido. Para los que ya tenías, usa "Completar géneros" en Configuración.',
      '"Completa tu estante" te muestra tus libros leídos uno por uno para ponerles género, ánimo y ritmo.',
      'Nuevo estado "En pausa": deja un libro a un lado sin abandonarlo. Guarda desde cuándo y por qué, y los días en pausa no cuentan para tu ritmo.',
      'Al terminar un libro de una saga, Teleo te propone el siguiente: empezarlo o pasarlo a pendientes.',
      'Los filtros de Estante se renovaron y suman género, ánimo, ritmo y etiquetas.',
      'Al editar un libro aparecen las etiquetas que ya usaste; un toque y listo.',
      '"¿Qué leo ahora?" estrena diseño y puede elegir por género, ánimo o ritmo.',
      'En Bitácora, "Géneros y ánimos" te muestra lo que más lees, en Estadísticas y en el Resumen de cada año.',
      'Ordena tus citas en Cuaderno por título, autor, fecha o a tu gusto, arrastrándolas.',
    ],
  },
  {
    version: '3.0.1',
    date: '13 de octubre de 2026',
    title: 'A buen ritmo',
    items: [
      'Teleo se siente más ágil: al cambiar de sección todo aparece al instante, y las pantallas como Configuración y Novedades entran desde un costado.',
      'Toca la portada de un libro en Leyendo ahora o en tu lista de la temporada para ver sus detalles.',
      'Si un libro es parte de una saga, sus detalles muestran a cuál pertenece y qué número es. Toca la saga para verla completa.',
      'El buscador de libros muestra hasta 10 resultados, con los que más se parecen a lo que escribiste primero, y en español o inglés antes que en otros idiomas.',
      'Si el buscador de libros no responde, Teleo te avisa en vez de decir que no encontró el libro.',
      'Mensajes más claros al iniciar sesión, al crear tu cuenta y al cambiar tu correo o contraseña: ahora te dicen si es la contraseña, la conexión o demasiados intentos.',
      'Las reseñas sin fecha ya aparecen en el Cuaderno.',
    ],
  },
  {
    version: '3.0.0',
    announced: true,
    date: '9 de octubre de 2026',
    title: 'Pasando la página',
    items: [
      'Teleo estrena diseño: cada sección es como la hoja de un cuaderno, con pestañas de separador y títulos con nueva tipografía.',
      'Tu racha ahora es una cinta marcapáginas en La mesa: se llena al marcar tu sesión del día y al tocarla abre el calendario.',
      'Tus libros y sagas se acomodan en repisas, con título y autor debajo de cada portada.',
      'Elige cómo se ve tu estante desde el botón de vista: 3 o 4 libros por fila, con o sin título y autor, y con o sin repisa.',
      'La barra de búsqueda y las pestañas se quedan fijas arriba al bajar en Estante, Cuaderno y Bitácora. Para volver arriba, toca la sección en la que estás.',
      'Agrega libros y reseñas con el botón flotante de abajo.',
      'Tus reseñas son hojas rayadas y tus citas, notas con la esquina doblada.',
      'Estadísticas más tranquila: tu año en una tarjeta y el resto plegado en "Más de tu bitácora".',
      'Resumen renovado: tu año en un estante de lomos, y tus favoritos del año y de cada mes en una sola hoja.',
      'Compras muestra cuánto has invertido por estado y agrupa tus libros por mes de compra.',
      'Perfil con portada nueva: tu banner completo, tu foto a un lado y tu biblioteca de un vistazo.',
      'Ya no hay flecha para regresar: la barra de abajo siempre queda a mano.',
    ],
  },
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
