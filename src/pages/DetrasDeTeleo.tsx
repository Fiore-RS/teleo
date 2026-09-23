import { useNavigate } from 'react-router-dom'
import { AtSign } from 'lucide-react'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../lib/legal'

const paragraphs = [
  'Siempre me costó encontrar una app de lectura que tuviera exactamente lo que yo quería. A algunas les faltaba algo, y otras tenían tantas opciones que terminaban abrumándome. Así que decidí hacer la mía, a mi manera.',
  'Teleo empezó siendo algo muy sencillo: un registro de libros sin nombre ni identidad, hecho solo para mí. Pero mis amistades creyeron en la idea desde el principio, y ese apoyo me animó a convertirla en una app más completa para compartirla con las personas lectoras que quiero.',
  'Teleo no tiene fines de lucro. Solo quería crear algo bonito y útil para mí, y terminó siendo algo que puedo compartir con los demás. Sé que hay apps más grandes allá afuera, pero me encanta tener algo que sé que es 100% mío. Teleo es mi orgullo, y me alegra mucho que ahora también sea un poquito tuyo.',
]

/** "Detrás de Teleo" (Configuración): la historia de la app contada por Fiorella. */
export function DetrasDeTeleo() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Detrás de Teleo" onBack={() => navigate(-1)} />

      <article className="bg-surface border border-border rounded-card shadow-card p-[22px] animate-fade-in">
        <img
          src={`${import.meta.env.BASE_URL}pwa-icons/pwa-192x192.png`}
          alt=""
          className="w-16 h-16 rounded-2xl shadow-card mb-5"
        />
        <p className="font-display font-semibold text-display-md text-text leading-snug">
          Hola, soy Fiorella. También me conocen como Fiito.
        </p>
        {paragraphs.map((p) => (
          <p key={p} className="text-body-md text-text-secondary leading-relaxed mt-3.5 text-pretty">{p}</p>
        ))}

        <div className="flex items-center gap-2.5 text-ornament my-5" aria-hidden="true">
          <span className="flex-1 h-px bg-border" />
          <Sparkle size={10} />
          <span className="flex-1 h-px bg-border" />
        </div>

        <p className="font-display italic text-body-lg text-text text-center">Gracias por leer conmigo.</p>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-body-lg font-body font-bold bg-primary-soft text-primary-text active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
        >
          <AtSign size={18} />
          {INSTAGRAM_HANDLE} en Instagram
        </a>
      </article>
    </div>
  )
}
