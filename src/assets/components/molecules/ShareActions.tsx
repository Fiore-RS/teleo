import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { Button } from '../atoms/Button'
import { FormHint, type FormHintTone } from './FormLayout'

interface ShareActionsProps {
  /** "Compartir imagen" o "Compartir PDF". */
  shareLabel: string
  onShare: () => Promise<void>
  onDownload: () => Promise<void>
  disabled?: boolean
  /** Aviso debajo de los botones ("Imagen descargada", un error). */
  notice?: { text: string; tone: FormHintTone } | null
}

/** Pie de las hojas de compartir (V.3.3.0, mismo patrón que la invitación): la acción más común
 *  como botón relleno, "Descargar" con borde y el aviso debajo, en el estilo de Configuración.
 *  Solo gira el botón que se tocó. */
export function ShareActions({ shareLabel, onShare, onDownload, disabled = false, notice }: ShareActionsProps) {
  const [busy, setBusy] = useState<'share' | 'download' | null>(null)

  async function run(kind: 'share' | 'download', action: () => Promise<void>) {
    setBusy(kind)
    try {
      await action()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-2 pb-1">
      <Button variant="primary" onClick={() => run('share', onShare)} isLoading={busy === 'share'} disabled={disabled || busy !== null}>
        {busy !== 'share' && <Share2 size={18} />}
        {shareLabel}
      </Button>
      <Button variant="outline" onClick={() => run('download', onDownload)} isLoading={busy === 'download'} disabled={disabled || busy !== null}>
        {busy !== 'download' && <Download size={18} />}
        Descargar
      </Button>
      {notice && <FormHint text={notice.text} tone={notice.tone} />}
    </div>
  )
}
