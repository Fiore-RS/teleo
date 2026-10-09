interface PageHeaderProps {
  title: string
  subtitle?: string
}

/** Encabezado de las pantallas secundarias (Configuración, Tutorial, Novedades...): título en
 *  la fuente caligráfica y una línea de descripción. V.3.0.0: sin flecha de regresar; esas
 *  pantallas cierran con SubpageNav (barra de pestañas o botón "Listo"). */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="px-1 pt-4 pb-6">
      <h1 className="font-title text-[clamp(30px,8.5vw,44px)] leading-[1.05] text-text text-balance">{title}</h1>
      {subtitle && <p className="font-body text-body-md text-text-secondary mt-2">{subtitle}</p>}
    </header>
  )
}
