import { useTheme } from './useTheme'
import { bannerArtBoost } from '../lib/palettes'

/** Factor de opacidad de los dibujos de banners para el tema y modo activos (V.3.6.0). */
export function useBannerArtBoost(): number {
  const { palette, resolvedTheme } = useTheme()
  return bannerArtBoost(palette, resolvedTheme)
}
