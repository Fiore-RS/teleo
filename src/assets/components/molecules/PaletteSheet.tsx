import { Check } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { palettes, type Palette, type PaletteId } from '../../../lib/palettes'
import { useTheme } from '../../../hooks/useTheme'

interface PaletteSheetProps {
  onClose: () => void
  /** Guarda el tema en el perfil, además de aplicarlo en este dispositivo. */
  onSave: (palette: PaletteId) => void
}

/** Vista previa en miniatura de un tema: fondo, una tarjeta, el botón principal y los tres
 *  acentos, en el modo (claro u oscuro) que esté usando la app en este momento. */
function PalettePreview({ palette, mode }: { palette: Palette; mode: 'light' | 'dark' }) {
  const c = palette[mode]
  return (
    <div aria-hidden="true" className="rounded-xl p-2.5 flex flex-col gap-1.5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="rounded-lg p-2 flex flex-col gap-1.5" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
        <span className="h-1.5 w-3/5 rounded-full" style={{ background: c.text, opacity: 0.7 }} />
        <span className="h-1.5 w-2/5 rounded-full" style={{ background: c.text, opacity: 0.3 }} />
        <div className="flex gap-1 mt-0.5">
          {c.accents.map((accent) => (
            <span key={accent} className="h-3.5 flex-1 rounded-md" style={{ background: accent }} />
          ))}
        </div>
      </div>
      <span className="h-4 rounded-full" style={{ background: c.primary }} />
    </div>
  )
}

/** Hoja "Tema" de Configuración › Apariencia (V.2.1.0): los 10 temas en dos columnas. Al tocar
 *  uno se aplica al instante (se ve detrás de la hoja) y queda guardado en la cuenta. */
export function PaletteSheet({ onClose, onSave }: PaletteSheetProps) {
  const { palette: active, setPalette, resolvedTheme } = useTheme()

  function choose(id: PaletteId) {
    if (id === active) return
    setPalette(id)
    onSave(id)
  }

  return (
    <Sheet onClose={onClose} title="Tema">
      <p className="text-body-sm text-text-secondary mb-4">
        Cambia los colores de toda la app. Cada tema tiene su versión clara y oscura.
      </p>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Temas de color">
        {palettes.map((p) => {
          const isActive = p.id === active
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => choose(p.id)}
              className={`text-left rounded-2xl p-2 border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
                isActive ? 'border-primary-text bg-surface-2' : 'border-transparent'
              }`}
            >
              <PalettePreview palette={p} mode={resolvedTheme} />
              <span className="flex items-center justify-between gap-2 mt-2 px-0.5">
                <span className="font-body font-bold text-body-md text-text">{p.name}</span>
                {isActive && (
                  <span className="w-5 h-5 shrink-0 rounded-full bg-primary text-primary-ink flex items-center justify-center">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="block text-body-sm text-text-secondary leading-snug px-0.5 mt-0.5">{p.description}</span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
