/** Direcciones de imagen que se pueden incrustar al exportar la tarjeta (html-to-image).
 *
 *  Las portadas de Google Books (y de otros sitios) no mandan la cabecera CORS, así que el
 *  navegador no deja copiarlas a la imagen final. Se piden a través de images.weserv.nl,
 *  un intermediario público de imágenes que sí la manda, y de paso las achica. Las fotos
 *  que están en Supabase (portadas y avatares subidos) ya tienen CORS y van directo. */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined

export function shareSafeImageUrl(url: string | null | undefined, width = 360): string | null {
  if (!url) return null
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (SUPABASE_URL && url.startsWith(SUPABASE_URL)) return url
  const withoutProtocol = url.replace(/^https?:\/\//, '')
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}&w=${width}&output=jpg&q=85`
}
