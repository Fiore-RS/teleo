import { useEffect, useState, type ChangeEvent } from 'react'
import { Input } from './Input'

function formatDurationDigits(digits: string): string {
  const d = digits.slice(0, 6)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}:${d.slice(2)}`
  return `${d.slice(0, 2)}:${d.slice(2, 4)}:${d.slice(4)}`
}

interface DurationMaskInputProps {
  value: string // formato "hh:mm:ss" o vacío
  onChange: (value: string) => void
  className?: string
}

export function DurationMaskInput({ value, onChange, className }: DurationMaskInputProps) {
  const [digits, setDigits] = useState(() => value.replace(/\D/g, '').slice(0, 6))

  useEffect(() => {
    const external = value.replace(/\D/g, '').slice(0, 6)
    setDigits((current) => (external !== current ? external : current))
  }, [value])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const newDigits = raw.replace(/\D/g, '').slice(0, 6)

    // si el usuario borró un ':' con backspace, la cantidad de dígitos no cambia
    // pero el texto crudo sí es más corto — en ese caso quitamos el último dígito real
    const finalDigits =
      newDigits.length === digits.length && raw.length < formatDurationDigits(digits).length
        ? digits.slice(0, -1)
        : newDigits

    setDigits(finalDigits)
    onChange(formatDurationDigits(finalDigits))
  }

  return (
    <Input
      value={formatDurationDigits(digits)}
      onChange={handleChange}
      placeholder="00:00:00"
      inputMode="numeric"
      className={className}
    />
  )
}