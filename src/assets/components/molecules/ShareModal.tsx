import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { SegmentedTabs } from '../atoms/SegmentedTabs'
import { Button } from '../atoms/Button'
import { Avatar } from '../atoms/Avatar'
import { useTheme } from '../../../hooks/useTheme'

// Mismos valores que --teleo-text en index.css, para que el QR
// siempre contraste con el fondo (bg-bg) del tema activo.
const QR_COLOR_LIGHT = '#2B211B'
const QR_COLOR_DARK = '#F3E9DA'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url: string
  avatarUrl?: string
  caption: string
}

export function ShareModal({ isOpen, onClose, title, url, avatarUrl, caption }: ShareModalProps) {
  const [mode, setMode] = useState<'qr' | 'link'>('qr')
  const { resolvedTheme } = useTheme()
  const qrColor = resolvedTheme === 'dark' ? QR_COLOR_DARK : QR_COLOR_LIGHT

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch { /* usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Avatar variant="user" size="lg" src={avatarUrl} className="mx-auto" />
      <div className="bg-bg rounded-2xl p-4 mt-4 text-center">
        <p className="font-display text-display-md text-text">{title}</p>
        <p className="text-body-sm text-text-secondary mt-1">{caption}</p>
      </div>

      <div className="mt-4">
        <SegmentedTabs
          active={mode}
          onChange={setMode}
          options={[{ value: 'qr', label: 'Código QR' }, { value: 'link', label: 'Enlace' }]}
        />
      </div>

      {mode === 'qr' ? (
        <div className="bg-bg rounded-2xl p-6 mt-4 flex flex-col items-center">
          <QRCodeSVG value={url} size={160} fgColor={qrColor} bgColor="transparent" />
          <p className="text-body-sm text-text-secondary mt-3 text-center">Escanea para ver mi perfil.</p>
        </div>
      ) : (
        <div className="bg-bg rounded-2xl p-4 mt-4">
          <p className="text-body-sm text-text-secondary mb-1">Nombre de usuario actual</p>
          <div className="flex items-center justify-between bg-surface rounded-xl p-3">
            <span className="text-body-md text-text truncate">{url}</span>
            <button onClick={() => navigator.clipboard.writeText(url)} aria-label="Copiar enlace" className="text-text-secondary shrink-0 ml-2">
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}

      <Button variant="primary" className="mt-5" onClick={handleShare}>Compartir</Button>
    </Modal>
  )
}