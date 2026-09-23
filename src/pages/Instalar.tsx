import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Download, EllipsisVertical, Share, SquarePlus, type LucideIcon } from 'lucide-react'
import { Logo } from '../assets/components/atoms/Logo'
import { Button } from '../assets/components/atoms/Button'
import { AuthHeader } from '../assets/components/molecules/AuthHeader'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { detectInAppBrowser, detectPlatform, isRunningStandalone } from '../lib/installPrompt'

/** Pantalla /instalar: el enlace que se le manda a alguien nuevo para que instale Teleo.
 *
 *  Ningún navegador deja abrir el aviso de instalar sin que la persona toque algo, así que
 *  todo gira alrededor de un botón. Qué se muestra depende de dónde se abrió el enlace:
 *  - Ya instalada (abierta como app): se avisa y se ofrece entrar.
 *  - Navegador interno de Instagram, Facebook, etc.: no deja instalar; se pide abrirlo en
 *    Chrome o Safari y se ofrece copiar el enlace.
 *  - Chrome/Edge/Opera/Samsung (Android o PC): botón que abre el aviso nativo Instalar/Cancelar.
 *  - iPhone/iPad: Apple no permite ese aviso, así que se muestran los 3 pasos a mano.
 *  - Android sin aviso disponible (Firefox, o si ya se canceló): pasos del menú ⋮.
 *  - PC sin aviso: se sugiere abrir el enlace desde el celular. */
export function Instalar() {
  const navigate = useNavigate()
  const { canPrompt, justInstalled, promptInstall } = useInstallPrompt()
  // Estos datos no cambian durante la visita, así que se calculan una sola vez.
  const [platform] = useState(detectPlatform)
  const [inAppName] = useState(detectInAppBrowser)
  const [isStandalone] = useState(isRunningStandalone)
  const [isPrompting, setIsPrompting] = useState(false)
  const [wasDismissed, setWasDismissed] = useState(false)

  async function handleInstall() {
    setIsPrompting(true)
    const outcome = await promptInstall()
    setIsPrompting(false)
    if (outcome !== 'accepted') setWasDismissed(true)
  }

  let content: ReactNode

  if (isStandalone) {
    content = (
      <>
        <AuthHeader title="Ya tienes Teleo" subtitle="Estás usando la app instalada en tu teléfono." />
        <Button onClick={() => navigate('/')}>Ir a Teleo</Button>
      </>
    )
  } else if (justInstalled) {
    content = (
      <>
        <AuthHeader
          title="¡Listo, ya tienes Teleo!"
          subtitle="Búscala en tu pantalla de inicio, junto a tus otras apps, y ábrela desde ahí."
        />
        <Hint>La primera vez que la abras vas a poder crear tu cuenta o iniciar sesión.</Hint>
      </>
    )
  } else if (inAppName) {
    content = (
      <>
        <AuthHeader
          title="Abre este enlace en tu navegador"
          subtitle={`El navegador de ${inAppName} no permite instalar apps. Ábrelo en ${platform === 'ios' ? 'Safari' : 'tu navegador (Chrome, Opera, Samsung Internet…)'} y vuelve a esta misma página.`}
        />
        <Steps
          steps={[
            {
              icon: EllipsisVertical,
              title: 'Toca el menú de tres puntos',
              detail: 'Suele estar arriba a la derecha o abajo de la pantalla.',
            },
            {
              icon: platform === 'ios' ? Share : Download,
              title: platform === 'ios' ? 'Elige "Abrir en Safari"' : 'Elige "Abrir en el navegador"',
            },
          ]}
        />
        <CopyLink />
      </>
    )
  } else if (canPrompt) {
    content = (
      <>
        <AuthHeader
          title="Instala Teleo"
          subtitle="Tenla en tu pantalla de inicio y ábrela como cualquier app, sin tiendas ni descargas pesadas."
        />
        <Button onClick={handleInstall} isLoading={isPrompting}>
          <Download size={18} strokeWidth={2.2} />
          Instalar Teleo
        </Button>
      </>
    )
  } else if (platform === 'ios') {
    content = (
      <>
        <AuthHeader
          title="Instala Teleo"
          subtitle="En iPhone se agrega a tu pantalla de inicio en tres pasos, desde este mismo navegador."
        />
        <Steps
          steps={[
            {
              icon: Share,
              title: 'Toca Compartir',
              detail: 'Es el cuadrado con la flecha hacia arriba. Si no lo ves, toca primero los tres puntos (···).',
            },
            {
              icon: SquarePlus,
              title: 'Elige "Agregar a pantalla de inicio"',
              detail: 'Puede que tengas que deslizar hacia abajo para encontrarlo.',
            },
            {
              icon: Check,
              title: 'Toca "Agregar"',
              detail: 'Teleo aparecerá junto a tus otras apps.',
            },
          ]}
        />
        <Hint>Si no aparece la opción, abre este enlace en Safari y vuelve a intentarlo.</Hint>
      </>
    )
  } else if (platform === 'android') {
    content = (
      <>
        <AuthHeader
          title="Instala Teleo"
          subtitle="Tenla en tu pantalla de inicio y ábrela como cualquier app, sin tiendas ni descargas pesadas."
        />
        {wasDismissed && <Hint className="mb-4 mt-0">No pasa nada, puedes instalarla cuando quieras con estos pasos.</Hint>}
        <Steps
          steps={[
            {
              icon: EllipsisVertical,
              title: 'Toca el menú de tu navegador',
              detail: 'Los tres puntos o el ícono de menú, arriba o abajo según el navegador.',
            },
            {
              icon: Download,
              title: 'Elige "Instalar app" o "Agregar a pantalla de inicio"',
            },
            {
              icon: Check,
              title: 'Confirma con "Instalar"',
              detail: 'Teleo aparecerá junto a tus otras apps.',
            },
          ]}
        />
      </>
    )
  } else {
    content = (
      <>
        <AuthHeader
          title="Teleo vive en tu celular"
          subtitle={
            wasDismissed
              ? 'Puedes instalarla cuando quieras desde el ícono de instalar en la barra de direcciones, o abrir este enlace desde tu teléfono.'
              : 'Está pensada para el teléfono. Abre este enlace desde tu celular para instalarla.'
          }
        />
        <CopyLink />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-glow-top flex flex-col">
      <div className="p-4">
        <Logo variant="full" className="h-8" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 pt-2">
        <div className="w-full max-w-sm">
          <div className="bg-surface border border-border rounded-[28px] shadow-card p-6">{content}</div>

          {!isStandalone && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="block mx-auto mt-5 text-body-md text-primary-text font-semibold underline underline-offset-4"
            >
              Prefiero usarla en el navegador
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface Step {
  icon: LucideIcon
  title: string
  detail?: string
}

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-2.5">
      {steps.map(({ icon: Icon, title, detail }, index) => (
        <li key={title} className="flex gap-3 items-start bg-surface-2 border border-border rounded-2xl p-3">
          <span
            aria-hidden="true"
            className="w-9 h-9 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center"
          >
            <Icon size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-body-md text-text font-semibold">
              <span className="sr-only">Paso {index + 1}: </span>
              {title}
            </p>
            {detail && <p className="text-body-sm text-text-secondary mt-0.5">{detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

function Hint({ children, className = 'mt-4' }: { children: ReactNode; className?: string }) {
  return <p className={`text-body-sm text-text-secondary text-center ${className}`}>{children}</p>
}

/** Botón para copiar el enlace de esta página. Algunos navegadores internos bloquean el
 *  portapapeles; en ese caso se muestra el enlace para copiarlo a mano. */
function CopyLink() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const url = window.location.href

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      window.setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="mt-5">
      <Button variant="soft" onClick={handleCopy}>
        {status === 'copied' ? <Check size={18} strokeWidth={2.2} /> : <Copy size={18} strokeWidth={2} />}
        {status === 'copied' ? 'Enlace copiado' : 'Copiar enlace'}
      </Button>
      {status === 'failed' && (
        <>
          <Hint>No se pudo copiar. Mantén presionado el enlace para copiarlo:</Hint>
          <p className="mt-2 text-body-sm text-text break-all text-center select-all bg-surface-2 border border-border rounded-xl px-3 py-2">
            {url}
          </p>
        </>
      )}
    </div>
  )
}
