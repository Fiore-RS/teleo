import { Input } from '../atoms/Input'
import { FormCard, FormRow } from './FormLayout'
import { cleanPageInput } from '../../../lib/quotes'

interface QuoteFieldsProps {
  text: string
  page: string
  onTextChange: (text: string) => void
  onPageChange: (page: string) => void
  idPrefix: string
}

/** Campos de una cita (V.2.2.0): la frase en la tarjeta con comilla, en cursiva como se ve en
 *  la reseña y en Mis citas, y la página opcional en una fila. Los usan Nueva cita y Editar
 *  cita. */
export function QuoteFields({ text, page, onTextChange, onPageChange, idPrefix }: QuoteFieldsProps) {
  return (
    <>
      <div className="relative bg-surface-2 border border-border rounded-[18px] px-4 pt-4.5 pb-3 mb-3">
        <span aria-hidden="true" className="absolute left-3 -top-2.5 font-display font-semibold text-[40px] leading-none text-ornament select-none">
          “
        </span>
        <textarea
          autoFocus
          aria-label="Cita"
          rows={4}
          placeholder="¿Qué frase te gustó?"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full bg-transparent focus:outline-none resize-none font-display italic text-[17px] leading-relaxed text-text placeholder:text-text-muted"
        />
      </div>
      <FormCard className="mb-1">
        <FormRow label="Página" optional htmlFor={`${idPrefix}-page`}>
          <Input
            bare
            id={`${idPrefix}-page`}
            inputMode="numeric"
            placeholder="—"
            value={page}
            onChange={(e) => onPageChange(cleanPageInput(e.target.value))}
            className="w-16! text-center font-display font-semibold text-body-lg tabular-nums border-b-[1.5px] border-border focus:border-primary-text"
          />
        </FormRow>
      </FormCard>
    </>
  )
}
