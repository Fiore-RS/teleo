import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTour } from '../context/tourContextValue'
import { useProfile } from '../hooks/useProfile'
import { useDataExport } from '../hooks/useDataExport'
import { useDataImport } from '../hooks/useDataImport'
import { useDangerZone } from '../hooks/useDangerZone'
import { ShareProfileModal } from '../assets/components/molecules/ShareProfileModal'
import { ShareWishlistModal } from '../assets/components/molecules/ShareWishlistModal'
import { InviteSheet } from '../assets/components/molecules/InviteSheet'
import { FriendCodeSettingsRow } from '../assets/components/molecules/FriendCode'
import { GoodreadsImportModal } from '../assets/components/molecules/GoodreadsImportModal'
import { GenreSuggestSheet } from '../assets/components/molecules/GenreSuggestSheet'
import { CompleteShelfSheet } from '../assets/components/molecules/CompleteShelfSheet'
import { MarkOwnedSheet } from '../assets/components/molecules/MarkOwnedSheet'
import { PaletteGrid, PaletteSheet } from '../assets/components/molecules/PaletteSheet'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { ConfigLateral, type SeccionConfig } from './configuracion/ConfigLateral'
import { AccountSheet, type AccountSheetKey } from '../assets/components/molecules/AccountSheets'
import { useTheme } from '../hooks/useTheme'
import { getPalette } from '../lib/palettes'
import { Button } from '../assets/components/atoms/Button'
import { ActionConfirmModal } from '../assets/components/molecules/ActionConfirmModal'
import { ConfirmSheet } from '../assets/components/molecules/ConfirmSheet'
import { ThemeToggle } from '../assets/components/atoms/ThemeToggle'
import { Select } from '../assets/components/atoms/Select'
import { currencyOptions } from '../lib/currencies'
import { SettingsGroup, SettingsRow, SettingsField } from '../assets/components/molecules/SettingsList'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { EncabezadoAncho } from '../assets/components/molecules/EncabezadoAncho'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { supabase } from '../lib/supabase'
import { LATEST_VERSION, hasUnseenChangelog } from '../lib/changelog'

const SCROLL_KEY = 'teleo-config-scroll'

/** Secciones para el índice de la computadora (V.4.3.0), en el orden de la pantalla. */
const SECCIONES: SeccionConfig[] = [
  { id: 'cfg-teleo', label: 'Teleo' },
  { id: 'cfg-apariencia', label: 'Apariencia' },
  { id: 'cfg-sistema', label: 'Sistema' },
  { id: 'cfg-cuenta', label: 'Cuenta' },
  { id: 'cfg-compartir', label: 'Compartir' },
  { id: 'cfg-informacion', label: 'Información' },
  { id: 'cfg-datos', label: 'Tus datos' },
  { id: 'cfg-peligro', label: 'Zona de peligro', danger: true },
]

export function Configuracion() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { start: startTour } = useTour()
  const { profile, updateProfile } = useProfile(user?.id)
  // Cuenta de visitante (V.3.3.0): sin cambios de cuenta, importaciones, invitaciones ni zona de peligro.
  const isDemo = !!profile?.is_demo
  const { exportData } = useDataExport(user?.id)
  const { importData } = useDataImport(user?.id)
  const { clearAllData, deactivateAccount, deleteAccount, isProcessing } = useDangerZone(user?.id)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isShareWishlistModalOpen, setIsShareWishlistModalOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isGoodreadsOpen, setIsGoodreadsOpen] = useState(false)
  const [isGenreSuggestOpen, setIsGenreSuggestOpen] = useState(false)
  const [isCompleteShelfOpen, setIsCompleteShelfOpen] = useState(false)
  const [isMarkOwnedOpen, setIsMarkOwnedOpen] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  // Hojas de Cuenta (V.2.2.0). Las rutas viejas (/configuracion/usuario, etc.) siguen
  // funcionando: abren Configuración con la hoja correspondiente ya abierta.
  const location = useLocation()
  const [accountSheet, setAccountSheet] = useState<AccountSheetKey | null>(() => {
    const key = location.pathname.split('/')[2]
    return key === 'usuario' || key === 'nickname' || key === 'correo' || key === 'contrasena' ? key : null
  })
  function closeAccountSheet() {
    setAccountSheet(null)
    if (location.pathname !== '/configuracion') navigate('/configuracion', { replace: true })
  }
  const { palette, resolvedTheme } = useTheme()
  // En tableta y computadora (V.4.3.0) el tema se elige ahí mismo, con los temas a la vista.
  const breakpoint = useBreakpoint()
  const isAncha = breakpoint !== 'celular'
  const activePalette = getPalette(palette)
  const [confirmAction, setConfirmAction] = useState<
    'cerrarSesion' | 'exportar' | 'importar' | 'vaciar' | 'desactivar' | 'eliminar' | null
  >(null)
  const [dialogState, setDialogState] = useState<'confirm' | 'success' | 'error'>('confirm')
  const [deleteChecked, setDeleteChecked] = useState(false)
  // Se lee al entrar; al volver desde Novedades la pantalla se monta de nuevo y ya no aparece.
  const [hasNews] = useState(hasUnseenChangelog)


  // Al volver de una opción (Novedades, Correo, Guía...) se regresa a la misma altura de
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
    <div className="min-h-screen bg-glow-top px-4 pt-4 pagina-lectura">
      {/* V.3.0.0: sin flecha de regresar; la barra de pestañas queda visible con Perfil
          marcado, y tocar Perfil vuelve a Perfil (en iPhone instalado puede no haber gesto
          para volver). */}
      {/* En tableta y computadora (V.4.3.0), el encabezado de las demás pantallas: queda fijo
          arriba al bajar, con el título más chico. */}
      {isAncha ? (
        <EncabezadoAncho title="Configuración" subtitle="Ajusta tus preferencias, privacidad y gestiona tu cuenta a tu gusto." />
      ) : (
        <PageHeader
          title="Configuración"
          subtitle="Ajusta tus preferencias, privacidad y gestiona tu cuenta a tu gusto."
        />
      )}

      {/* En tableta y computadora (V.4.3.0): las mismas carpetas del teléfono, en una columna de
          720px alineada con el encabezado. En la computadora, a la derecha va una columna fija con
          la vista previa del tema y el índice de las secciones (ConfigLateral). */}
      <div className="escritorio:grid escritorio:grid-cols-[720px_minmax(0,1fr)] escritorio:gap-14 escritorio:items-start">
      <div className="flex flex-col gap-5 tableta:max-w-180">
        <SettingsGroup id="cfg-teleo" title="Teleo">
          <SettingsRow label="Detrás de Teleo" description="Quién hace Teleo y por qué" onClick={() => openSubpage('/configuracion/detras-de-teleo')} />
          <SettingsRow label="Novedades" description={`Versión ${LATEST_VERSION} y anteriores`} dot={hasNews} onClick={() => openSubpage('/configuracion/novedades')} />
        </SettingsGroup>

        <SettingsGroup id="cfg-apariencia" title="Apariencia">
          <SettingsField label="Modo de color" description={`Sistema sigue el modo de tu ${isAncha ? 'dispositivo' : 'teléfono'}`}>
            <ThemeToggle onChange={(mode) => { if (!isDemo) void updateProfile({ theme_mode: mode }) }} />
          </SettingsField>
          {isAncha ? (
            <SettingsField label="Tema" description="Toca uno para cambiarlo. Cada tema tiene su versión clara y oscura.">
              <PaletteGrid columns={4} withDescription={false} onSave={(id) => { void updateProfile({ palette: id }) }} />
            </SettingsField>
          ) : (
          <SettingsRow
            label="Tema"
            description={activePalette.name}
            onClick={() => setIsPaletteOpen(true)}
            trailing={
              <span className="flex -space-x-1.5 shrink-0" aria-hidden="true">
                {[activePalette[resolvedTheme].primary, ...activePalette[resolvedTheme].accents].map((color, i) => (
                  <span key={i} className="w-5 h-5 rounded-full border-2 border-surface" style={{ background: color }} />
                ))}
              </span>
            }
          />
          )}
        </SettingsGroup>

        <SettingsGroup id="cfg-sistema" title="Sistema">
          <SettingsField label="Idioma" description="Por ahora Teleo está solo en español">
            <Select options={[{ value: 'es', label: 'Español' }]} value="es" disabled />
          </SettingsField>
          <SettingsField label="Moneda" description="Se usa para mostrar el valor de tu biblioteca en Bitácora">
            <Select
              options={currencyOptions}
              value={profile?.currency ?? undefined}
              onChange={(e) => updateProfile({ currency: e.target.value })}
              placeholder="Elige la moneda de tu cuenta"
            />
          </SettingsField>
        </SettingsGroup>

        <SettingsGroup id="cfg-cuenta" title="Cuenta">
          {!isDemo && <SettingsRow label="Nombre de usuario" description={profile?.username ? `@${profile.username}` : 'Tu @usuario en Teleo'} onClick={() => setAccountSheet('usuario')} />}
          <SettingsRow label="Nickname" description={profile?.nickname || 'Cómo te saluda Teleo'} onClick={() => setAccountSheet('nickname')} />
          {!isDemo && <SettingsRow label="Correo" description={user?.email ?? 'El correo con el que inicias sesión'} onClick={() => setAccountSheet('correo')} />}
          {!isDemo && <SettingsRow label="Contraseña" description="Actualiza tu clave de acceso" onClick={() => setAccountSheet('contrasena')} />}
        </SettingsGroup>

        <SettingsGroup
          id="cfg-compartir"
          title="Compartir"
          note="Quien se registre con tu enlace queda como invitación tuya. Más adelante, tu código servirá para agregarse en el Club."
        >
          {!isDemo && <SettingsRow label="Invita a alguien a Teleo" description="Un enlace y una tarjeta con tu código" onClick={() => setIsInviteOpen(true)} />}
          {!isDemo && <FriendCodeSettingsRow code={profile?.friend_code} />}
          <SettingsRow label="Compartir perfil" description="Una tarjeta de tu rincón en imagen" onClick={() => setIsShareModalOpen(true)} />
          <SettingsRow label="Compartir lista de deseados" description="Un PDF con los libros que quieres" onClick={() => setIsShareWishlistModalOpen(true)} />
        </SettingsGroup>

        <SettingsGroup id="cfg-informacion" title="Información">
          <SettingsRow label="Tutorial" description="Un recorrido corto por la app" onClick={startTour} />
          <SettingsRow label="Guía de Teleo" description="Todo lo que puedes hacer en cada sección, con más detalle" onClick={() => openSubpage('/guia')} />
          <SettingsRow label="Política de privacidad" description="Qué datos guarda Teleo y para qué" onClick={() => openSubpage('/privacidad')} />
          <SettingsRow label="Términos de uso" description="Las reglas para usar Teleo" onClick={() => openSubpage('/terminos')} />
        </SettingsGroup>

        <SettingsGroup id="cfg-datos" title="Tus datos">
          <SettingsRow label="Exportar datos" description="Descarga una copia de tu librería" onClick={() => { setConfirmAction('exportar'); setDialogState('confirm') }} />
          {!isDemo && <SettingsRow label="Importar datos" description="Trae datos desde un archivo de respaldo" onClick={handleImportClick} />}
          {!isDemo && <SettingsRow label="Importar desde Goodreads" description="Trae tu biblioteca de Goodreads a Teleo" onClick={() => setIsGoodreadsOpen(true)} />}
          <SettingsRow label="Completar géneros" description="Sugerencias para tus libros sin género" onClick={() => setIsGenreSuggestOpen(true)} />
          <SettingsRow label="Completa tu estante" description="Género, ánimo y ritmo de lo que ya leíste, libro por libro" onClick={() => setIsCompleteShelfOpen(true)} />
          <SettingsRow label="Marcar mis libros físicos" description="Lo tengo en los físicos que no están en Deseados" onClick={() => setIsMarkOwnedOpen(true)} />
        </SettingsGroup>

        {!isDemo && (
        <SettingsGroup id="cfg-peligro" title="Zona de peligro">
          <SettingsRow danger label="Vaciar datos" description="Borra libros, sagas y reseñas" onClick={() => { setConfirmAction('vaciar'); setDialogState('confirm') }} />
          <SettingsRow danger label="Desactivar cuenta" description="Pausa tu cuenta sin perder nada" onClick={() => { setConfirmAction('desactivar'); setDialogState('confirm') }} />
          <SettingsRow danger label="Eliminar cuenta" description="Borra tu cuenta para siempre" onClick={() => { setConfirmAction('eliminar'); setDialogState('confirm'); setDeleteChecked(false) }} />
        </SettingsGroup>
        )}

        <Button variant="outline" onClick={() => setConfirmAction('cerrarSesion')}>
          Cerrar sesión
        </Button>
      </div>
      {breakpoint === 'escritorio' && (
        <ConfigLateral secciones={isDemo ? SECCIONES.filter((x) => !x.danger) : SECCIONES} />
      )}
      </div>

      <div className="pb-28" />
      <TabBar active="perfil" onChange={(t: TabKey) => navigate(`/${t}`)} onActiveTap={() => navigate('/perfil')} />

      {isInviteOpen && <InviteSheet userId={user?.id} onClose={() => setIsInviteOpen(false)} />}

      {isShareModalOpen && (
        <ShareProfileModal
          onClose={() => setIsShareModalOpen(false)}
          userId={user?.id}
        />
      )}

      {accountSheet && <AccountSheet sheet={accountSheet} onClose={closeAccountSheet} />}

      {isPaletteOpen && (
        <PaletteSheet onClose={() => setIsPaletteOpen(false)} onSave={(id) => updateProfile({ palette: id })} />
      )}

      {isGenreSuggestOpen && <GenreSuggestSheet userId={user?.id} onClose={() => setIsGenreSuggestOpen(false)} />}
      {isCompleteShelfOpen && <CompleteShelfSheet userId={user?.id} onClose={() => setIsCompleteShelfOpen(false)} />}
      {isMarkOwnedOpen && <MarkOwnedSheet userId={user?.id} mode="settings" onClose={() => setIsMarkOwnedOpen(false)} />}

      {isGoodreadsOpen && (
        <GoodreadsImportModal onClose={() => setIsGoodreadsOpen(false)} userId={user?.id} />
      )}

      {isShareWishlistModalOpen && (
        <ShareWishlistModal onClose={() => setIsShareWishlistModalOpen(false)} userId={user?.id} />
      )}

      {confirmAction === 'cerrarSesion' && (
        <ConfirmSheet
          title="¿Cerrar sesión?"
          message="Tendrás que iniciar sesión de nuevo para volver a tu rincón de lectura."
          confirmLabel="Cerrar sesión"
          onConfirm={handleSignOut}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'exportar' && (
        <ActionConfirmModal
          isOpen
          status={dialogState}
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

      {confirmAction === 'desactivar' && (
        <ConfirmSheet
          title="Pausa en tu lectura"
          message="¿Sientes que es momento de un respiro? Al desactivar tu cuenta, tu perfil y lecturas descansarán con nosotros. Guardaremos tu progreso como un marcapáginas eterno, esperando el momento en que decidas abrir de nuevo tus historias favoritas. ¡Te extrañaremos!"
          confirmLabel="Desactivar"
          cancelLabel="Seguir leyendo"
          isLoading={isProcessing}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'eliminar' && (
        <ConfirmSheet
          title="Cerrar el libro para siempre"
          message={
            <>
              Estás a punto de borrar definitivamente toda tu biblioteca, reseñas y notas.{' '}
              <span className="font-semibold text-text">Esta acción es permanente e irreversible.</span>
            </>
          }
          confirmLabel="Eliminar mi cuenta"
          confirmDisabled={!deleteChecked}
          isLoading={isProcessing}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmAction(null)}
        >
          <label className="flex items-start gap-2.5 mt-4 text-body-sm text-text-secondary text-left bg-surface-2 border border-border rounded-[18px] px-3.5 py-3">
            <input
              type="checkbox"
              checked={deleteChecked}
              onChange={(e) => setDeleteChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
            />
            Entiendo que perderé toda mi librería de manera irreversible.
          </label>
        </ConfirmSheet>
      )}
    </div>
  )
}