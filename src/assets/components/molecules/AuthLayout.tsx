import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TapaPortada, TapaPortadaCelular } from './TapaPortada'

interface AuthLayoutProps {
  title: string
  subtitle?: ReactNode
  children?: ReactNode
  /** Botón principal y enlaces de abajo. Quedan al pie de la pantalla, a mano del pulgar. */
  footer?: ReactNode
  /** Si se pasa, el contenido y el pie forman un solo formulario (Enter envía). */
  onSubmit?: (e: FormEvent) => void
  /** Avisos sin campos ("Revisa tu correo"): un poco más de aire arriba. Desde el 26 oct 2026
   *  ya no se centran a lo alto: todo el bloque queda arriba, como en Bienvenida. */
  centered?: boolean
  /** Algo antes del título, como la ilustración de Bienvenida. */
  above?: ReactNode
  /** Título y textos centrados a lo ancho (Bienvenida). */
  textCenter?: boolean
}

/** Pantallas de cuenta (V.3.3.0, vista previa A): Login, Registro, Recuperar y Nueva
 *  contraseña, Correo confirmado e Instalar. Reemplaza a la tarjeta flotante con el cuadrado
 *  del logo (AuthHeader): el logo va arriba como en la portada, el título en la letra de
 *  títulos, los campos en una tarjeta de filas y los botones justo debajo. */
export function AuthLayout({ title, subtitle, children, footer, onSubmit, centered = false, above, textCenter = false }: AuthLayoutProps) {
  const navigate = useNavigate()

  const body = (
    <>
      <div className={`${centered ? 'mt-10' : 'mt-7'} ${textCenter ? 'text-center' : ''}`}>
        {above}
        <h1 className="font-title text-[30px] leading-[1.1] text-text text-balance">{title}</h1>
        {subtitle && <p className="font-body text-body-md text-text-secondary mt-2 text-pretty">{subtitle}</p>}
        {children && <div className={centered ? 'mt-3' : 'mt-6'}>{children}</div>}
      </div>
      {/* Los botones van justo después del contenido, con el mismo aire que en Bienvenida (56 px),
          y no pegados al fondo: en pantallas cortas el hueco los separaba de lo que confirman. */}
      {footer && <div className="mt-14 flex flex-col gap-3">{footer}</div>}
    </>
  )

  // Tableta y computadora (V.4.3.0): la tapa del cuaderno a la izquierda, fija, y a la derecha
  // la misma columna del teléfono, centrada a lo alto. Celular (V.4.5.0): la tapa arriba, de lado
  // a lado, en lugar del logo chico; tocarla lleva al inicio.
  return (
    <div className="min-h-dvh bg-glow-top flex flex-col tableta:grid tableta:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] escritorio:grid-cols-[600px_minmax(0,1fr)]">
      <div className="hidden tableta:block sticky top-0 h-dvh">
        <TapaPortada />
      </div>
      <div className="tableta:hidden mx-auto w-full max-w-120">
        <TapaPortadaCelular onClick={() => navigate('/')} />
      </div>
      <div
        className="mx-auto w-full max-w-120 flex-1 tableta:min-h-dvh flex flex-col px-6 tableta:max-w-[468px] tableta:justify-center tableta:py-12"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
      >
        {onSubmit ? (
          <form onSubmit={onSubmit} noValidate className="flex-1 tableta:flex-none flex flex-col">
            {body}
          </form>
        ) : (
          <div className="flex-1 tableta:flex-none flex flex-col">{body}</div>
        )}
      </div>
    </div>
  )
}

/** Tarjeta de filas de una pantalla de cuenta (Correo, Contraseña...). Sin pestaña desde el
 *  26 oct 2026: el título de la pantalla ya dice qué es. `label` queda como nombre accesible. */
export function AuthCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-surface border border-border rounded-card shadow-card overflow-hidden divide-y divide-border"
    >
      {children}
    </div>
  )
}

/** Texto chico centrado con un enlace ("¿Ya tienes cuenta? Inicia sesión aquí."). */
export function AuthFootnote({ children }: { children: ReactNode }) {
  return <p className="text-center text-body-md text-text-secondary">{children}</p>
}
