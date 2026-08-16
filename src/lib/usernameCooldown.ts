export function getUsernameCooldownInfo(changedAt: string | null): {
  canChange: boolean
  daysRemaining: number
} {
  if (!changedAt) return { canChange: true, daysRemaining: 0 }

  const changedDate = new Date(changedAt)
  const now = new Date()
  const daysSince = (now.getTime() - changedDate.getTime()) / (1000 * 60 * 60 * 24)
  const daysRemaining = Math.ceil(14 - daysSince)

  return {
    canChange: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining),
  }
}