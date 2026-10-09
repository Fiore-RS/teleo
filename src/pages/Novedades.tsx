import { Fragment, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Card } from '../assets/components/molecules/Card'
import { SubpageNav } from '../assets/components/molecules/SubpageNav'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import { changelog, markChangelogSeen } from '../lib/changelog'
import { isVersionBefore } from '../lib/announcement'

/** Novedades (Configuración): lo que trae cada versión de Teleo, de la más nueva a la más
 *  vieja. Al abrirla se marca la última versión como vista y se apaga el puntito.
 *  Si se llega desde el aviso de novedades acumuladas de La mesa (V.2.1.2), las versiones
 *  que la persona no había visto llevan "Nueva" y una línea separa lo que ya conocía. */
export function Novedades() {
  const location = useLocation()
  const catchUp = (location.state as { since?: string | null } | null) ?? null
  const isCatchUp = catchUp !== null && 'since' in catchUp
  const isNew = (version: string) => isCatchUp && isVersionBefore(catchUp.since, version)
  // Primera versión que ya conocía: arriba de ella va la línea "Hasta aquí ya lo habías visto".
  const firstSeenIndex = isCatchUp && catchUp.since ? changelog.findIndex((e) => !isNew(e.version)) : -1

  useEffect(() => {
    markChangelogSeen()
  }, [])

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <PageHeader title="Novedades" subtitle="Lo que ha cambiado en Teleo, versión por versión." />

      <div className="flex flex-col gap-4 stagger-children">
        {changelog.map((entry, i) => (
          <Fragment key={entry.version}>
          {i === firstSeenIndex && i > 0 && (
            <p className="flex items-center gap-3 text-body-sm text-text-muted before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
              Hasta aquí ya lo habías visto
            </p>
          )}
          <Card
            tab={{ label: `V.${entry.version}` }}
            action={<span className="block py-1 font-body text-body-sm text-text-muted">{entry.date}</span>}
          >
            {isNew(entry.version) && (
              <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-magenta-soft text-magenta-text text-[12px] font-bold">Nueva</span>
            )}
            <h3 className="font-display font-semibold text-display-md text-text">{entry.title}</h3>
            <ul className="mt-3 space-y-2.5">
              {entry.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-body-md text-text-secondary">
                  <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
          </Fragment>
        ))}
      </div>

      <SubpageNav tab="perfil" parentPath="/configuracion" />
    </div>
  )
}
