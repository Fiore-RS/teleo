export function parseDurationInput(input: string): number | null {
  const match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, h, m, s] = match
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)
}

export function secondsToTimeInput(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}