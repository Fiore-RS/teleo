/** Colores de la tarjeta para compartir una cita (Mis citas, V.2.1.0). Salen del tema activo:
 *  el degradado principal (el mismo del banner de Tu rincón) o uno de sus tres acentos. Cada
 *  uno trae el color de texto que se lee bien encima (ink) y el color de la decoración (art).
 *  Desde la V.3.6.0 la decoración va siempre clara: con el principal, el color de dibujo de
 *  banners del tema (banner-ink); con un acento, blanco. Antes usaba ink, que en varios temas
 *  es oscuro y dejaba los dibujos en negro. */
export type QuoteCardColor = 'principal' | 'orange' | 'pink' | 'magenta'

export const QUOTE_CARD_COLORS: { id: QuoteCardColor; label: string; panel: string; ink: string; art: string; swatch: string }[] = [
  { id: 'principal', label: 'Principal', panel: 'bg-linear-to-br from-primary to-rose', ink: 'text-primary-ink', art: 'text-banner-ink', swatch: 'bg-linear-to-br from-primary to-rose' },
  { id: 'orange', label: 'Acento 1', panel: 'bg-orange', ink: 'text-on-orange', art: 'text-white', swatch: 'bg-orange' },
  { id: 'pink', label: 'Acento 2', panel: 'bg-pink', ink: 'text-on-pink', art: 'text-white', swatch: 'bg-pink' },
  { id: 'magenta', label: 'Acento 3', panel: 'bg-magenta', ink: 'text-on-magenta', art: 'text-white', swatch: 'bg-magenta' },
]

export function getQuoteCardColor(id: QuoteCardColor) {
  return QUOTE_CARD_COLORS.find((c) => c.id === id) ?? QUOTE_CARD_COLORS[0]
}
