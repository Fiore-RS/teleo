import { Flame, Trophy } from 'lucide-react'

interface StreakTilesProps {
  current: number
  longest: number
}

/** Racha actual y racha más larga, lado a lado. Los mismos recuadros en Bitácora y en el
 *  calendario de lectura, para que se vean iguales en los dos lugares. */
export function StreakTiles({ current, longest }: StreakTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="bg-orange-tint border border-border rounded-2xl p-3.5 flex items-center gap-3">
        <span className="w-10 h-10 shrink-0 rounded-full bg-orange-soft text-orange-text flex items-center justify-center">
          <Flame size={20} fill="currentColor" />
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-[22px] leading-none text-text tabular-nums">{current}</p>
          <p className="text-body-sm text-text-secondary mt-1">Racha actual</p>
        </div>
      </div>
      <div className="bg-pink-tint border border-border rounded-2xl p-3.5 flex items-center gap-3">
        <span className="w-10 h-10 shrink-0 rounded-full bg-pink-soft text-pink-text flex items-center justify-center">
          <Trophy size={19} />
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-[22px] leading-none text-text tabular-nums">{longest}</p>
          <p className="text-body-sm text-text-secondary mt-1">Racha más larga</p>
        </div>
      </div>
    </div>
  )
}
