import { useState, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '../atoms/Input'

interface TagInputProps {
  onAdd: (tag: string) => void
  placeholder?: string
}

export function TagInput({ onAdd, placeholder = 'Agregar etiqueta...' }: TagInputProps) {
  const [value, setValue] = useState('')

  function handleAdd() {
    const trimmed = value.trim()
    if (trimmed) {
      onAdd(trimmed)
      setValue('')
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <Input
      icon={Plus}
      iconPosition="right"
      onIconClick={handleAdd}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  )
}