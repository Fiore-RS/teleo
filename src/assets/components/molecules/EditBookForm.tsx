import { useRef } from 'react'
import { BookOpen, Camera, Gift, Headphones, Heart, ImageOff, Sparkles, Tablet, type LucideIcon } from 'lucide-react'
import { CoverImage } from '../atoms/CoverImage'
import { Input } from '../atoms/Input'
import { Select } from '../atoms/Select'
import { Tag } from '../atoms/Tag'
import { PriceInput } from '../atoms/PriceInput'
import { DateInput } from '../atoms/DateInput'
import { DurationMaskInput } from '../atoms/DurationMaskInput'
import { TagInput } from './TagInput'
import { StatusMenu } from './StatusMenu'
import { ReadingDatesFields } from './ReadingDatesFields'
import { FormCard, FormCollapsible, FormRow, FormSection, FormSwitchRow } from './FormLayout'
import { categoryOptions, type BookFormat } from '../../../lib/options'
import { formatCurrency } from '../../../lib/currencies'
import { formatShortDate, todayLocalDate } from '../../../lib/date'
import type { ReadingStatus } from '../../../lib/status'

/** Borrador de Editar libro. Todo se guarda junto al tocar "Guardar cambios" (desde la
 *  V.2.2.0 también Favorito y Esta temporada, que antes se guardaban al tocarlos). */
export interface BookDraft {
  title: string
  author: string
  format: BookFormat
  category: string
  status: ReadingStatus
  language: string
  totalPages: string
  totalDuration: string
  price: string
  purchaseDate: string
  isGift: boolean
  giftFrom: string
  /** Fechas de la lectura: se muestran y se guardan en Terminado y Abandonado. */
  startDate: string
  endDate: string
  abandonReason: string
  isFavorite: boolean
  isPriority: boolean
}

const formatChoices: { value: BookFormat; label: string; icon: LucideIcon }[] = [
  { value: 'fisico', label: 'Físico', icon: BookOpen },
  { value: 'digital', label: 'Digital', icon: Tablet },
  { value: 'audiolibro', label: 'Audiolibro', icon: Headphones },
]

function FormatPicker({ value, onChange }: { value: BookFormat; onChange: (format: BookFormat) => void }) {
  return (
    <div role="radiogroup" aria-label="Formato" className="grid grid-cols-3 gap-1 p-1 mb-2.5 bg-surface-2 border border-border rounded-[14px]">
      {formatChoices.map(({ value: v, label, icon: Icon }) => {
        const isActive = v === value
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-[10px] font-body font-bold text-body-md transition-all duration-150 ${
              isActive ? 'bg-surface text-primary-text shadow-card' : 'text-text-secondary'
            }`}
          >
            <Icon size={17} strokeWidth={2} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/** Resumen de la tarjeta Compra: "₡6 300 · 12 sep 2026", "Regalo de Ana" o "Sin datos". */
function purchaseSummary(draft: BookDraft, currency: string | null | undefined): string {
  const parts: string[] = []
  if (draft.isGift) {
    const from = draft.giftFrom.trim()
    parts.push(from ? `Regalo de ${from}` : 'Regalo')
  } else if (draft.price && !Number.isNaN(parseFloat(draft.price))) {
    parts.push(formatCurrency(parseFloat(draft.price), currency))
  }
  if (draft.purchaseDate) parts.push(formatShortDate(draft.purchaseDate))
  return parts.length > 0 ? parts.join(' · ') : 'Sin datos'
}

interface EditBookFormProps {
  coverUrl: string | null
  /** Estado guardado del libro, para proponer la fecha de hoy al cambiar a Terminado o Abandonado. */
  savedStatus: ReadingStatus
  draft: BookDraft
  onChange: (patch: Partial<BookDraft>) => void
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  languageOptions: { value: string; label: string }[]
  currency: string | null | undefined
  onCoverFile: (file: File) => void
  isUploadingCover: boolean
}

/** Cuerpo de la hoja Editar libro (V.2.2.0): ficha arriba (portada, título, autor, estado) y
 *  secciones Tu lectura, El libro, Etiquetas y Compra. Los botones van en el pie de la hoja. */
export function EditBookForm({
  coverUrl,
  savedStatus,
  draft,
  onChange,
  tags,
  onAddTag,
  onRemoveTag,
  languageOptions,
  currency,
  onCoverFile,
  isUploadingCover,
}: EditBookFormProps) {
  const coverInputRef = useRef<HTMLInputElement>(null)

  function handleStatusChange(status: ReadingStatus) {
    // Al pasar a Terminado o Abandonado sin fecha de fin, se propone hoy.
    const proposesToday = (status === 'terminado' || status === 'abandonado') && status !== savedStatus && !draft.endDate
    onChange({ status, endDate: proposesToday ? todayLocalDate() : draft.endDate })
  }

  const hasDates = draft.status === 'terminado' || draft.status === 'abandonado'

  return (
    <>
      <div className="relative z-10 flex gap-3.5 items-end mb-5.5">
        <div className="relative w-23 shrink-0 aspect-2/3 rounded-xl overflow-hidden bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)]">
          {coverUrl ? (
            <CoverImage src={coverUrl} alt={draft.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={22} className="text-text-secondary" />
            </div>
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            aria-label="Cambiar portada"
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/95 text-primary-text flex items-center justify-center shadow-sm disabled:opacity-60"
          >
            <Camera size={14} strokeWidth={2.2} />
          </button>
          {isUploadingCover && (
            <span className="absolute inset-x-0 bottom-0 py-1 bg-surface/90 text-center text-body-sm text-text-secondary animate-fade-in">
              Subiendo...
            </span>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onCoverFile(file)
              e.target.value = ''
            }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <Input
            bare
            aria-label="Título"
            placeholder="Título"
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="border-b-[1.5px] border-border focus:border-primary-text py-1 font-display font-semibold text-[20px] leading-tight"
          />
          <Input
            bare
            aria-label="Autor"
            placeholder="Autor"
            value={draft.author}
            onChange={(e) => onChange({ author: e.target.value })}
            className="border-b-[1.5px] border-border focus:border-primary-text py-1 text-body-lg text-text-secondary"
          />
          <div className="mt-1">
            <StatusMenu status={draft.status} onChange={handleStatusChange} align="left" />
          </div>
        </div>
      </div>

      <FormSection label="Tu lectura">
        {hasDates && (
          <div key={draft.status} className="animate-fade-in">
            <ReadingDatesFields
              className="mb-2.5"
              startDate={draft.startDate}
              endDate={draft.endDate}
              endLabel={draft.status === 'abandonado' ? 'Lo dejaste' : 'Fecha de fin'}
              showGoalHint={draft.status === 'terminado'}
              onChange={(dates) => onChange(dates)}
            />
            {draft.status === 'abandonado' && (
              <div className="bg-surface-2 border border-border rounded-[18px] px-3.5 py-2.5 mb-2.5">
                <label htmlFor="edit-abandon-reason" className="block mb-1 font-body font-semibold text-body-md text-text-secondary">
                  Motivo de abandono
                  <span className="ml-1 text-body-sm font-medium text-text-muted">opcional</span>
                </label>
                <textarea
                  id="edit-abandon-reason"
                  rows={3}
                  value={draft.abandonReason}
                  placeholder="¿Por qué lo dejaste?"
                  onChange={(e) => onChange({ abandonReason: e.target.value })}
                  className="w-full bg-transparent font-body text-body-lg text-text placeholder:text-text-muted focus:outline-none resize-none"
                />
              </div>
            )}
          </div>
        )}
        <FormCard>
          <FormSwitchRow icon={Heart} label="Favorito" checked={draft.isFavorite} onChange={(isFavorite) => onChange({ isFavorite })} />
          {draft.status === 'pendiente' && (
            <FormSwitchRow
              icon={Sparkles}
              label="Esta temporada"
              hint="En tu lista de prioridad"
              checked={draft.isPriority}
              onChange={(isPriority) => onChange({ isPriority })}
              className="animate-fade-in"
            />
          )}
        </FormCard>
      </FormSection>

      <FormSection label="El libro">
        <FormatPicker value={draft.format} onChange={(format) => onChange({ format })} />
        <FormCard>
          {draft.format === 'fisico' && (
            <FormRow label="Páginas" optional htmlFor="edit-pages">
              <Input
                bare
                id="edit-pages"
                type="number"
                inputMode="numeric"
                placeholder="000"
                value={draft.totalPages}
                onChange={(e) => onChange({ totalPages: e.target.value })}
                className="text-right text-body-lg"
              />
            </FormRow>
          )}
          {draft.format === 'audiolibro' && (
            <FormRow label="Duración" optional>
              <DurationMaskInput bare value={draft.totalDuration} onChange={(totalDuration) => onChange({ totalDuration })} className="text-right text-body-lg" />
            </FormRow>
          )}
          <FormRow label="Idioma" optional>
            <Select
              bare
              placeholder="Sin idioma"
              options={[{ value: '', label: 'Sin idioma' }, ...languageOptions]}
              value={draft.language}
              onChange={(e) => onChange({ language: e.target.value })}
            />
          </FormRow>
          <FormRow label="Categoría">
            <Select bare options={categoryOptions} value={draft.category} onChange={(e) => onChange({ category: e.target.value })} />
          </FormRow>
        </FormCard>
      </FormSection>

      <FormSection label="Etiquetas">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => <Tag key={tag} label={tag} onRemove={() => onRemoveTag(tag)} />)}
          </div>
        )}
        <TagInput onAdd={onAddTag} />
      </FormSection>

      <FormSection label="Compra" className="mb-2">
        <FormCollapsible title="Precio y regalo" summary={purchaseSummary(draft, currency)}>
          <FormSwitchRow icon={Gift} label="Fue un regalo" checked={draft.isGift} onChange={(isGift) => onChange({ isGift })} />
          {draft.isGift ? (
            <FormRow label="¿Quién te lo regaló?" htmlFor="edit-gift-from" className="animate-fade-in">
              <Input
                bare
                id="edit-gift-from"
                maxLength={60}
                placeholder="Un nombre..."
                value={draft.giftFrom}
                onChange={(e) => onChange({ giftFrom: e.target.value })}
                className="text-right text-body-lg"
              />
            </FormRow>
          ) : (
            <FormRow label="Precio" optional className="animate-fade-in">
              <PriceInput bare value={draft.price} onChange={(price) => onChange({ price })} className="text-right text-body-lg" />
            </FormRow>
          )}
          <FormRow label="Fecha de compra" optional>
            <DateInput bare value={draft.purchaseDate} onChange={(e) => onChange({ purchaseDate: e.target.value })} />
          </FormRow>
        </FormCollapsible>
      </FormSection>
    </>
  )
}
