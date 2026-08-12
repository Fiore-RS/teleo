import { Calendar } from 'lucide-react'
import { Input } from './Input'
import type { InputHTMLAttributes } from 'react'

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function DateInput(props: DateInputProps) {
  return (
    <Input
      {...props}
      icon={Calendar}
      iconPosition="left"
      type="text"
      placeholder={props.placeholder ?? '00/00/20XX'}
    />
  )
}