import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Card } from '../assets/components/molecules/Card'
import { SubpageNav } from '../assets/components/molecules/SubpageNav'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import { LEGAL_LAST_UPDATED, privacySections, termsSections, type LegalSection } from '../lib/legal'

interface LegalPageProps {
  title: string
  sections: LegalSection[]
}

/** Pantalla de texto largo para Política de privacidad y Términos de uso: una tarjeta por
 *  apartado, con la fecha de la última actualización arriba. Con sesión se abre desde
 *  Configuración (barra con Perfil marcado); sin sesión termina con "Listo". */
function LegalPage({ title, sections }: LegalPageProps) {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <PageHeader title={title} subtitle={`Última actualización: ${LEGAL_LAST_UPDATED}.`} />

      <div className="flex flex-col gap-4 stagger-children">
        {sections.map((section) => (
          <Card key={section.title}>
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
          </Card>
        ))}
      </div>

      {!isLoading && (
        <SubpageNav
          tab="perfil"
          parentPath="/configuracion"
          onDone={user ? undefined : () => (window.history.length > 1 ? navigate(-1) : navigate('/inicio'))}
        />
      )}
    </div>
  )
}

export function Privacidad() {
  return <LegalPage title="Política de privacidad" sections={privacySections} />
}

export function Terminos() {
  return <LegalPage title="Términos de uso" sections={termsSections} />
}
