export function computeMidpointOrder(beforeOrder: number | null, afterOrder: number | null): number {
  if (beforeOrder === null && afterOrder === null) return 0
  if (beforeOrder === null) return (afterOrder as number) - 1000
  if (afterOrder === null) return beforeOrder + 1000
  return (beforeOrder + afterOrder) / 2
}