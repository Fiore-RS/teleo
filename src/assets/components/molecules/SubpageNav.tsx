import { useNavigate } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { TabBar, type TabKey } from './TabBar'

interface SubpageNavProps {
  /** Sección de la que cuelga la pantalla: queda marcada en la barra. */
  tab: TabKey
  /** A dónde lleva tocar la sección marcada (la pantalla de la que se viene). */
  parentPath: string
  /** Sin barra de pestañas (sin sesión o durante la bienvenida): botón "Listo" al final. */
  onDone?: () => void
  isDoneLoading?: boolean
}

/** Cierre de las pantallas secundarias (V.3.0.0): en vez de la flecha de regresar, la barra
 *  de pestañas queda visible con la sección de origen marcada, y tocarla vuelve a la
 *  pantalla de la que se viene. Donde no hay barra, un botón "Listo" abajo. */
export function SubpageNav({ tab, parentPath, onDone, isDoneLoading }: SubpageNavProps) {
  const navigate = useNavigate()

  if (onDone) {
    return (
      <div className="mt-8 pb-12">
        <Button variant="primary" onClick={onDone} isLoading={isDoneLoading}>
          Listo
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="pb-28" />
      <TabBar active={tab} onChange={(t) => navigate(`/${t}`)} onActiveTap={() => navigate(parentPath)} />
    </>
  )
}
