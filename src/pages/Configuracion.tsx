import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Lock, Share2, Link as LinkIcon,
  Upload, Download, Pause, Trash2, ChevronRight, ChevronLeft, Trash2 as ClearIcon, LogOut,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useDataExport } from '../hooks/useDataExport'
import { useDataImport } from '../hooks/useDataImport'
import { useDangerZone } from '../hooks/useDangerZone'
import { ShareModal } from '../assets/components/molecules/ShareModal'
import { PrivacyToggleRow } from '../assets/components/molecules/PrivacyToggleRow'
import { Button } from '../assets/components/atoms/Button'
import { ActionConfirmModal } from '../assets/components/molecules/ActionConfirmModal'
import { ThemeToggle } from '../assets/components/atoms/ThemeToggle'
import { supabase } from '../lib/supabase'

const privacyFields = [
  { key: 'show_annual_goal', label: 'Mostrar meta anual' },
  { key: 'show_daily_streak', label: 'Mostrar racha diaria' },
  { key: 'show_stats', label: 'Mostrar estadísticas' },
  { key: 'show_years_in_books', label: 'Mostrar años en libros' },
  { key: 'show_currently_reading', label: 'Mostrar leyendo ahora' },
  { key: 'show_favorites', label: 'Mostrar favoritos' },
  { key: 'show_recommended', label: 'Mostrar recomendados' },
  { key: 'show_wishlist', label: 'Mostrar lista de deseados' },
] as const

function SectionHeading({ title, danger = false }: { title: string; danger?: boolean }) {
  return (
    <div className="mt-8 mb-3">
      <h2
        className={
          danger
            ? 'font-display italic text-display-md text-accent-wishlist'
            : 'font-body text-body-lg font-semibold text-accent-wishlist'
        }
      >
        {title}
      </h2>
      <div className="h-1.5 rounded-full bg-border mt-2" />
    </div>
  )
}

function ListItem({ icon: Icon, label, onClick }: { icon: typeof User; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3.5">
      <Icon size={18} className="text-text-secondary shrink-0" />
      <span className="text-body-md text-text flex-1 text-left">{label}</span>
      <ChevronRight size={18} className="text-text-secondary shrink-0" />
    </button>
  )
}

export function Configuracion() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile(user?.id)
  const { exportData } = useDataExport(user?.id)
  const { importData } = useDataImport(user?.id)
  const { clearAllData, deactivateAccount, deleteAccount, isProcessing } = useDangerZone(user?.id)

  const [shareTarget, setShareTarget] = useState<'perfil' | 'deseados' | null>(null)
  const [confirmAction, setConfirmAction] = useState<
    'cerrarSesion' | 'exportar' | 'importar' | 'vaciar' | 'desactivar' | 'eliminar' | null
  >(null)
  const [dialogState, setDialogState] = useState<'confirm' | 'success' | 'error'>('confirm')
  const [deleteChecked, setDeleteChecked] = useState(false)

  const profileUrl = `${window.location.origin}${import.meta.env.BASE_URL}@${profile?.username ?? ''}`
  const wishlistUrl = `${profileUrl}/deseados`

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

  return (
    <div className="min-h-screen bg-bg p-6 pb-10">
      <button onClick={() => navigate('/perfil')} className="flex items-center gap-1 text-body-md font-medium text-accent-wishlist mb-4 -ml-1">
        <ChevronLeft size={20} strokeWidth={2} />
        Regresar a Perfil
      </button>

      <h1 className="font-display italic text-display-lg text-accent-wishlist">Configuración</h1>
      <div className="h-1.5 rounded-full bg-border mt-3" />
      <p className="text-body-md text-text-secondary mt-3">Ajusta tus preferencias, privacidad y gestiona tu cuenta a tu gusto.</p>

      <SectionHeading title="Tema de la aplicación" />
      <ThemeToggle />

      <SectionHeading title="Ajustes de cuenta" />
      <div className="space-y-2">
        <ListItem icon={User} label="Cambiar nombre de usuario" onClick={() => navigate('/configuracion/usuario')} />
        <ListItem icon={Mail} label="Cambiar correo" onClick={() => navigate('/configuracion/correo')} />
        <ListItem icon={Lock} label="Cambiar contraseña" onClick={() => navigate('/configuracion/contrasena')} />
      </div>

      <SectionHeading title="Compartir" />
      <div className="space-y-2">
        <ListItem icon={Share2} label="Compartir perfil" onClick={() => setShareTarget('perfil')} />
        <ListItem icon={LinkIcon} label="Compartir lista de deseados" onClick={() => setShareTarget('deseados')} />
      </div>

      <SectionHeading title="Visibilidad del perfil" />
      <div className="space-y-2">
        {privacyFields.map(({ key, label }) => (
          <PrivacyToggleRow
            key={key}
            label={label}
            checked={Boolean(profile?.[key])}
            onChange={(checked) => updateProfile({ [key]: checked })}
          />
        ))}
      </div>

      <SectionHeading title="Zona de peligro" danger />
      <div className="space-y-2">
        <ListItem icon={LogOut} label="Cerrar sesión" onClick={() => setConfirmAction('cerrarSesion')} />
        <ListItem icon={Upload} label="Exportar datos" onClick={() => { setConfirmAction('exportar'); setDialogState('confirm') }} />
        <ListItem
          icon={Download}
          label="Importar datos"
          onClick={() => {
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
          }}
        />
        <ListItem icon={ClearIcon} label="Vaciar datos" onClick={() => { setConfirmAction('vaciar'); setDialogState('confirm') }} />
        <ListItem icon={Pause} label="Desactivar cuenta" onClick={() => { setConfirmAction('desactivar'); setDialogState('confirm') }} />
        <ListItem icon={Trash2} label="Eliminar cuenta" onClick={() => { setConfirmAction('eliminar'); setDialogState('confirm'); setDeleteChecked(false) }} />
      </div>

      {shareTarget && (
        <ShareModal
          isOpen
          onClose={() => setShareTarget(null)}
          title={shareTarget === 'perfil' ? `@${profile?.username}` : `Lista de deseados de @${profile?.username}`}
          url={shareTarget === 'perfil' ? profileUrl : wishlistUrl}
          avatarUrl={profile?.avatar_url ?? undefined}
          caption={profile?.bio ?? ''}
        />
      )}

      {confirmAction === 'cerrarSesion' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setConfirmAction(null)}>
          <div className="w-full max-w-sm bg-surface rounded-3xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-state-pending flex items-center justify-center mx-auto mb-4">
              <LogOut size={24} className="text-surface" />
            </div>
            <h3 className="font-display text-display-md text-text">¿Cerrar sesión?</h3>
            <p className="text-body-md text-text-secondary mt-2">
              Tendrás que iniciar sesión de nuevo para volver a tu rincón de lectura.
            </p>
            <Button variant="slate" className="mt-5" onClick={handleSignOut}>Cerrar Sesión</Button>
            <Button variant="outline" className="mt-3" onClick={() => setConfirmAction(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {confirmAction === 'exportar' && (
        <ActionConfirmModal
          isOpen
          status={dialogState}
          icon={Upload}
          iconVariant="reading"
          confirmTitle="¿Exportar datos?"
          confirmDescription="Exportarás todos los datos de tu librería virtual: libros, reseñas, estadísticas..."
          confirmLabel="Exportar"
          confirmVariant="amber"
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
          confirmVariant="slate"
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
          confirmLabel="Vaciar Mi Librería"
          confirmVariant="amber"
          successTitle="¡Librería vaciada!"
          successDescription="Todos tus libros y sagas fueron eliminados correctamente."
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'desactivar' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setConfirmAction(null)}>
          <div className="w-full max-w-sm bg-surface rounded-3xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-state-pending flex items-center justify-center mx-auto mb-4">
              <Pause size={24} className="text-surface" />
            </div>
            <h3 className="font-display text-display-md text-text">Pausa en tu lectura</h3>
            <p className="text-body-md text-text-secondary mt-2">
              ¿Sientes que es momento de un respiro? Al desactivar tu cuenta, tu perfil y lecturas descansarán con nosotros.
              Guardaremos tu progreso como un marcapáginas eterno, esperando el momento en que decidas abrir de nuevo tus historias favoritas. ¡Te extrañaremos!
            </p>
            <Button variant="slate" className="mt-5" onClick={handleConfirmAction} isLoading={isProcessing}>Desactivar Temporalmente</Button>
            <Button variant="outline" className="mt-3" onClick={() => setConfirmAction(null)}>Seguir Leyendo</Button>
          </div>
        </div>
      )}

      {confirmAction === 'eliminar' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setConfirmAction(null)}>
          <div className="w-full max-w-sm bg-surface rounded-3xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-accent-wishlist flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-surface" />
            </div>
            <h3 className="font-display text-display-md text-text">Cerrar el libro para siempre</h3>
            <p className="text-body-md text-text-secondary mt-2">
              Estás a punto de borrar definitivamente toda tu biblioteca, reseñas y notas.
            </p>
            <p className="font-body font-semibold text-body-md text-text mt-2">Esta acción es permanente e irreversible.</p>
            <label className="flex items-center gap-2 mt-4 text-body-sm text-text-secondary text-left">
              <input type="checkbox" checked={deleteChecked} onChange={(e) => setDeleteChecked(e.target.checked)} />
              Entiendo que perderé toda mi librería de manera irreversible.
            </label>
            <Button variant="primary" className="mt-5" onClick={handleConfirmAction} isLoading={isProcessing} disabled={!deleteChecked}>
              Eliminar Mi Cuenta
            </Button>
            <Button variant="outline" className="mt-3" onClick={() => setConfirmAction(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}