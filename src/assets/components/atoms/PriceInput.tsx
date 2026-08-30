import { useEffect, useState, type ChangeEvent } from 'react'
import { Input } from './Input'

// Deja pasar solo dígitos y un único punto decimal, con máximo 2 decimales — el mismo
// formato plano (sin comas) que ya se guarda en `draft.price` y se parsea con parseFloat().
function sanitizeDigitsAndDot(raw: string): string {
  let cleaned = raw.replace(/[^\d.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
    const [intPart, decPart = ''] = cleaned.split('.')
    cleaned = `${intPart}.${decPart.slice(0, 2)}`
  }
  return cleaned
}

// Agrega las comas de millar solo para lo que se muestra en pantalla (ej. "6,300.00"),
// el valor real que maneja el formulario nunca lleva comas.
function formatWithThousands(digitsAndDot: string): string {
  if (!digitsAndDot) return ''
  const [intPartRaw, decPart] = digitsAndDot.split('.')
  const intPart = intPartRaw.replace(/^0+(?=\d)/, '')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return digitsAndDot.includes('.') ? `${formattedInt}.${decPart ?? ''}` : formattedInt
}

interface PriceInputProps {
  /** Número plano sin comas, ej. "6300.00" o "" — mismo formato que ya usa `draft.price`. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function PriceInput({ value, onChange, placeholder = '0.00', className }: PriceInputProps) {
  const [raw, setRaw] = useState(() => sanitizeDigitsAndDot(value))

  useEffect(() => {
    const external = sanitizeDigitsAndDot(value)
    setRaw((current) => (external !== current ? external : current))
  }, [value])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const cleaned = sanitizeDigitsAndDot(e.target.value)
    setRaw(cleaned)
    onChange(cleaned)
  }

  return (
    <Input
      value={formatWithThousands(raw)}
      onChange={handleChange}
      placeholder={placeholder}
      inputMode="decimal"
      className={className}
    />
  )
}
