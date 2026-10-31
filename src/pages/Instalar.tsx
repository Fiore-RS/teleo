import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Download } from 'lucide-react'
import { Button } from '../assets/components/atoms/Button'
import { FormHint } from '../assets/components/molecules/FormLayout'
import { AuthCard, AuthLayout } from '../assets/components/molecules/AuthLayout'
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
 *  - PC sin aviso: se sugiere abrir el enlace desde el celular.
 *
 *  V.3.3.0: mismo diseño que las demás pantallas de cuenta (AuthLayout), con los pasos en una
 *  tarjeta con pestaña y el botón abajo. */
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

  const browserLink = !isStandalone && (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="mx-auto py-1 text-body-md text-primary-text font-bold rounded-full focus-visible:outline-2 focus-visible:outline-primary-text"
    >
      Prefiero usarla en el navegador
    </button>
  )

  let title: string
  let subtitle: string
  let body: ReactNode = null
  let action: ReactNode = null
  let centered = false

  if (isStandalone) {
    centered = true
    title = 'Ya tienes Teleo'
    subtitle = 'Estás usando la app instalada en tu teléfono.'
    action = <Button onClick={() => navigate('/')}>Ir a Teleo</Button>
  } else if (justInstalled) {
    centered = true
    title = '¡Listo, ya tienes Teleo!'
    subtitle = 'Búscala en tu pantalla de inicio, junto a tus otras apps, y ábrela desde ahí.'
    body = <FormHint text="La primera vez que la abras vas a poder crear tu cuenta o iniciar sesión." />
  } else if (inAppName) {
    title = 'Abre este enlace en tu navegador'
    subtitle = `El navegador de ${inAppName} no permite instalar apps. Ábrelo en ${platform === 'ios' ? 'Safari' : 'tu navegador (Chrome, Opera, Samsung Internet…)'} y vuelve a esta misma página.`
    body = (
      <Steps
        steps={[
          {
            title: 'Toca el menú de tres puntos',
            detail: 'Suele estar arriba a la derecha o abajo de la pantalla.',
          },
          {
            title: platform === 'ios' ? 'Elige "Abrir en Safari"' : 'Elige "Abrir en el navegador"',
          },
        ]}
      />
    )
    action = <CopyLink />
  } else if (canPrompt) {
    centered = true
    title = 'Instala Teleo'
    subtitle = 'Tenla en tu pantalla de inicio y ábrela como cualquier app, sin tiendas ni descargas pesadas.'
    action = (
      <Button onClick={handleInstall} isLoading={isPrompting}>
        <Download size={18} strokeWidth={2.2} />
        Instalar Teleo
      </Button>
    )
  } else if (platform === 'ios') {
    title = 'Instala Teleo'
    subtitle = 'En iPhone se agrega a tu pantalla de inicio en tres pasos, desde este mismo navegador.'
    body = (
      <>
        <Steps
          steps={[
            {
              title: 'Toca Compartir',
              detail: 'Es el cuadrado con la flecha hacia arriba. Si no lo ves, toca primero los tres puntos (···).',
            },
            {
              title: 'Elige "Agregar a pantalla de inicio"',
              detail: 'Puede que tengas que deslizar hacia abajo para encontrarlo.',
            },
            {
              title: 'Toca "Agregar"',
              detail: 'Teleo aparecerá junto a tus otras apps.',
            },
          ]}
        />
        <FormHint text="Si no aparece la opción, abre este enlace en Safari y vuelve a intentarlo." />
      </>
    )
  } else if (platform === 'android') {
    title = 'Instala Teleo'
    subtitle = 'Tenla en tu pantalla de inicio y ábrela como cualquier app, sin tiendas ni descargas pesadas.'
    body = (
      <>
        <Steps
          steps={[
            {
              title: 'Toca el menú de tu navegador',
              detail: 'Los tres puntos o el ícono de menú, arriba o abajo según el navegador.',
            },
            {
              title: 'Elige "Instalar app" o "Agregar a pantalla de inicio"',
            },
            {
              title: 'Confirma con "Instalar"',
              detail: 'Teleo aparecerá junto a tus otras apps.',
            },
          ]}
        />
        {wasDismissed && <FormHint text="No pasa nada, puedes instalarla cuando quieras con estos pasos." />}
      </>
    )
  } else {
    centered = true
    title = 'Teleo vive en tu celular'
    subtitle = wasDismissed
      ? 'Puedes instalarla cuando quieras desde el ícono de instalar en la barra de direcciones, o abrir este enlace desde tu teléfono.'
      : 'Está pensada para el teléfono. Abre este enlace desde tu celular para instalarla.'
    action = <CopyLink />
  }

  return (
    <AuthLayout
      centered={centered}
      title={title}
      subtitle={subtitle}
      footer={
        action || browserLink ? (
          <>
            {action}
            {browserLink}
          </>
        ) : undefined
      }
    >
      {body}
    </AuthLayout>
  )
}

interface Step {
  title: string
  detail?: string
}

function Steps({ steps }: { steps: Step[] }) {
  return (
    <AuthCard label="Cómo instalarla">
      <ol className="divide-y divide-border">
        {steps.map(({ title, detail }, index) => (
          <li key={title} className="flex gap-3 items-start px-3.5 py-3">
            {/* V.3.5.0: el número del paso en Young Serif reemplaza al ícono. */}
            <span aria-hidden="true" className="w-6 shrink-0 font-title text-[24px] leading-none text-primary-text text-center pt-0.5">
              {index + 1}
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
    </AuthCard>
  )
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
    <div>
      <Button variant="soft" onClick={handleCopy}>
        {status === 'copied' ? <Check size={18} strokeWidth={2.2} /> : <Copy size={18} strokeWidth={2} />}
        {status === 'copied' ? 'Enlace copiado' : 'Copiar enlace'}
      </Button>
      {status === 'failed' && (
        <>
          <FormHint text="No se pudo copiar. Mantén presionado el enlace para copiarlo:" />
          <p className="mt-1 text-body-sm text-text break-all select-all bg-surface-2 border border-border rounded-xl px-3 py-2">
            {url}
          </p>
        </>
      )}
    </div>
  )
}
