import { Fragment, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { EncabezadoAncho } from '../assets/components/molecules/EncabezadoAncho'
import { IndicePagina } from '../assets/components/molecules/IndicePagina'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { Card } from '../assets/components/molecules/Card'
import { SubpageNav } from '../assets/components/molecules/SubpageNav'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import { lastSeenChangelog, markChangelogSeen, versiones } from '../lib/changelog'
import { isVersionBefore } from '../lib/announcement'

/** Novedades (Configuración): lo que trae cada versión de Teleo, de la más nueva a la más
 *  vieja. Al abrirla se marca la última versión como vista y se apaga el puntito.
 *
 *  Noviembre de 2026: agrupada por versión grande ("Versión 1" a "Versión 4"). Cada tarjeta
 *  muestra el título de la versión, los meses que abarca, una línea de resumen y lo destacado;
 *  "Ver todos los cambios" despliega el desglose por partes, de la más vieja a la más nueva,
 *  cada una con su título y su fecha. Los números internos (4.5.1…) no se ven.
 *
 *  Qué se marca como nuevo:
 *  - Si se llega desde el aviso de novedades acumuladas de La mesa (V.2.1.2), lo que la persona
 *    no había visto desde que entró, y una línea separa lo que ya conocía.
 *  - Si no, lo que salió desde la última vez que abrió Novedades en este dispositivo.
 *  Una versión entera sin ver lleva "Nueva" en su tarjeta; si solo son algunas partes (un
 *  parche nuevo dentro de una versión ya vista), esas partes llevan "Nuevo" y el desglose se
 *  abre de entrada.
 *
 *  En la computadora, a la derecha, la lista de versiones fija (V.4.3.0): al tocar una, se
 *  despliega y la pantalla baja hasta ella. */
const versionId = (major: number) => `version-${major}`
const INDICE = versiones.map((v) => ({ id: versionId(v.major), label: `Versión ${v.major}`, detail: v.title }))

const badgeClass = 'inline-block px-2 py-0.5 rounded-chip bg-magenta-soft text-magenta-text text-[12px] font-bold'

export function Novedades() {
  const breakpoint = useBreakpoint()
  const location = useLocation()
  const catchUp = (location.state as { since?: string | null } | null) ?? null
  const isCatchUp = catchUp !== null && 'since' in catchUp
  // Desde qué versión se marca lo nuevo. Se lee una sola vez, antes de marcar Novedades como
  // vista. `undefined`: nunca abrió Novedades en este dispositivo, así que no se marca nada.
  const [since] = useState<string | null | undefined>(() =>
    isCatchUp ? (catchUp.since ?? null) : (lastSeenChangelog() ?? undefined),
  )
  const isNew = (version: string) => since !== undefined && isVersionBefore(since, version)
  const newCount = (major: number) => versiones.find((v) => v.major === major)?.entries.filter((e) => isNew(e.version)).length ?? 0

  // Primera versión que ya conocía entera: arriba de ella va "Hasta aquí ya lo habías visto".
  const firstSeenIndex = isCatchUp ? versiones.findIndex((v) => newCount(v.major) === 0) : -1

  const [open, setOpen] = useState<Set<number>>(() => {
    const initial = new Set<number>()
    for (const v of versiones) {
      const n = newCount(v.major)
      if (n > 0 && n < v.entries.length) initial.add(v.major)
    }
    return initial
  })

  function toggle(major: number) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(major)) next.delete(major)
      else next.add(major)
      return next
    })
  }

  useEffect(() => {
    markChangelogSeen()
  }, [])

  function openFromIndex(id: string) {
    const v = versiones.find((x) => versionId(x.major) === id)
    if (!v) return
    setOpen((prev) => (prev.has(v.major) ? prev : new Set(prev).add(v.major)))
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pagina-lectura">
      {breakpoint === 'celular' ? (
        <PageHeader title="Novedades" subtitle="Lo que ha cambiado en Teleo, versión por versión." />
      ) : (
        <EncabezadoAncho title="Novedades" subtitle="Lo que ha cambiado en Teleo, versión por versión." />
      )}

      <div className="escritorio:grid escritorio:grid-cols-[720px_minmax(0,1fr)] escritorio:gap-14 escritorio:items-start">
      <div className="flex flex-col gap-4 tableta:max-w-180">
        {versiones.map((v, i) => {
          const isOpen = open.has(v.major)
          const panelId = `novedades-${v.major}`
          const n = newCount(v.major)
          const allNew = n > 0 && n === v.entries.length
          return (
          <Fragment key={v.major}>
          {i === firstSeenIndex && i > 0 && (
            <p className="flex items-center gap-3 text-body-sm text-text-muted before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
              Hasta aquí ya lo habías visto
            </p>
          )}
          <div id={versionId(v.major)} className="scroll-mt-24">
          <Card tab={{ label: `Versión ${v.major}` }}>
            {allNew && <span className={`${badgeClass} mb-2`}>Nueva</span>}
            <h3 className="font-display font-semibold text-display-md text-text">{v.title}</h3>
            <p className="mt-0.5 text-body-sm text-text-muted">{v.period}</p>
            <p className="mt-2.5 text-body-md text-text-secondary text-pretty">{v.summary}</p>
            <ul className="pt-3 space-y-2.5">
              {v.highlights.map((item) => (
                <li key={item} className="flex gap-2.5 text-body-md text-text">
                  <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => toggle(v.major)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="mt-4 inline-flex items-center gap-1.5 font-body font-bold text-body-md text-primary-text rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
            >
              {isOpen ? 'Ocultar los cambios' : 'Ver todos los cambios'}
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`shrink-0 transition-transform duration-[450ms] ease-(--ease-enter) motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {/* Se despliega con una transición de alto (grid de 0fr a 1fr) y un fundido de 450 ms
                (V.3.6.0), en vez de aparecer de golpe. Cerrado, el desglose sigue en la página pero
                queda inerte. */}
            <div
              id={panelId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-[450ms] ease-(--ease-enter) motion-reduce:transition-none ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                {v.entries.map((entry) => (
                  <section key={entry.version} className="mt-4 pt-4 border-t border-dashed border-border">
                    <h4 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display font-semibold text-body-lg text-text">
                      <span>{entry.title}</span>
                      {!allNew && isNew(entry.version) && <span className={badgeClass}>Nuevo</span>}
                    </h4>
                    <p className="mt-0.5 text-body-sm text-text-muted">{entry.date}</p>
                    <ul className="pt-2.5 space-y-2.5">
                      {entry.items.map((item) => (
                        <li key={item} className="flex gap-2.5 text-body-md text-text-secondary">
                          <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                          <span className="text-pretty">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </Card>
          </div>
          </Fragment>
          )
        })}
      </div>
      {breakpoint === 'escritorio' && (
        <aside className="sticky top-20">
          <IndicePagina titulo="Versiones" secciones={INDICE} onSelect={openFromIndex} larga />
        </aside>
      )}
      </div>

      <SubpageNav tab="perfil" parentPath="/configuracion" />
    </div>
  )
}
