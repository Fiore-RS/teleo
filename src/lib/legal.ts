/** Textos de Política de privacidad y Términos de uso (Configuración > Información).
 *  Describen cómo funciona Teleo hoy: revisarlos cada vez que algo nuevo guarde datos.
 *  Al publicar un cambio, actualizar LEGAL_LAST_UPDATED y avisarlo en Novedades. */

export const LEGAL_LAST_UPDATED = 'septiembre de 2026'

export const INSTAGRAM_HANDLE = 'only.fiito'
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`

export interface LegalSection {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

export const privacySections: LegalSection[] = [
  {
    title: 'Qué datos guarda Teleo',
    bullets: [
      'Tu cuenta: correo, nombre de usuario, nickname, bio y foto de perfil. La contraseña la protege Supabase y nunca se guarda ni se ve en texto.',
      'Tu biblioteca: los libros que agregas, sus estados, fechas, progreso, precios, etiquetas, sagas y portadas que subas, además de los lanzamientos que anotas.',
      'Lo que escribes: reseñas, citas, personajes favoritos y sus fotos.',
      'Tu hábito: los días que marcas como leídos, tus metas anuales y los favoritos que eliges de cada mes y año.',
    ],
  },
  {
    title: 'Para qué se usan',
    paragraphs: [
      'Solo para que Teleo funcione y puedas ver tu información desde cualquier dispositivo. Teleo no muestra publicidad, no vende ni comparte tus datos y no usa herramientas de seguimiento ni de analítica.',
    ],
  },
  {
    title: 'Dónde se guardan',
    bullets: [
      'Tus datos y archivos se guardan en Supabase, el servicio que Teleo usa como base de datos.',
      'La app se publica en GitHub Pages.',
      'Cuando buscas un libro, lo que escribes en el buscador se envía a Google Books para encontrarlo. Las portadas de esa búsqueda también vienen de Google Books.',
      'Las tipografías se cargan desde Google Fonts.',
      'En tu dispositivo solo quedan algunas preferencias, como el modo de color o el orden de tus listas.',
    ],
  },
  {
    title: 'Cámara',
    paragraphs: [
      'Solo se usa para leer el código de barras de un libro cuando tú lo pides. No se guardan fotos ni videos.',
    ],
  },
  {
    title: 'Quién puede ver tus datos',
    paragraphs: [
      'Solo tú. Lo que compartes, como la tarjeta de perfil o el PDF de tu lista de deseados, lo decides tú cada vez. Como administradora tengo acceso técnico a la base de datos para mantener la app, y solo lo uso para resolver problemas, por ejemplo cuando me pides ayuda con tu cuenta.',
    ],
  },
  {
    title: 'Tu control sobre tus datos',
    paragraphs: [
      'Desde Configuración puedes exportar una copia de tu librería, vaciar tus datos, desactivar tu cuenta o eliminarla para siempre.',
    ],
  },
  {
    title: 'Cambios',
    paragraphs: ['Si esta política cambia, lo anunciaré en Novedades.'],
  },
  {
    title: 'Contacto',
    paragraphs: [`Para cualquier duda, escríbeme por Instagram a @${INSTAGRAM_HANDLE}.`],
  },
]

export const termsSections: LegalSection[] = [
  {
    title: 'Qué es Teleo',
    paragraphs: [
      'Teleo es un proyecto personal, gratuito y sin fines de lucro, hecho por una sola persona para registrar lecturas.',
    ],
  },
  {
    title: 'Tu cuenta',
    paragraphs: [
      'Eres responsable de cuidar tu contraseña y de lo que se haga con tu cuenta. Cada cuenta es para una sola persona.',
    ],
  },
  {
    title: 'Tu contenido',
    paragraphs: [
      'Todo lo que escribes y subes sigue siendo tuyo. Teleo solo lo guarda para mostrártelo a ti y, cuando tú lo decides, para generar lo que compartes.',
    ],
  },
  {
    title: 'Uso adecuado',
    paragraphs: [
      'No subas contenido ofensivo, ni fotos o textos que no tengas derecho a usar. No intentes entrar a cuentas ajenas ni afectar el funcionamiento de la app.',
    ],
  },
  {
    title: 'Portadas e información de libros',
    paragraphs: [
      'Los datos y portadas que vienen de Google Books pertenecen a sus dueños. Teleo solo los muestra para ayudarte a identificar tus libros.',
    ],
  },
  {
    title: 'Disponibilidad',
    paragraphs: [
      'Hago lo posible por cuidar tus datos y mantener Teleo funcionando, pero es un proyecto personal y puede tener errores, pausas o cambios. Te recomiendo exportar una copia de tu librería de vez en cuando desde Configuración.',
    ],
  },
  {
    title: 'Si Teleo cierra',
    paragraphs: ['Lo avisaré con tiempo para que puedas exportar tus datos antes.'],
  },
  {
    title: 'Cuentas que no cumplan estos términos',
    paragraphs: ['Puedo desactivar una cuenta que los incumpla, avisándote antes cuando sea posible.'],
  },
  {
    title: 'Contacto',
    paragraphs: [`Para cualquier duda, escríbeme por Instagram a @${INSTAGRAM_HANDLE}.`],
  },
]
