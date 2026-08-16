import { Toggle } from '../atoms/Toggle'

interface PrivacyToggleRowProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function PrivacyToggleRow({ label, checked, onChange }: PrivacyToggleRowProps) {
  return (
    <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
      <span className="text-body-md text-text">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}