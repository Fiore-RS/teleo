import { useEffect, useState } from 'react'
import { useGoBack } from '../hooks/useGoBack'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Lock, Info, Share2, Link as LinkIcon,
  Upload, Download, Pause, Trash2, Eraser as ClearIcon, LogOut, Palette, Coins,
  Heart, Megaphone, Paintbrush, Languages, AtSign, ShieldCheck, FileText,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useDataExport } from '../hooks/useDataExport'
import { useDataImport } from '../hooks/useDataImport'
import { useDangerZone } from '../hooks/useDangerZone'
import { ShareProfileModal } from '../assets/components/molecules/ShareProfileModal'
import { ShareWishlistModal } from '../assets/components/molecules/ShareWishlistModal'
import { Button } from '../assets/components/atoms/Button'
import { Modal } from '../assets/components/atoms/Modal'
import { ActionConfirmModal } from '../assets/components/molecules/ActionConfirmModal'
import { ThemeToggle } from '../assets/components/atoms/ThemeToggle'
import { Select } from '../assets/components/atoms/Select'
import { currencyOptions } from '../lib/currencies'
import { SettingsGroup, SettingsRow, SettingsField } from '../assets/components/molecules/SettingsList'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { supabase } from '../lib/supabase'
import { LATEST_VERSION, hasUnseenChangelog } from '../lib/changelog'

const SCROLL_KEY = 'teleo-config-scroll'

export function Configuracion() {
  const navigate = useNavigate()
  const goBack = useGoBack('/perfil')
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile(user?.id)
  const { exportData } = useDataExport(user?.id)
  const { importData } = useDataImport(user?.id)
  const { clearAllData, deactivateAccount, deleteAccount, isProcessing } = useDangerZone(user?.id)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isShareWishlistModalOpen, setIsShareWishlistModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<
    'cerrarSesion' | 'exportar' | 'importar' | 'vaciar' | 'desactivar' | 'eliminar' | null
  >(null)
  const [dialogState, setDialogState] = useState<'confirm' | 'success' | 'error'>('confirm')
  const [deleteChecked, setDeleteChecked] = useState(false)
  // Se lee al entrar; al volver desde Novedades la pantalla se monta de nuevo y ya no aparece.
  const [hasNews] = useState(hasUnseenChangelog)


  // Al volver de una opción (Novedades, Correo, Tutorial...) se regresa a la misma altura de
  // la lista en vez de al inicio. La posición se guarda solo al abrir una opción, así que al
  // entrar desde Perfil la pantalla arranca arriba como siempre.
  function openSubpage(path: string) {
    try {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
    } catch {
      // Sin almacenamiento: simplemente vuelve arriba.
    }
    navigate(path)
  }

  useEffect(() => {
    let saved: string | null
    try {
      saved = sessionStorage.getItem(SCROLL_KEY)
      sessionStorage.removeItem(SCROLL_KEY)
    } catch {
      return
    }
    if (saved === null) return
    const y = Number(saved)
    // Después del cambio de pantalla, que lleva la página arriba (App.tsx).
    const frame = requestAnimationFrame(() => window.scrollTo(0, y))
    return () => cancelAnimationFrame(frame)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/inicio')
  }

  async function handleConfirmAction() {
    if (confirmAction === 'exportar') {
      const ok = await exportData()
      setDialogState(ok ? 'success' : 'error')
    } else if (confirmAction === 'vaciar') {
      const ok = await clearAllData()
      setDialogState(ok ? 'success' : 'error')
    } else if (confirmAction === 'desactivar') {
      const ok = await deactivateAccount()
      if (ok) navigate('/inicio')
    } else if (confirmAction === 'eliminar') {
      const ok = await deleteAccount()
      if (ok) navigate('/inicio')
    }
  }

  function handleImportClick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const ok = await importData(file)
      setConfirmAction('importar')
      setDialogState(ok ? 'success' : 'error')
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader
        title="Configuración"
        subtitle="Ajusta tus preferencias, privacidad y gestiona tu cuenta a tu gusto."
        onBack={goBack}
        backLabel="Regresar a Tu rincón"
      />

      <div className="flex flex-col gap-7 stagger-children">
        <SettingsGroup title="Teleo">
          <SettingsRow icon={Heart} label="Detrás de Teleo" description="Quién hace Teleo y por qué" onClick={() => openSubpage('/configuracion/detras-de-teleo')} />
          <SettingsRow icon={Megaphone} label="Novedades" description={`Versión ${LATEST_VERSION} y anteriores`} dot={hasNews} onClick={() => openSubpage('/configuracion/novedades')} />
        </SettingsGroup>

        <SettingsGroup title="Apariencia">
          <SettingsField icon={Palette} label="Modo de color" description="Mañana con café o noche con lámpara">
            <ThemeToggle />
          </SettingsField>
          <SettingsField icon={Paintbrush} label="Tema" description="Pronto podrás elegir otros colores para Teleo">
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded-full bg-primary text-primary-ink text-body-md font-bold">Atardecer</span>
              <span className="px-3 py-1.5 rounded-full bg-surface-2 border border-border text-body-sm text-text-muted">Próximamente</span>
            </div>
          </SettingsField>
        </SettingsGroup>

        <SettingsGroup title="Sistema">
          <SettingsField icon={Languages} label="Idioma" description="Por ahora Teleo está solo en español">
            <Select options={[{ value: 'es', label: 'Español' }]} value="es" disabled />
          </SettingsField>
          <SettingsField icon={Coins} label="Moneda" description="Se usa para mostrar el valor de tu biblioteca en Bitácora">
            <Select
              options={currencyOptions}
              value={profile?.currency ?? undefined}
              onChange={(e) => updateProfile({ currency: e.target.value })}
              placeholder="Elige la moneda de tu cuenta"
            />
          </SettingsField>
        </SettingsGroup>

        <SettingsGroup title="Cuenta">
          <SettingsRow icon={AtSign} label="Nombre de usuario" description={profile?.username ? `@${profile.username}` : 'Tu @usuario en Teleo'} onClick={() => openSubpage('/configuracion/usuario')} />
          <SettingsRow icon={User} label="Nickname" description={profile?.nickname || 'Cómo te saluda Teleo'} onClick={() => openSubpage('/configuracion/nickname')} />
          <SettingsRow icon={Mail} label="Correo" description={user?.email ?? 'El correo con el que inicias sesión'} onClick={() => openSubpage('/configuracion/correo')} />
          <SettingsRow icon={Lock} label="Contraseña" description="Actualiza tu clave de acceso" onClick={() => openSubpage('/configuracion/contrasena')} />
        </SettingsGroup>

        <SettingsGroup title="Compartir">
          <SettingsRow icon={Share2} label="Compartir perfil" description="Una tarjeta de tu rincón en imagen" onClick={() => setIsShareModalOpen(true)} />
          <SettingsRow icon={LinkIcon} label="Compartir lista de deseados" description="Un PDF con los libros que quieres" onClick={() => setIsShareWishlistModalOpen(true)} />
        </SettingsGroup>

        <SettingsGroup title="Información">
          <SettingsRow icon={Info} label="Tutorial de Teleo" description="Un recorrido por cada sección" onClick={() => openSubpage('/tutorial')} />
          <SettingsRow icon={ShieldCheck} label="Política de privacidad" description="Qué datos guarda Teleo y para qué" onClick={() => openSubpage('/privacidad')} />
          <SettingsRow icon={FileText} label="Términos de uso" description="Las reglas para usar Teleo" onClick={() => openSubpage('/terminos')} />
        </SettingsGroup>

        <SettingsGroup title="Tus datos">
          <SettingsRow icon={Upload} label="Exportar datos" description="Descarga una copia de tu librería" onClick={() => { setConfirmAction('exportar'); setDialogState('confirm') }} />
          <SettingsRow icon={Download} label="Importar datos" description="Trae datos desde un archivo de respaldo" onClick={handleImportClick} />
        </SettingsGroup>

        <SettingsGroup title="Zona de peligro">
          <SettingsRow danger icon={ClearIcon} label="Vaciar datos" description="Borra libros, sagas y reseñas" onClick={() => { setConfirmAction('vaciar'); setDialogState('confirm') }} />
          <SettingsRow danger icon={Pause} label="Desactivar cuenta" description="Pausa tu cuenta sin perder nada" onClick={() => { setConfirmAction('desactivar'); setDialogState('confirm') }} />
          <SettingsRow danger icon={Trash2} label="Eliminar cuenta" description="Borra tu cuenta para siempre" onClick={() => { setConfirmAction('eliminar'); setDialogState('confirm'); setDeleteChecked(false) }} />
        </SettingsGroup>

        <Button variant="outline" onClick={() => setConfirmAction('cerrarSesion')}>
          <LogOut size={18} />
          Cerrar sesión
        </Button>
      </div>

      {isShareModalOpen && (
        <ShareProfileModal
          onClose={() => setIsShareModalOpen(false)}
          userId={user?.id}
        />
      )}

      {isShareWishlistModalOpen && (
        <ShareWishlistModal onClose={() => setIsShareWishlistModalOpen(false)} userId={user?.id} />
      )}

      <Modal isOpen={confirmAction === 'cerrarSesion'} onClose={() => setConfirmAction(null)}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-soft text-primary-text flex items-center justify-center mb-4">
            <LogOut size={26} />
          </div>
          <h3 className="font-display font-semibold text-display-md text-text">¿Cerrar sesión?</h3>
          <p className="text-body-md text-text-secondary mt-2">
            Tendrás que iniciar sesión de nuevo para volver a tu rincón de lectura.
          </p>
          <Button variant="primary" className="mt-5" onClick={handleSignOut}>Cerrar sesión</Button>
          <Button variant="outline" className="mt-2.5" onClick={() => setConfirmAction(null)}>Cancelar</Button>
        </div>
      </Modal>

      {confirmAction === 'exportar' && (
        <ActionConfirmModal
          isOpen
          status={dialogState}
          icon={Upload}
          iconVariant="reading"
          confirmTitle="¿Exportar datos?"
          confirmDescription="Exportarás todos los datos de tu librería virtual: libros, reseñas, estadísticas..."
          confirmLabel="Exportar"
          confirmVariant="primary"
          successTitle="¡Exportado con éxito!"
          successDescription="Tu archivo se descargó correctamente."
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'importar' && (
        <ActionConfirmModal
          isOpen
          status={dialogState}
          icon={Download}
          iconVariant="pending"
          confirmTitle="¿Importar datos?"
          confirmDescription="Importarás datos a tu librería virtual."
          confirmLabel="Importar"
          confirmVariant="primary"
          successTitle="¡Importado con éxito!"
          successDescription="Tus datos se agregaron correctamente a tu librería."
          onConfirm={() => setConfirmAction(null)}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'vaciar' && (
        <ActionConfirmModal
          isOpen
          status={dialogState}
          icon={ClearIcon}
          iconVariant="reading"
          confirmTitle="Limpieza de estantes"
          confirmDescription="Estás a punto de vaciar tu diario de lectura. Todas tus reseñas, notas marginales y estadísticas acumuladas desaparecerán como tinta bajo la lluvia. Esta acción es permanente e irreversible."
          confirmLabel="Vaciar mi librería"
          confirmVariant="primary"
          successTitle="¡Librería vaciada!"
          successDescription="Todos tus libros y sagas fueron eliminados correctamente."
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}

      <Modal isOpen={confirmAction === 'desactivar'} onClose={() => setConfirmAction(null)}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-pink-soft text-pink-text flex items-center justify-center mb-4">
            <Pause size={26} />
          </div>
          <h3 className="font-display font-semibold text-display-md text-text">Pausa en tu lectura</h3>
          <p className="text-body-md text-text-secondary mt-2">
            ¿Sientes que es momento de un respiro? Al desactivar tu cuenta, tu perfil y lecturas descansarán con nosotros.
            Guardaremos tu progreso como un marcapáginas eterno, esperando el momento en que decidas abrir de nuevo tus historias favoritas. ¡Te extrañaremos!
          </p>
          <Button variant="primary" className="mt-5" onClick={handleConfirmAction} isLoading={isProcessing}>Desactivar temporalmente</Button>
          <Button variant="outline" className="mt-2.5" onClick={() => setConfirmAction(null)}>Seguir leyendo</Button>
        </div>
      </Modal>

      <Modal isOpen={confirmAction === 'eliminar'} onClose={() => setConfirmAction(null)}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-soft text-primary-text flex items-center justify-center mb-4">
            <Trash2 size={26} />
          </div>
          <h3 className="font-display font-semibold text-display-md text-text">Cerrar el libro para siempre</h3>
          <p className="text-body-md text-text-secondary mt-2">
            Estás a punto de borrar definitivamente toda tu biblioteca, reseñas y notas.
          </p>
          <p className="font-body font-semibold text-body-md text-text mt-2">Esta acción es permanente e irreversible.</p>
          <label className="flex items-start gap-2.5 mt-4 text-body-sm text-text-secondary text-left bg-surface-2 border border-border rounded-2xl px-3.5 py-3">
            <input
              type="checkbox"
              checked={deleteChecked}
              onChange={(e) => setDeleteChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
            />
            Entiendo que perderé toda mi librería de manera irreversible.
          </label>
          <Button variant="primary" className="mt-5" onClick={handleConfirmAction} isLoading={isProcessing} disabled={!deleteChecked}>
            Eliminar mi cuenta
          </Button>
          <Button variant="outline" className="mt-2.5" onClick={() => setConfirmAction(null)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  )
}