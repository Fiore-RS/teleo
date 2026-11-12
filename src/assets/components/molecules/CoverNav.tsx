import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import type { TabKey } from './TabBar'
import logoFull from '../../images/logo/logo-full.svg'
import logoIcon from '../../images/logo/logo-icon.svg'

/** El logo es de un solo color: se usa como máscara y se pinta con el color de texto de la
 *  tapa, así se lee sobre la tapa de cualquier tema, en claro y en oscuro. */
function CoverLogo({ src, className }: { src: string; className: string }) {
  const mask = `url("${src}") center / contain no-repeat`
  return (
    <span
      role="img"
      aria-label="Teleo: Diario de Lectura"
      className={`block bg-current ${className}`}
      style={{ mask, WebkitMask: mask }}
    />
  )
}

/** Secciones de la tapa. Perfil no va en la lista: se abre desde tu foto, abajo. */
const sections: { key: Exclude<TabKey, 'perfil'>; label: string }[] = [
  { key: 'mesa', label: 'La mesa' },
  { key: 'estante', label: 'Estante' },
  { key: 'cuaderno', label: 'Cuaderno' },
  { key: 'bitacora', label: 'Bitácora' },
]

interface CoverNavProps {
  active: TabKey
  onChange: (tab: TabKey) => void
  onActiveTap: () => void
}

/** Tapa del cuaderno lateral (V.4.0.0): la navegación de Teleo en tableta y escritorio. Es la
 *  misma tapa de la barra de pestañas del teléfono (color principal del tema con textura de
 *  puntos y costura), puesta a la izquierda. La sección activa es un separador de papel del
 *  color del fondo que sale de la tapa y se une con la pantalla.
 *  - Escritorio (260px): el logo completo, buscador, secciones con nombre, "Agregar libro" y tu foto.
 *  - Tableta (76px): el logo del libro solo; las secciones escritas de lado, como lomos; abajo
 *    + y tu foto.
 *  Se dibuja dentro del portal de TabBar; en el celular está oculta (hidden tableta:flex). */
export function CoverNav({ active, onChange, onActiveTap }: CoverNavProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const breakpoint = useBreakpoint()
  const [query, setQuery] = useState('')
  // La marca del recorrido va solo en la versión que se ve (la barra de abajo, la tapa de
  // tableta o la de escritorio): el recorrido busca el primer elemento con la marca.
  const tour = (key: TabKey) => (breakpoint === 'escritorio' ? `tab-${key}` : undefined)

  const name = profile?.nickname || profile?.username || ''
  const initial = (name.trim()[0] ?? 'T').toUpperCase()

  function go(key: TabKey) {
    if (key === active) onActiveTap()
    else onChange(key)
  }

  function search(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/estante?buscar=${encodeURIComponent(q)}` : '/estante')
    setQuery('')
  }

  const avatar = (
    <span
      aria-hidden="true"
      className="w-[38px] h-[38px] shrink-0 rounded-[9px] overflow-hidden bg-rose text-text flex items-center justify-center font-title text-[17px] -rotate-4"
    >
      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initial}
    </span>
  )
  const perfilActive = active === 'perfil'

  return (
    <nav
      aria-label="Secciones"
      className="hidden tableta:flex fixed inset-y-0 left-0 z-30 w-(--tapa-ancho) flex-col bg-cover text-cover-ink"
      style={{ boxShadow: '6px 0 18px -10px var(--teleo-cover-shadow)' }}
    >
      {/* Costura cerca del borde derecho. */}
      <span
        aria-hidden="true"
        className="absolute top-3 bottom-3 right-2 escritorio:right-3 border-r-[1.5px] border-dashed border-stitch pointer-events-none"
      />

      {/* ---------- Escritorio ---------- */}
      <div className="hidden escritorio:flex flex-col flex-1 min-h-0 pt-8 pb-6 pl-6.5">
        <div className="pr-10">
          <CoverLogo src={logoFull} className="w-[196px] aspect-[838/259] -ml-1" />
          <form role="search" onSubmit={search} className="relative mt-6.5">
            <label htmlFor="tapa-buscar" className="sr-only">
              Buscar en tu biblioteca
            </label>
            <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70" />
            <input
              id="tapa-buscar"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full h-10 pl-9 pr-3 rounded-field bg-cover-ink/10 border border-cover-ink/25 font-body text-body-md text-cover-ink placeholder:text-cover-ink/60 focus-visible:outline-2 focus-visible:outline-cover-ink"
            />
          </form>
        </div>

        <ul className="flex flex-col gap-1 mt-6.5">
          {sections.map(({ key, label }) => {
            const isActive = active === key
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => go(key)}
                  aria-current={isActive ? 'page' : undefined}
                  data-tour={tour(key)}
                  className={`relative w-[calc(100%+1px)] h-[46px] px-5 flex items-center rounded-l-[12px] font-display text-[18px] text-left transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cover-ink ${
                    isActive
                      ? 'bg-bg text-primary-text font-semibold shadow-[-3px_2px_6px_-3px_var(--teleo-cover-shadow)]'
                      : 'hover:bg-cover-ink/8'
                  }`}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="flex-1" />

        <div className="flex flex-col gap-4">
          <div className="pr-10">
            <button
              type="button"
              onClick={() => navigate('/estante?agregar=libro')}
              className="w-full h-11 rounded-button bg-cover-ink text-cover font-bold text-body-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cover-ink"
            >
              Agregar libro
            </button>
          </div>
          <button
            type="button"
            onClick={() => go('perfil')}
            aria-current={perfilActive ? 'page' : undefined}
            data-tour={tour('perfil')}
            className={`w-[calc(100%+1px)] flex items-center gap-3 py-2 pl-2 -ml-2 rounded-l-[12px] text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cover-ink ${
              perfilActive ? 'bg-bg text-primary-text shadow-[-3px_2px_6px_-3px_var(--teleo-cover-shadow)]' : 'hover:bg-cover-ink/8'
            }`}
          >
            {avatar}
            <span className="flex flex-col min-w-0">
              <span className="font-bold text-body-md truncate">{name || 'Tu perfil'}</span>
              <span className="text-[13px] opacity-80">Tu perfil</span>
            </span>
          </button>
        </div>
      </div>

      {/* ---------- Tableta ---------- */}
      <div className="flex escritorio:hidden flex-col items-end flex-1 min-h-0 pt-6 pb-5 pl-4.5">
        <CoverLogo src={logoIcon} className="self-center mr-4.5 mb-5 w-10 aspect-[412/340]" />
        <ul className="flex flex-col gap-1.5 w-full">
          {sections.map(({ key, label }) => {
            const isActive = active === key
            return (
              <li key={key} className="flex justify-end">
                <button
                  type="button"
                  onClick={() => go(key)}
                  aria-current={isActive ? 'page' : undefined}
                  data-tour={breakpoint === 'tableta' ? `tab-${key}` : undefined}
                  className={`w-[calc(100%+1px)] py-4.5 flex items-center justify-center rounded-r-[12px] rotate-180 [writing-mode:vertical-rl] font-display text-[17px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cover-ink ${
                    isActive ? 'bg-bg text-primary-text font-semibold' : 'hover:bg-cover-ink/8'
                  }`}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="flex-1" />
        <div className="self-center pr-4.5 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/estante?agregar=libro')}
            aria-label="Agregar libro"
            className="w-10 h-10 rounded-button bg-cover-ink text-cover flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cover-ink"
          >
            <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go('perfil')}
            aria-label="Tu perfil"
            aria-current={perfilActive ? 'page' : undefined}
            data-tour={breakpoint === 'tableta' ? 'tab-perfil' : undefined}
            className={`rounded-[11px] p-0.5 focus-visible:outline-2 focus-visible:outline-cover-ink ${perfilActive ? 'ring-2 ring-bg' : ''}`}
          >
            {avatar}
          </button>
        </div>
      </div>
    </nav>
  )
}
