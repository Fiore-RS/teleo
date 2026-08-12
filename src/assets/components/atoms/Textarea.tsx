import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 4}
      className={`w-full bg-surface border border-border rounded-2xl p-4 text-body-lg font-body text-text placeholder:text-text-secondary focus:outline-none focus:border-accent-wishlist transition-colors resize-none ${className}`}
    />
  )
}