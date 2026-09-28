import { Check } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { BannerArt } from '../atoms/BannerArt'
import { banners, type BannerId } from '../../../lib/banners'

interface BannerSheetProps {
  active: BannerId
  onClose: () => void
  onSelect: (banner: BannerId) => void
}

/** Catálogo de banners (V.2.1.0): se abre al tocar el banner en Editar perfil. Los 10 banners
 *  en dos columnas, con los colores del tema activo. Al tocar uno queda guardado al instante. */
export function BannerSheet({ active, onClose, onSelect }: BannerSheetProps) {
  return (
    <Sheet onClose={onClose} title="Banner">
      <p className="text-body-sm text-text-secondary mb-4">
        Elige el dibujo de la cabecera de Tu rincón. Toma los colores de tu tema.
      </p>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Banners">
        {banners.map((b) => {
          const isActive = b.id === active
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(b.id)}
              className={`text-left rounded-2xl p-1.5 border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
                isActive ? 'border-primary-text bg-surface-2' : 'border-transparent'
              }`}
            >
              <span className="relative block aspect-5/2 rounded-xl overflow-hidden bg-linear-to-br from-primary to-rose">
                <BannerArt banner={b.id} />
              </span>
              <span className="flex items-center justify-between gap-2 mt-2 px-1">
                <span className="font-body font-bold text-body-md text-text">{b.name}</span>
                {isActive && (
                  <span className="w-5 h-5 shrink-0 rounded-full bg-primary text-primary-ink flex items-center justify-center">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="block text-body-sm text-text-secondary leading-snug px-1 mt-0.5">{b.description}</span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
