import { statusColorVar, statusLabel, type ReadingStatus } from '../../../lib/status'

interface BadgeProps {
  status: ReadingStatus
  className?: string
}

export function Badge({ status, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-body-sm font-body ${className}`}
      style={{
        backgroundColor: statusColorVar[status],
        color: 'var(--color-surface)',
      }}
    >
      {statusLabel[status]}
    </span>
  )
}