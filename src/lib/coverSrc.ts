/** Si la URL viene del servidor de contenido de Google Books, intentamos pedir
 *  una resolución mayor (zoom más alto). Algunos libros no tienen ese nivel de
 *  zoom escaneado y la imagen falla — en ese caso `onError` cae de vuelta a la
 *  URL original que sí sabemos que existe. */
export function upgradedSrc(src: string): string | null {
  if (!/books\.google\.com|books\.googleusercontent\.com/.test(src)) return null
  if (!/[?&]zoom=/.test(src)) return null
  return src.replace(/([?&]zoom=)\d/, '$13')
}

/** URL con la que `CoverImage` muestra una portada (la de mayor resolución si existe). Sirve
 *  para precargar portadas con la misma URL que después se va a pintar. */
export function coverDisplaySrc(src: string): string {
  return upgradedSrc(src) ?? src
}
