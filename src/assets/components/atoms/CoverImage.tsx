import { useState, type ImgHTMLAttributes } from 'react'

/** Si la URL viene del servidor de contenido de Google Books, intentamos pedir
 *  una resolución mayor (zoom más alto). Algunos libros no tienen ese nivel de
 *  zoom escaneado y la imagen falla — en ese caso `onError` cae de vuelta a la
 *  URL original que sí sabemos que existe. */
function upgradedSrc(src: string): string | null {
  if (!/books\.google\.com|books\.googleusercontent\.com/.test(src)) return null
  if (!/[?&]zoom=/.test(src)) return null
  return src.replace(/([?&]zoom=)\d/, '$13')
}

type CoverImageProps = ImgHTMLAttributes<HTMLImageElement> & { src?: string }

export function CoverImage({ src, ...props }: CoverImageProps) {
  const [prevSrc, setPrevSrc] = useState(src)
  const [currentSrc, setCurrentSrc] = useState(src ? upgradedSrc(src) ?? src : undefined)

  // Si el src cambia (ej. se subió una portada nueva), reseteamos el estado durante
  // el render en vez de esperar a un efecto — así la imagen se actualiza de inmediato
  // sin necesidad de refrescar la página.
  if (src !== prevSrc) {
    setPrevSrc(src)
    setCurrentSrc(src ? upgradedSrc(src) ?? src : undefined)
  }

  if (!src) return null

  return (
    <img
      {...props}
      src={currentSrc}
      onError={() => {
        if (currentSrc !== src) setCurrentSrc(src)
      }}
    />
  )
}