import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import { LEGAL_LAST_UPDATED, privacySections, termsSections, type LegalSection } from '../lib/legal'

interface LegalPageProps {
  title: string
  sections: LegalSection[]
}

/** Pantalla de texto largo para Política de privacidad y Términos de uso: una tarjeta por
 *  apartado, con la fecha de la última actualización arriba. */
function LegalPage({ title, sections }: LegalPageProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title={title} subtitle={`Última actualización: ${LEGAL_LAST_UPDATED}.`} onBack={() => navigate(-1)} />

      <div className="flex flex-col gap-4 stagger-children">
        {sections.map((section) => (
          <section key={section.title} className="bg-surface border border-border rounded-card shadow-card p-[18px]">
            <h2 className="font-display font-semibold text-body-lg text-text">{section.title}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="text-body-md text-text-secondary leading-relaxed mt-2 text-pretty">{p}</p>
            ))}
            {section.bullets && (
              <ul className="mt-2.5 space-y-2.5">
                {section.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5 text-body-md text-text-secondary leading-relaxed">
                    <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                    <span className="text-pretty">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

export function Privacidad() {
  return <LegalPage title="Política de privacidad" sections={privacySections} />
}

export function Terminos() {
  return <LegalPage title="Términos de uso" sections={termsSections} />
}
