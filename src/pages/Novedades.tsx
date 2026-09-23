import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import { changelog, markChangelogSeen } from '../lib/changelog'

/** Novedades (Configuración): lo que trae cada versión de Teleo, de la más nueva a la más
 *  vieja. Al abrirla se marca la última versión como vista y se apaga el puntito. */
export function Novedades() {
  const navigate = useNavigate()

  useEffect(() => {
    markChangelogSeen()
  }, [])

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Novedades" subtitle="Lo que ha cambiado en Teleo, versión por versión." onBack={() => navigate(-1)} />

      <div className="flex flex-col gap-4 stagger-children">
        {changelog.map((entry, i) => (
          <section key={entry.version} className="bg-surface border border-border rounded-card shadow-card p-[18px]">
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-body-sm font-bold tabular-nums ${
                  i === 0 ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-text-secondary border border-border'
                }`}
              >
                V.{entry.version}
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
        ))}
      </div>
    </div>
  )
}
