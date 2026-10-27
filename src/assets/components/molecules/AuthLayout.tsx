import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Logo } from '../atoms/Logo'
import { Card } from './Card'

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
 *  títulos, los campos en una tarjeta con pestaña y los botones justo debajo. */
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

  return (
    <div className="min-h-dvh bg-glow-top">
      <div
        className="mx-auto w-full max-w-120 min-h-dvh flex flex-col px-6"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
        }}
      >
        <div className="-ml-0.5">
          <Logo variant="full" className="h-7 w-auto" onClick={() => navigate('/')} />
        </div>
        {onSubmit ? (
          <form onSubmit={onSubmit} noValidate className="flex-1 flex flex-col">
            {body}
          </form>
        ) : (
          <div className="flex-1 flex flex-col">{body}</div>
        )}
      </div>
    </div>
  )
}

/** Tarjeta con pestaña para las filas de una pantalla de cuenta (Correo, Contraseña...). */
export function AuthCard({ label, icon, children }: { label: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <Card tab={{ label, icon }} padding="p-0" as="div">
      <div className="divide-y divide-border">{children}</div>
    </Card>
  )
}

/** Texto chico centrado con un enlace ("¿Ya tienes cuenta? Inicia sesión aquí."). */
export function AuthFootnote({ children }: { children: ReactNode }) {
  return <p className="text-center text-body-md text-text-secondary">{children}</p>
}
