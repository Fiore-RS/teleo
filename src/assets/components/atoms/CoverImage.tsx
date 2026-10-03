import { useState, type ImgHTMLAttributes } from 'react'
import { upgradedSrc } from '../../../lib/coverSrc'

type CoverImageProps = ImgHTMLAttributes<HTMLImageElement> & { src?: string }

export function CoverImage({ src, loading = 'lazy', decoding = 'async', ...props }: CoverImageProps) {
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
      // `lazy`/`async` por defecto: en pantallas como Estante o Cuaderno se renderizan
      // decenas (o cientos) de portadas de golpe, y sin esto el navegador intenta pedir
      // TODAS las imágenes a la vez apenas se monta la pantalla, lo que se siente como una
      // carga lenta. Con lazy loading nativo, el navegador solo pide las portadas cerca del
      // viewport y va pidiendo el resto a medida que se hace scroll. Se puede sobreescribir
      // pasando `loading`/`decoding` explícito donde sí importa cargar de inmediato.
      loading={loading}
      decoding={decoding}
      src={currentSrc}
      onError={() => {
        if (currentSrc !== src) setCurrentSrc(src)
      }}
    />
  )
}