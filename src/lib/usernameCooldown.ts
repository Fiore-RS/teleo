/** Días de espera entre cambios del @usuario. Tiene que coincidir con el trigger de la base
 *  de datos (supabase/migrations/0023_profile_nickname.sql). */
export const USERNAME_COOLDOWN_DAYS = 7

export function getUsernameCooldownInfo(changedAt: string | null): {
  canChange: boolean
  daysRemaining: number
} {
  if (!changedAt) return { canChange: true, daysRemaining: 0 }

  const changedDate = new Date(changedAt)
  const now = new Date()
  const daysSince = (now.getTime() - changedDate.getTime()) / (1000 * 60 * 60 * 24)
  const daysRemaining = Math.ceil(USERNAME_COOLDOWN_DAYS - daysSince)

  return {
    canChange: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining),
  }
}