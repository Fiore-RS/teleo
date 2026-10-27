import { useRef, useState, type ReactNode } from 'react'
import { FileUp, BookCheck, BookOpen, Bookmark, Heart, BookX, Pause, Layers, Tags, Copy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { ProgressBar } from '../atoms/ProgressBar'
import { FormActions, FormCard, FormHint, FormSection } from './FormLayout'
import { GenreSuggestSheet } from './GenreSuggestSheet'
import {
  analyzeGoodreadsFile,
  importGoodreadsBooks,
  type GoodreadsPreview,
  type GoodreadsProgress,
  type GoodreadsResult,
  type GoodreadsStatus,
} from '../../../hooks/useGoodreadsImport'

interface GoodreadsImportModalProps {
  onClose: () => void
  userId: string | undefined
}

type Step =
  | { kind: 'inicio'; error?: string }
  | { kind: 'analizando' }
  | { kind: 'vista'; preview: GoodreadsPreview }
  | { kind: 'importando'; progress: GoodreadsProgress }
  | { kind: 'listo'; result: GoodreadsResult; duplicates: number }
  | { kind: 'error' }

const STATUS_ROWS: { status: GoodreadsStatus; label: string; icon: LucideIcon }[] = [
  { status: 'terminado', label: 'Terminados', icon: BookCheck },
  { status: 'leyendo', label: 'Leyendo', icon: BookOpen },
  { status: 'pausado', label: 'En pausa', icon: Pause },
  { status: 'pendiente', label: 'Pendientes', icon: Bookmark },
  { status: 'deseado', label: 'Deseados', icon: Heart },
  { status: 'abandonado', label: 'Abandonados', icon: BookX },
]

const STEPS_TO_EXPORT = [
  'Entra a Goodreads desde el navegador, no desde su app.',
  'Ve a My Books y, en el menú de la izquierda, a Import and export.',
  'Toca Export Library y descarga el archivo .csv.',
]

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Fila de la vista previa: ícono, nombre y número (o texto) a la derecha. */
function CountRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 min-h-12">
      <Icon size={18} className="text-primary-text shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0 text-body-md font-semibold text-text-secondary">{label}</span>
      <span className="font-display font-semibold text-body-lg text-text tabular-nums">{value}</span>
    </div>
  )
}

/** "Importar desde Goodreads" (V.2.1.0; rediseño V.3.3.0 con secciones, tarjetas con filas y
 *  botones abajo). Lee el CSV que exporta Goodreads, muestra cuántos libros entran en cada
 *  estado y cuántos se saltan por estar ya en Teleo, y recién al confirmar busca las portadas y
 *  guarda todo. Las estanterías que coinciden con un género quedan como género (lib/goodreads.ts).
 *  Al terminar, si quedaron libros sin género, ofrece "Completar géneros". */
export function GoodreadsImportModal({ onClose, userId }: GoodreadsImportModalProps) {
  const [step, setStep] = useState<Step>({ kind: 'inicio' })
  const [isSuggestOpen, setIsSuggestOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file || !userId) return
    setStep({ kind: 'analizando' })
    try {
      const preview = await analyzeGoodreadsFile(file, userId)
      if (!preview) {
        setStep({ kind: 'inicio', error: 'Ese archivo no parece una exportación de Goodreads. Revisa que sea el .csv que descargaste de Goodreads.' })
        return
      }
      setStep({ kind: 'vista', preview })
    } catch {
      setStep({ kind: 'inicio', error: 'No se pudo leer el archivo. Inténtalo de nuevo.' })
    }
  }

  async function handleImport(preview: GoodreadsPreview) {
    if (!userId) return
    try {
      const result = await importGoodreadsBooks(preview.books, userId, (progress) =>
        setStep({ kind: 'importando', progress })
      )
      setStep({ kind: 'listo', result, duplicates: preview.duplicates })
    } catch {
      setStep({ kind: 'error' })
    }
  }

  // "Completar géneros" reemplaza a esta hoja: al cerrarla se cierra todo.
  if (isSuggestOpen) return <GenreSuggestSheet userId={userId} onClose={onClose} />

  let footer: ReactNode = null
  if (step.kind === 'inicio') {
    footer = (
      <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={!userId}>
        <FileUp size={18} /> Elegir archivo
      </Button>
    )
  } else if (step.kind === 'vista') {
    footer =
      step.preview.books.length > 0 ? (
        <FormActions>
          <Button variant="outline" onClick={() => setStep({ kind: 'inicio' })}>Otro archivo</Button>
          <Button variant="primary" onClick={() => handleImport(step.preview)}>Importar</Button>
        </FormActions>
      ) : (
        <Button variant="outline" onClick={() => setStep({ kind: 'inicio' })}>Elegir otro archivo</Button>
      )
  } else if (step.kind === 'listo') {
    footer =
      step.result.withoutGenre > 0 ? (
        <FormActions>
          <Button variant="outline" onClick={onClose}>Ahora no</Button>
          <Button variant="primary" onClick={() => setIsSuggestOpen(true)}>Sugerir géneros</Button>
        </FormActions>
      ) : (
        <Button variant="primary" onClick={onClose}>Listo</Button>
      )
  } else if (step.kind === 'error') {
    footer = <Button variant="primary" onClick={() => setStep({ kind: 'inicio' })}>Intentar de nuevo</Button>
  }

  return (
    <Sheet title="Importar desde Goodreads" onClose={onClose} footer={footer}>
      {step.kind === 'inicio' && (
        <div className="animate-fade-in">
          <FormSection label="Descarga tu biblioteca">
            <FormCard>
              {STEPS_TO_EXPORT.map((text, i) => (
                <div key={text} className="flex items-start gap-3 px-3.5 py-2.5">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center text-body-sm font-extrabold">
                    {i + 1}
                  </span>
                  <span className="text-body-md text-text pt-0.5">{text}</span>
                </div>
              ))}
            </FormCard>
          </FormSection>
          <FormSection label="Qué pasa a Teleo" className="mb-0">
            <p className="text-body-md text-text-secondary px-1">
              Tus leídos, lo que estás leyendo, pendientes y deseados, con calificaciones y reseñas. Las sagas se
              agrupan en orden. Tus estanterías pasan como géneros si coinciden con uno, y si no, como etiquetas.
              Los libros que ya tienes aquí no se repiten.
            </p>
          </FormSection>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {step.error && <FormHint text={step.error} tone="error" />}
        </div>
      )}

      {step.kind === 'analizando' && <FormHint text="Leyendo tu biblioteca…" tone="loading" />}

      {step.kind === 'vista' && (
        <div className="animate-fade-in">
          {step.preview.books.length === 0 ? (
            <p className="text-body-md text-text-secondary px-1">
              Todos los libros del archivo ya están en tu biblioteca. No hay nada nuevo que importar.
            </p>
          ) : (
            <>
              <FormSection label={`Vas a importar ${plural(step.preview.books.length, 'libro', 'libros')}`}>
                <FormCard>
                  {STATUS_ROWS.filter(({ status }) => step.preview.counts[status] > 0).map(({ status, label, icon }) => (
                    <CountRow key={status} icon={icon} label={label} value={step.preview.counts[status]} />
                  ))}
                </FormCard>
              </FormSection>

              {(step.preview.newSagas > 0 || step.preview.existingSagas > 0 || step.preview.withGenre > 0 || step.preview.duplicates > 0) && (
                <FormSection label="Además" className="mb-0">
                  <FormCard>
                    {step.preview.newSagas > 0 && <CountRow icon={Layers} label="Sagas nuevas, con sus libros en orden" value={step.preview.newSagas} />}
                    {step.preview.existingSagas > 0 && <CountRow icon={Layers} label="Sagas que ya tenías y reciben libros" value={step.preview.existingSagas} />}
                    {step.preview.withGenre > 0 && <CountRow icon={Tags} label="Libros con género desde tus estanterías" value={step.preview.withGenre} />}
                    {step.preview.duplicates > 0 && <CountRow icon={Copy} label="Ya estaban en Teleo y no se repiten" value={step.preview.duplicates} />}
                  </FormCard>
                </FormSection>
              )}

              {step.preview.counts.deseado > 0 && (
                <FormHint text={'De "Want to Read", los que marcaste como tuyos en Goodreads quedan como pendientes; los demás, como deseados.'} />
              )}
            </>
          )}
        </div>
      )}

      {step.kind === 'importando' && (
        <div className="py-2">
          {step.progress.phase === 'portadas' ? (
            <>
              <p className="text-body-md font-semibold text-text">
                Buscando portadas: {step.progress.done} de {step.progress.total}
              </p>
              <ProgressBar percent={step.progress.total ? (step.progress.done / step.progress.total) * 100 : 0} className="mt-3" />
            </>
          ) : (
            <FormHint text="Guardando tus libros…" tone="loading" />
          )}
          <FormHint text="Con muchos libros puede tardar unos minutos. Deja Teleo abierta mientras termina." />
        </div>
      )}

      {step.kind === 'listo' && (
        <div className="animate-fade-in">
          {/* V.3.3.0: sin el círculo con ícono, como el resto de los avisos. */}
          <p className="font-title text-[26px] leading-[1.1] text-text">¡Biblioteca importada!</p>
          <p className="text-body-md text-text-secondary mt-2">
            {plural(step.result.imported, 'libro nuevo', 'libros nuevos')} en tu Estante
            {step.result.imported > 0 && `, ${step.result.withCover} con portada`}.
            {step.duplicates > 0 && ` ${plural(step.duplicates, 'ya estaba', 'ya estaban')} y no se repitieron.`}
          </p>
          {step.result.imported > step.result.withCover && (
            <FormHint text="A los que quedaron sin portada puedes ponerles una desde el detalle del libro." />
          )}
          {step.result.withoutGenre > 0 && (
            <p className="text-body-md text-text mt-4">
              {plural(step.result.withoutGenre, 'libro quedó', 'libros quedaron')} sin género. ¿Te sugerimos géneros? Los
              revisas antes de guardarlos.
            </p>
          )}
        </div>
      )}

      {step.kind === 'error' && (
        <p className="text-body-md text-text-secondary">
          Algo falló a mitad de la importación. Algunos libros pueden haberse guardado: si vuelves a importar el mismo
          archivo, Teleo salta los que ya están.
        </p>
      )}
    </Sheet>
  )
}
