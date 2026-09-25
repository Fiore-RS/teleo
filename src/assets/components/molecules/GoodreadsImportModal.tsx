import { useRef, useState } from 'react'
import { FileUp, BookCheck, BookOpen, Bookmark, Heart, BookX, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'
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
  { status: 'pendiente', label: 'Pendientes', icon: Bookmark },
  { status: 'deseado', label: 'Deseados', icon: Heart },
  { status: 'abandonado', label: 'Abandonados', icon: BookX },
]

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "Importar desde Goodreads" (V.2.1.0): lee el CSV que exporta Goodreads, muestra cuántos
 *  libros entran en cada estado y cuántos se saltan por estar ya en Teleo, y recién al
 *  confirmar busca las portadas y guarda todo. */
export function GoodreadsImportModal({ onClose, userId }: GoodreadsImportModalProps) {
  const [step, setStep] = useState<Step>({ kind: 'inicio' })
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

  return (
    <Modal variant="sheet" isOpen onClose={onClose} title="Importar desde Goodreads">
      {step.kind === 'inicio' && (
        <>
          <div className="bg-surface-2 border border-border rounded-2xl p-5">
            <p className="text-body-md text-text font-semibold">Primero, descarga tu biblioteca de Goodreads:</p>
            <ol className="list-decimal pl-5 mt-2 flex flex-col gap-1 text-body-md text-text-secondary">
              <li>Entra a Goodreads desde el navegador, no desde su app.</li>
              <li>Ve a My Books y, en el menú de la izquierda, a Import and export.</li>
              <li>Toca Export Library y descarga el archivo .csv cuando esté listo.</li>
            </ol>
          </div>
          <p className="text-body-sm text-text-secondary mt-4">
            Tus leídos, lo que estás leyendo, tus pendientes y deseados, calificaciones, reseñas y
            estanterías (como etiquetas) pasan a Teleo, y los libros de una misma saga se agrupan en orden. Los libros que ya tienes aquí no se repiten.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button variant="primary" className="mt-5" onClick={() => inputRef.current?.click()} disabled={!userId}>
            <FileUp size={18} /> Elegir archivo
          </Button>
          {step.error && <p className="text-body-sm text-primary-text text-center mt-3">{step.error}</p>}
        </>
      )}

      {step.kind === 'analizando' && (
        <p className="text-body-md text-text-secondary text-center py-8">Leyendo tu biblioteca...</p>
      )}

      {step.kind === 'vista' && (
        <>
          {step.preview.books.length === 0 ? (
            <div className="bg-surface-2 border border-border rounded-2xl p-5 text-center">
              <p className="text-body-md text-text">
                Todos los libros del archivo ya están en tu biblioteca. No hay nada nuevo que importar.
              </p>
            </div>
          ) : (
            <>
              <p className="text-body-md text-text">
                Vas a importar <span className="font-semibold">{plural(step.preview.books.length, 'libro', 'libros')}</span>:
              </p>
              <ul className="mt-3 bg-surface-2 border border-border rounded-2xl divide-y divide-border">
                {STATUS_ROWS.filter(({ status }) => step.preview.counts[status] > 0).map(({ status, label, icon: Icon }) => (
                  <li key={status} className="flex items-center gap-3 px-4 py-3">
                    <Icon size={18} className="text-primary-text shrink-0" />
                    <span className="flex-1 text-body-md text-text">{label}</span>
                    <span className="font-display font-semibold text-body-lg text-text tabular-nums">{step.preview.counts[status]}</span>
                  </li>
                ))}
              </ul>
              {(step.preview.newSagas > 0 || step.preview.existingSagas > 0) && (
                <p className="text-body-sm text-text-secondary mt-3">
                  {[
                    step.preview.newSagas > 0 && `Se ${step.preview.newSagas === 1 ? 'crea' : 'crean'} ${plural(step.preview.newSagas, 'saga', 'sagas')} con sus libros en orden`,
                    step.preview.existingSagas > 0 && `${plural(step.preview.existingSagas, 'saga que ya tenías recibe', 'sagas que ya tenías reciben')} libros nuevos`,
                  ].filter(Boolean).join(', y ')}.
                </p>
              )}
              {step.preview.counts.deseado > 0 && (
                <p className="text-body-sm text-text-secondary mt-3">
                  Los libros de "Want to Read" que marcaste como tuyos en Goodreads quedan como pendientes; los demás, como deseados.
                </p>
              )}
            </>
          )}
          {step.preview.duplicates > 0 && (
            <p className="text-body-sm text-text-secondary mt-3">
              {plural(step.preview.duplicates, 'libro ya estaba', 'libros ya estaban')} en tu biblioteca y no se {step.preview.duplicates === 1 ? 'repite' : 'repiten'}.
            </p>
          )}
          <div className="flex flex-col gap-2 mt-5">
            {step.preview.books.length > 0 && (
              <Button variant="primary" onClick={() => handleImport(step.preview)}>Importar</Button>
            )}
            <Button variant="outline" onClick={() => setStep({ kind: 'inicio' })}>Elegir otro archivo</Button>
          </div>
        </>
      )}

      {step.kind === 'importando' && (
        <div className="py-4">
          {step.progress.phase === 'portadas' ? (
            <>
              <p className="text-body-md text-text text-center">
                Buscando portadas: {step.progress.done} de {step.progress.total}
              </p>
              <div className="h-2 rounded-full bg-surface-2 border border-border overflow-hidden mt-3" aria-hidden="true">
                <div
                  className="h-full bg-primary rounded-full transition-[width] duration-300"
                  style={{ width: `${step.progress.total ? (step.progress.done / step.progress.total) * 100 : 0}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-body-md text-text text-center">Guardando tus libros...</p>
          )}
          <p className="text-body-sm text-text-secondary text-center mt-3">
            Con muchos libros puede tardar unos minutos. Deja Teleo abierta mientras termina.
          </p>
        </div>
      )}

      {step.kind === 'listo' && (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-soft text-primary-text flex items-center justify-center mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="font-display font-semibold text-display-md text-text">¡Biblioteca importada!</h3>
          <p className="text-body-md text-text-secondary mt-2">
            {plural(step.result.imported, 'libro nuevo', 'libros nuevos')} en tu Estante
            {step.result.imported > 0 && `, ${step.result.withCover} con portada`}.
            {step.duplicates > 0 && ` ${plural(step.duplicates, 'ya estaba', 'ya estaban')} y no se repitieron.`}
          </p>
          {step.result.imported > step.result.withCover && (
            <p className="text-body-sm text-text-secondary mt-2">
              A los que quedaron sin portada puedes ponerle una desde el detalle del libro.
            </p>
          )}
          <Button variant="primary" className="mt-5" onClick={onClose}>Listo</Button>
        </div>
      )}

      {step.kind === 'error' && (
        <div className="text-center">
          <p className="text-body-md text-text">
            Algo falló a mitad de la importación. Algunos libros pueden haberse guardado: si vuelves a
            importar el mismo archivo, Teleo salta los que ya están.
          </p>
          <Button variant="primary" className="mt-5" onClick={() => setStep({ kind: 'inicio' })}>Intentar de nuevo</Button>
        </div>
      )}
    </Modal>
  )
}
