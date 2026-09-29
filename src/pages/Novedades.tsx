import { Fragment, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import { changelog, markChangelogSeen } from '../lib/changelog'
import { isVersionBefore } from '../lib/announcement'

/** Novedades (Configuración): lo que trae cada versión de Teleo, de la más nueva a la más
 *  vieja. Al abrirla se marca la última versión como vista y se apaga el puntito.
 *  Si se llega desde el aviso de novedades acumuladas de La mesa (V.2.1.2), las versiones
 *  que la persona no había visto llevan "Nueva" y una línea separa lo que ya conocía. */
export function Novedades() {
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Novedades" subtitle="Lo que ha cambiado en Teleo, versión por versión." onBack={() => navigate(-1)} />

      <div className="flex flex-col gap-4 stagger-children">
        {changelog.map((entry, i) => (
          <Fragment key={entry.version}>
          {i === firstSeenIndex && i > 0 && (
            <p className="flex items-center gap-3 text-body-sm text-text-muted before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
              Hasta aquí ya lo habías visto
            </p>
          )}
          <section className="bg-surface border border-border rounded-card shadow-card p-[18px]">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-body-sm font-bold tabular-nums ${
                    i === 0 ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-text-secondary border border-border'
                  }`}
                >
                  V.{entry.version}
                </span>
                {isNew(entry.version) && (
                  <span className="px-2 py-0.5 rounded-full bg-magenta-soft text-magenta-text text-[12px] font-bold">Nueva</span>
                )}
              </span>
              <span className="text-body-sm text-text-muted">{entry.date}</span>
            </div>
            <h2 className="font-display font-semibold text-display-md text-text mt-3">{entry.title}</h2>
            <ul className="mt-3 space-y-2.5">
              {entry.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-body-md text-text-secondary">
                  <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </section>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
