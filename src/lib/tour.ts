/**
 * Pasos del recorrido sobre la app real (V.3.3.0, vista previa C).
 *
 * Cada paso ilumina el elemento marcado con `data-tour="<target>"` en la pantalla `route`; si
 * no se está ahí, el recorrido cambia de pantalla solo. La mesa no tiene botón de agregar (el
 * "+" vive en Estante), así que el orden es: cinta de racha, Estante, agregar libro, Cuaderno,
 * Bitácora y Perfil.
 */
export interface TourStep {
  target: string
  route: string
  /** Pestaña del globito: el nombre del paso. */
  tab: string
  title: string
  text: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'racha',
    route: '/mesa',
    tab: 'Tu racha',
    title: 'Una cinta para cada día que lees',
    text: 'Marca tu sesión de lectura y la cinta se llena. Si lees varios días seguidos, el número crece. Tócala para ver tu calendario.',
  },
  {
    target: 'tab-estante',
    route: '/estante',
    tab: 'Estante',
    title: 'Tu librería, en repisas',
    text: 'Aquí viven todos tus libros y sagas. Ordénalos, fíltralos y, si no sabes qué leer, deja que Teleo elija un pendiente.',
  },
  {
    target: 'agregar',
    route: '/estante',
    tab: 'Agregar',
    title: 'Empieza por un libro',
    text: 'Búscalo por título o autor, o escríbelo a mano. Si ya usas Goodreads, puedes traer tu biblioteca desde Configuración.',
  },
  {
    target: 'tab-cuaderno',
    route: '/cuaderno',
    tab: 'Cuaderno',
    title: 'Tu diario de lectura',
    text: 'Escribe reseñas, califica tus lecturas a tu manera y guarda las citas que no quieres olvidar.',
  },
  {
    target: 'tab-bitacora',
    route: '/bitacora',
    tab: 'Bitácora',
    title: 'Tu historia con la lectura',
    text: 'Tus estadísticas, un resumen de cada mes y de cada año, y lo que vas comprando.',
  },
  {
    target: 'tab-perfil',
    route: '/perfil',
    tab: 'Perfil',
    title: 'Tu rincón',
    text: 'Tu biblioteca en cifras, lo que estás leyendo, tu meta, tus estanterías y tu tarjeta para compartir. Desde aquí también entras a Configuración.',
  },
]
