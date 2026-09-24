import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { SegmentedTabs } from '../assets/components/atoms/SegmentedTabs'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { Estadisticas } from './bitacora/Estadisticas'
import { Resumen, type ResumenView } from './bitacora/Resumen'
import { Compras } from './bitacora/Compras'

type BitacoraTab = 'estadisticas' | 'resumen' | 'compras'

const subtitles: Record<BitacoraTab, string> = {
  estadisticas: 'Tu viaje literario: tu ritmo, tu colección y tus calificaciones.',
  resumen: 'Los libros que terminaste, mes a mes, y tus favoritos.',
  compras: 'Cuánto has invertido en tu biblioteca, libro por libro.',
}

/** Bitácora como centro de lo que registraste (fase 6): Estadísticas, Resumen y Compras.
 *  La pestaña, la vista del resumen y el año van en la dirección (?vista=resumen&ver=anio&anio=2025)
 *  para que "Mis años en libros" pueda abrir directo un año y al volver se conserve. */
export function Bitacora() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('vista')
  const tab: BitacoraTab = tabParam === 'resumen' || tabParam === 'compras' ? tabParam : 'estadisticas'
  const viewParam = searchParams.get('ver')
  const resumenView: ResumenView = viewParam === 'anio' || viewParam === 'favoritos' ? viewParam : 'mes'
  const currentYear = new Date().getFullYear()
  const yearParam = Number(searchParams.get('anio'))
  const resumenYear = yearParam > 1900 && yearParam <= currentYear ? yearParam : currentYear

  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  function handleTabBarChange(t: TabKey) {
    navigate(`/${t}`)
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <header className="px-1 pt-4 pb-5">
        <h1 className="font-title text-[clamp(30px,8.5vw,44px)] leading-none text-text">Bitácora</h1>
        <p className="font-body text-body-md text-text-secondary mt-2">{subtitles[tab]}</p>
      </header>

      <div className="mb-5">
        <SegmentedTabs
          active={tab}
          onChange={(t) => updateParams({ vista: t === 'estadisticas' ? null : t })}
          options={[
            { value: 'estadisticas', label: 'Estadísticas' },
            { value: 'resumen', label: 'Resumen' },
            { value: 'compras', label: 'Compras' },
          ]}
        />
      </div>

      {tab === 'estadisticas' && (
        <Estadisticas
          userId={user?.id}
          onOpenYear={(year) => updateParams({ vista: 'resumen', ver: 'anio', anio: String(year) })}
        />
      )}
      {tab === 'resumen' && (
        <Resumen
          userId={user?.id}
          view={resumenView}
          onViewChange={(v) => updateParams({ ver: v === 'mes' ? null : v })}
          year={resumenYear}
          onYearChange={(y) => updateParams({ anio: y === currentYear ? null : String(y) })}
        />
      )}
      {tab === 'compras' && <Compras userId={user?.id} currency={profile?.currency} />}

      <div className="pb-28" />
      <TabBar active="bitacora" onChange={handleTabBarChange} />
    </div>
  )
}
