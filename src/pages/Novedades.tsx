import { Fragment, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
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
 *  que la persona no había visto llevan "Nueva" y una línea separa lo que ya conocía.
 *
 *  V.3.6.0: la lista se hacía muy larga, así que cada versión se pliega. Se ve la pestaña con
 *  el número y el título, con una flecha a la derecha para desplegarla; adentro, la fecha va
 *  como primer punto. Abiertas de entrada: la versión más nueva y, si se llega desde el aviso
 *  de novedades acumuladas, todas las que la persona no había visto. */
export function Novedades() {
  const location = useLocation()
  const catchUp = (location.state as { since?: string | null } | null) ?? null
  const isCatchUp = catchUp !== null && 'since' in catchUp
  const isNew = (version: string) => isCatchUp && isVersionBefore(catchUp.since, version)
  // Primera versión que ya conocía: arriba de ella va la línea "Hasta aquí ya lo habías visto".
  const firstSeenIndex = isCatchUp && catchUp.since ? changelog.findIndex((e) => !isNew(e.version)) : -1
  const [open, setOpen] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    if (changelog[0]) initial.add(changelog[0].version)
    for (const e of changelog) if (isNew(e.version)) initial.add(e.version)
    return initial
  })

  function toggle(version: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(version)) next.delete(version)
      else next.add(version)
      return next
    })
  }

  useEffect(() => {
    markChangelogSeen()
  }, [])

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <PageHeader title="Novedades" subtitle="Lo que ha cambiado en Teleo, versión por versión." />

      <div className="flex flex-col gap-4">
        {changelog.map((entry, i) => {
          const isOpen = open.has(entry.version)
          const panelId = `novedades-${entry.version.replace(/\./g, '-')}`
          return (
          <Fragment key={entry.version}>
          {i === firstSeenIndex && i > 0 && (
            <p className="flex items-center gap-3 text-body-sm text-text-muted before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
              Hasta aquí ya lo habías visto
            </p>
          )}
          <Card tab={{ label: `V.${entry.version}` }}>
            {isNew(entry.version) && (
              <span className="inline-block mb-2 px-2 py-0.5 rounded-chip bg-magenta-soft text-magenta-text text-[12px] font-bold">Nueva</span>
            )}
            <h3>
              <button
                type="button"
                onClick={() => toggle(entry.version)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="w-full flex items-start justify-between gap-3 text-left font-display font-semibold text-display-md text-text rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
              >
                <span>{entry.title}</span>
                <ChevronDown
                  size={22}
                  aria-hidden="true"
                  className={`shrink-0 mt-0.5 text-text-secondary transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </h3>
            {isOpen && (
              <ul id={panelId} className="mt-3 space-y-2.5 animate-fade-in">
                <li className="flex gap-2.5 text-body-md text-text-muted">
                  <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                  <span>{entry.date}</span>
                </li>
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-body-md text-text-secondary">
                    <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          </Fragment>
          )
        })}
      </div>

      <SubpageNav tab="perfil" parentPath="/configuracion" />
    </div>
  )
}
