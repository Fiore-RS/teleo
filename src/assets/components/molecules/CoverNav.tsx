import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
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
/** Menú Agregar (V.4.3.0): separadores que salen del borde de la tapa. Cada opción lleva a la
 *  pantalla donde vive lo que se agrega y abre ahí su formulario de siempre. Cada separador en
 *  un color suave del tema elegido (principal y sus tres acentos), que cambia solo en oscuro. */
const addOptions: { key: string; label: string; to: string; tone: string }[] = [
  { key: 'libro', label: 'Libro', to: '/estante?agregar=libro', tone: 'bg-primary-soft' },
  { key: 'saga', label: 'Saga', to: '/estante?agregar=saga', tone: 'bg-orange-soft' },
  { key: 'cita', label: 'Cita', to: '/cuaderno?vista=citas&agregar=cita', tone: 'bg-pink-soft' },
  { key: 'resena', label: 'Reseña', to: '/cuaderno?agregar=resena', tone: 'bg-magenta-soft' },
]

const sections: { key: Exclude<TabKey, 'perfil'>; label: string }[] = [
  { key: 'mesa', label: 'La mesa' },
  { key: 'estante', label: 'Estante' },
  { key: 'cuaderno', label: 'Cuaderno' },
  { key: 'bitacora', label: 'Bitácora' },
]

interface CoverNavProps {
  active: TabKey | null
  onChange: (tab: TabKey) => void
  onActiveTap: () => void
}

/** Tapa del cuaderno lateral (V.4.0.0): la navegación de Teleo en tableta y escritorio. Es la
 *  misma tapa de la barra de pestañas del teléfono (color principal del tema con textura de
 *  puntos y costura), puesta a la izquierda. La sección activa es un separador de papel del
 *  color del fondo que sale de la tapa y se une con la pantalla.
 *  - Escritorio (260px): el logo completo, buscador, secciones con nombre, "Agregar" y tu foto.
 *  - Tableta (76px): el logo del libro solo; las secciones escritas de lado, como lomos; abajo
 *    + y tu foto.
 *  "Agregar" (y el + de tableta) abre el menú de separadores: Libro, Saga, Cita, Reseña (V.4.3.0).
 *  Se dibuja dentro del portal de TabBar; en el celular está oculta (hidden tableta:flex). */
export function CoverNav({ active, onChange, onActiveTap }: CoverNavProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const breakpoint = useBreakpoint()
  // Buscador (V.4.2.0): busca mientras escribes y abre Buscar. La tapa se vuelve a montar con
  // cada pantalla, así que en Buscar el texto sale de la dirección (?q=) y, si se llegó
  // escribiendo, el cursor vuelve al buscador.
  const location = useLocation()
  const onBuscar = location.pathname === '/buscar'
  const [query, setQuery] = useState(() => (onBuscar ? new URLSearchParams(location.search).get('q') ?? '' : ''))
  const searchRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<number | undefined>(undefined)
  const cameTyping = (location.state as { desdeTapa?: boolean } | null)?.desdeTapa === true
  useEffect(() => {
    if (!cameTyping) return
    const input = searchRef.current
    if (!input) return
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }, [cameTyping])
  useEffect(() => () => window.clearTimeout(typingTimer.current), [])

  // Menú Agregar (V.4.3.0). Los separadores se alinean con el borde de abajo del botón que lo
  // abrió (el de escritorio o el + de tableta), así que se mide al abrir.
  // Al cerrar, los separadores se guardan bajo la tapa (animación de salida) y recién después
  // se desmonta el menú.
  const [addOpen, setAddOpen] = useState(false)
  const [addClosing, setAddClosing] = useState(false)
  const [addBottom, setAddBottom] = useState(0)
  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const firstAddRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(closeTimer.current), [])
  const addShown = addOpen && !addClosing

  function toggleAdd(button: HTMLButtonElement) {
    if (addOpen) {
      closeAdd()
      return
    }
    window.clearTimeout(closeTimer.current)
    setAddClosing(false)
    addButtonRef.current = button
    setAddBottom(window.innerHeight - button.getBoundingClientRect().bottom)
    setAddOpen(true)
  }

  function closeAdd({ focus = true }: { focus?: boolean } = {}) {
    if (!addOpen || addClosing) return
    if (focus) addButtonRef.current?.focus()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setAddClosing(true)
    closeTimer.current = window.setTimeout(() => {
      setAddOpen(false)
      setAddClosing(false)
    }, reduce ? 0 : 280)
  }

  function chooseAdd(to: string) {
    // Si la pantalla cambia, la tapa se vuelve a montar y el menú desaparece; si no, se guarda.
    closeAdd({ focus: false })
    navigate(to)
  }

  useEffect(() => {
    if (!addShown) return
    firstAddRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.preventDefault()
      closeAdd()
    }
    // Si cambia el tamaño de la pantalla, el botón se mueve: mejor cerrar sin animación.
    function onResize() {
      window.clearTimeout(closeTimer.current)
      setAddOpen(false)
      setAddClosing(false)
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addShown])

  function openBuscar(text: string) {
    const q = text.trim()
    navigate(q ? `/buscar?q=${encodeURIComponent(q)}` : '/buscar', { replace: onBuscar, state: { desdeTapa: true } })
  }

  function handleType(text: string) {
    setQuery(text)
    window.clearTimeout(typingTimer.current)
    // Fuera de Buscar se espera a que haya algo escrito; dentro, también borrar actualiza.
    if (!text.trim() && !onBuscar) return
    typingTimer.current = window.setTimeout(() => openBuscar(text), 250)
  }

  function clearSearch() {
    window.clearTimeout(typingTimer.current)
    setQuery('')
    if (onBuscar) openBuscar('')
    searchRef.current?.focus()
  }

  // Atajo "/" para el buscador (V.4.0.0), en escritorio, donde el buscador está en la tapa. No
  // se activa mientras se escribe en otro campo ni con una hoja abierta.
  useEffect(() => {
    if (breakpoint !== 'escritorio') return
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const isTyping = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      if (isTyping || document.querySelector('[aria-modal="true"]')) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [breakpoint])
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
    window.clearTimeout(typingTimer.current)
    openBuscar(query)
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

      {/* Menú Agregar (V.4.3.0): el velo cubre solo la mesa, la tapa queda a la vista. Los
          separadores salen de debajo de la tapa, en columna, desde la altura del botón. El
          contenedor recorta la entrada (y deja aire para la sombra y el hover). Cada separador
          es 24px más largo de lo que se ve: ese pedazo queda escondido bajo el borde de la tapa,
          así al pasar el mouse se corre a la derecha y parece que crece, sin despegarse. */}
      {addOpen && (
        <>
          <div
            aria-hidden="true"
            className={`fixed inset-y-0 right-0 left-(--tapa-ancho) bg-black/35 ${addClosing ? 'animate-fade-out pointer-events-none' : 'animate-fade-in'}`}
            onClick={() => closeAdd()}
          />
          <div
            className="fixed left-(--tapa-ancho) w-[200px] overflow-hidden pr-10 pb-6"
            style={{ bottom: Math.max(0, addBottom - 24) }}
          >
            <div id="menu-agregar" role="menu" aria-label="Agregar" className={`flex flex-col gap-2 ${addClosing ? 'separadores-out pointer-events-none' : 'separadores-in'}`}>
              {addOptions.map(({ key, label, to, tone }, i) => (
                <button
                  key={key}
                  ref={i === 0 ? firstAddRef : undefined}
                  type="button"
                  role="menuitem"
                  onClick={() => chooseAdd(to)}
                  className={`w-[174px] h-11 -ml-6 pl-6 rounded-r-[10px] ${tone} text-text font-display font-semibold text-[18px] shadow-[6px_8px_16px_-10px_var(--teleo-cover-shadow)] transition-transform duration-150 hover:translate-x-3 focus-visible:translate-x-3 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary-text motion-reduce:transition-none`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

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
              ref={searchRef}
              type="text"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => handleType(e.target.value)}
              placeholder="Buscar…"
              aria-keyshortcuts="/"
              className="w-full h-10 pl-9 pr-9 rounded-field bg-cover-ink/10 border border-cover-ink/25 font-body text-body-md text-cover-ink placeholder:text-cover-ink/60 focus-visible:outline-2 focus-visible:outline-cover-ink"
            />
            {/* Borrar, en el color de la tapa (el del navegador salía azul). */}
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Borrar la búsqueda"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-cover-ink/80 hover:text-cover-ink hover:bg-cover-ink/10 focus-visible:outline-2 focus-visible:outline-cover-ink"
              >
                <X size={15} />
              </button>
            )}
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
                      ? 'bg-(--tapa-papel) text-primary-text font-semibold shadow-[-3px_2px_6px_-3px_var(--teleo-cover-shadow)]'
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
              onClick={(e) => toggleAdd(e.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={addShown}
              aria-controls={addShown ? 'menu-agregar' : undefined}
              data-tour={breakpoint === 'escritorio' ? 'agregar' : undefined}
              className={`w-full h-11 rounded-button font-bold text-body-md transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cover-ink ${
                addShown ? 'bg-cover-ink/12 text-cover-ink border-[1.5px] border-cover-ink/70' : 'bg-cover-ink text-cover'
              }`}
            >
              {addShown ? 'Cerrar' : 'Agregar'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => go('perfil')}
            aria-current={perfilActive ? 'page' : undefined}
            data-tour={tour('perfil')}
            className={`relative w-[calc(100%+1px)] flex items-center gap-3 py-2 pl-3 rounded-l-[12px] text-left transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cover-ink ${
              perfilActive ? 'bg-(--tapa-papel) text-primary-text shadow-[-3px_2px_6px_-3px_var(--teleo-cover-shadow)]' : 'hover:bg-cover-ink/8'
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
        {/* Igual que en escritorio: solo la sección activa es un separador de papel. Cada
            sección tiene su propio alto y aire entre ellas, para que los nombres escritos de
            lado no se lean como una sola línea. */}
        <ul className="flex flex-col gap-2.5 w-full">
          {sections.map(({ key, label }) => {
            const isActive = active === key
            return (
              <li key={key} className="flex justify-end">
                <button
                  type="button"
                  onClick={() => go(key)}
                  aria-current={isActive ? 'page' : undefined}
                  data-tour={breakpoint === 'tableta' ? `tab-${key}` : undefined}
                  className={`w-[calc(100%+1px)] min-h-[118px] py-5 flex items-center justify-center rounded-r-[12px] rotate-180 [writing-mode:vertical-rl] font-display text-[16px] leading-none transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cover-ink ${
                    isActive
                      ? 'bg-(--tapa-papel) text-primary-text font-semibold shadow-[3px_-2px_6px_-3px_var(--teleo-cover-shadow)]'
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
        <div className="self-center pr-4.5 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={(e) => toggleAdd(e.currentTarget)}
            aria-label={addShown ? 'Cerrar' : 'Agregar'}
            aria-haspopup="menu"
            aria-expanded={addShown}
            aria-controls={addShown ? 'menu-agregar' : undefined}
            data-tour={breakpoint === 'tableta' ? 'agregar' : undefined}
            className={`w-10 h-10 rounded-button flex items-center justify-center transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cover-ink ${
              addShown ? 'bg-(--tapa-papel) text-primary-text' : 'bg-cover-ink text-cover'
            }`}
          >
            <Plus
              size={20}
              strokeWidth={2.4}
              aria-hidden="true"
              className={`transition-transform duration-200 motion-reduce:transition-none ${addShown ? 'rotate-45' : ''}`}
            />
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
