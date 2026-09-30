import { useEffect, useState } from "react";
import { ImageOff, Heart, Trash2, ArrowUpDown, Plus, PenLine, GripVertical, Check, X, RefreshCw } from "lucide-react";
import { useSaga } from "../hooks/useSaga";
import { useAuth } from "../hooks/useAuth";
import { DogEar } from "../assets/components/atoms/DogEar";
import { CoverImage } from "../assets/components/atoms/CoverImage";
import { Badge } from "../assets/components/atoms/Badge";
import { Input } from "../assets/components/atoms/Input";
import { Select } from "../assets/components/atoms/Select";
import { Button } from "../assets/components/atoms/Button";
import { ProgressBar } from "../assets/components/atoms/ProgressBar";
import { ConfirmDialog } from "../assets/components/molecules/ConfirmDialog";
import { Sheet } from "../assets/components/atoms/Sheet";
import { DetailSkeleton } from "../assets/components/atoms/Skeleton";
import { getProgressInfo } from "../lib/progress";
import { type ReadingStatus } from "../lib/status";
import { categoryOptions } from "../lib/options";
import { FormActions, FormCard, FormRow, FormSection, FormSectionLabel, FormSwitchRow } from "../assets/components/molecules/FormLayout";
import { SelectBookModal } from "../assets/components/molecules/SelectBookModal";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "../assets/components/atoms/SortableItem";

interface DetalleSagaProps {
  sagaId: string;
  onClose: () => void;
  onOpenBook: (bookId: string) => void;
  onDeleted: () => void;
  // Cambia (Estante.tsx lo incrementa) cada vez que se cierra el detalle de un libro que se
  // abrio desde aca adentro (onOpenBook), para que se vuelva a pedir la saga y sus libros:
  // el status del libro pudo haber cambiado el estado automatico de la saga.
  refreshSignal?: number;
}

function SagaStackPreview({
  bookCount,
  covers,
  status,
  isFavorite,
  showBadges,
  compact,
}: {
  compact?: boolean;
  bookCount: number;
  covers: [string?, string?, string?];
  status: ReadingStatus;
  isFavorite?: boolean;
  showBadges?: boolean;
}) {
  if (bookCount === 0) {
    return (
      <div className={`relative aspect-4/5 ${compact ? "w-28 shrink-0" : "w-23 shrink-0"} rounded-[10px] overflow-hidden bg-magenta drop-shadow-md flex items-center justify-center`}>
        <ImageOff size={20} className="text-surface" />
      </div>
    );
  }

  if (bookCount === 1) {
    return (
      <div className={`relative aspect-4/5 ${compact ? "w-28 shrink-0" : "w-23 shrink-0"} rounded-[10px] overflow-hidden bg-magenta drop-shadow-md`}>
        {covers[0] ? (
          <CoverImage src={covers[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={20} className="text-surface" />
          </div>
        )}
        {showBadges && (
          <DogEar
            status={status}
            size={30}
            className="absolute top-0 right-0"
          />
        )}
        {showBadges && isFavorite && (
          <span className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-surface/95 flex items-center justify-center shadow-sm">
            <Heart
              size={12}
              fill="var(--color-primary)"
              color="var(--color-primary)"
            />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex aspect-4/5 ${compact ? "w-28 shrink-0" : "w-23 shrink-0"} drop-shadow-md`}>
      {bookCount >= 3 && (
        <div className="relative w-5 h-[92%] mt-[8%] rounded-t-md rounded-l-md overflow-hidden shrink-0 bg-primary">
          {covers[2] && (
            <CoverImage
              src={covers[2]}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}
      <div
        className={`relative w-6 h-[96%] mt-[4%] rounded-t-md rounded-l-md overflow-hidden shrink-0 bg-orange ${bookCount >= 3 ? "-ml-1" : ""}`}
      >
        {covers[1] && (
          <CoverImage src={covers[1]} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="relative flex-1 h-full -ml-2 rounded-[10px] overflow-hidden bg-magenta">
        {covers[0] ? (
          <CoverImage src={covers[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={20} className="text-surface" />
          </div>
        )}
        {showBadges && (
          <DogEar
            status={status}
            size={30}
            className="absolute top-0 right-0"
          />
        )}
        {showBadges && isFavorite && (
          <span className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-surface/95 flex items-center justify-center shadow-sm">
            <Heart
              size={12}
              fill="var(--color-primary)"
              color="var(--color-primary)"
            />
          </span>
        )}
      </div>
    </div>
  );
}

type SagaBook = ReturnType<typeof useSaga>["books"][number];

/** Fila de un libro dentro de la saga (rediseño 2026): portada chica con doblez, número de
 *  libro en mayúsculas espaciadas, título en seminegrita y, según el modo, el progreso /
 *  estado (ver) o el botón para quitarlo de la saga (editar). */
function SagaBookRow({
  book,
  index,
  isReordering,
  onOpen,
  onRemove,
}: {
  book: SagaBook;
  index: number;
  isReordering?: boolean;
  onOpen?: () => void;
  onRemove?: () => void;
}) {
  const { percent, label } = getProgressInfo(book);
  const Wrapper = onOpen ? "button" : "div";
  return (
    <Wrapper
      {...(onOpen ? { type: "button" as const, onClick: onOpen } : {})}
      className="w-full text-left flex gap-3 items-center bg-surface-2 border border-border rounded-2xl p-2.5 pr-3"
    >
      {isReordering && <GripVertical size={16} className="text-text-muted shrink-0 -mr-1" />}
      <div className="relative w-12 shrink-0 aspect-2/3 rounded-md overflow-hidden bg-surface shadow-[0_4px_10px_-6px_rgba(60,30,10,0.5)]">
        {book.cover_url ? (
          <CoverImage src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={14} className="text-text-secondary" />
          </div>
        )}
        <DogEar status={book.status as ReadingStatus} size={18} className="absolute top-0 right-0" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body font-bold text-[11px] uppercase tracking-[0.12em] text-text-muted">
          Libro {String(index + 1).padStart(2, "0")}
        </p>
        <p className="font-body font-semibold text-body-md text-text line-clamp-1">{book.title}</p>
        {!onRemove &&
          (book.status === "leyendo" ? (
            <div className="mt-1.5">
              <div className="flex justify-between text-body-sm text-text-secondary mb-1 tabular-nums">
                {label && <span>{label}</span>}
                <span className="ml-auto">{Math.round(percent)}%</span>
              </div>
              <ProgressBar percent={percent} />
            </div>
          ) : (
            <Badge status={book.status as ReadingStatus} className="mt-1.5" />
          ))}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Quitar de la saga"
          className="w-8 h-8 rounded-full bg-primary-soft text-primary-text flex items-center justify-center shrink-0"
        >
          <Trash2 size={15} />
        </button>
      )}
    </Wrapper>
  );
}

/** Fila compacta de un libro en Editar saga (V.2.2.0): portada chica con doblez, número y
 *  título, y una × para quitarlo de la saga (se esconde mientras se organiza). */
function SagaEditBookRow({
  book,
  index,
  isReordering,
  onRemove,
}: {
  book: SagaBook;
  index: number;
  isReordering: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2.5 items-center px-3 py-2.5">
      {isReordering && <GripVertical size={16} className="text-text-muted shrink-0 -mr-0.5" />}
      <div className="relative w-8.5 shrink-0 aspect-2/3 rounded-[5px] overflow-hidden bg-surface">
        {book.cover_url ? (
          <CoverImage src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={12} className="text-text-secondary" />
          </div>
        )}
        <DogEar status={book.status as ReadingStatus} size={12} className="absolute top-0 right-0" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body font-bold text-[10.5px] uppercase tracking-[0.12em] text-text-muted">
          Libro {String(index + 1).padStart(2, "0")}
        </p>
        <p className="font-body font-semibold text-body-md text-text truncate">{book.title}</p>
      </div>
      {!isReordering && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${book.title} de la saga`}
          className="w-8 h-8 rounded-full text-text-muted flex items-center justify-center shrink-0"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

export function DetalleSaga({
  sagaId,
  onClose,
  onOpenBook,
  onDeleted,
  refreshSignal,
}: DetalleSagaProps) {
  const { user } = useAuth();
  const {
    saga,
    books,
    refetch,
    updateSaga,
    assignBooksToSaga,
    removeBookFromSaga,
    reorderBookInSaga,
    deleteSaga,
  } = useSaga(sagaId);

  // useSaga ya refetchea solo al montar/cambiar de sagaId, pero no se entera si el status de
  // uno de sus libros cambio desde el modal de DetalleLibro (vive en un componente hermano).
  useEffect(() => {
    if (refreshSignal === undefined) return;
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const [isEditing, setIsEditing] = useState(false);
  const [isReorderingBooks, setIsReorderingBooks] = useState(false);
  const [deleteState, setDeleteState] = useState<
    "closed" | "confirm" | "success" | "error"
    >("closed");
  const [isSelectBookOpen, setIsSelectBookOpen] = useState(false);
  // El estado de la saga no se edita: se calcula con el de sus libros (lib/sagaStatus).
  const [draft, setDraft] = useState<{
    title: string;
    author: string;
    category: string;
    totalBooks: string;
    isFavorite: boolean;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  function handleBookDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = books.findIndex((b) => b.id === active.id);
    const newIndex = books.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(books, oldIndex, newIndex);
    const droppedIndex = reordered.findIndex((b) => b.id === active.id);
    const beforeId = reordered[droppedIndex - 1]?.id ?? null;
    const afterId = reordered[droppedIndex + 1]?.id ?? null;
    reorderBookInSaga(active.id as string, beforeId, afterId);
  }

  function startEditing() {
    if (!saga) return;
    setDraft({
      title: saga.title,
      author: saga.author ?? "",
      category: saga.category ?? "Novela",
      totalBooks: saga.total_books ? String(saga.total_books) : "",
      isFavorite: saga.is_favorite ?? false,
    });
    setIsEditing(true);
    setIsReorderingBooks(false);
  }

  const canSave = !!draft && draft.title.trim() !== "";

  async function handleSave() {
    if (!draft || !canSave) return;
    setIsSaving(true);
    const total = parseInt(draft.totalBooks, 10);
    await updateSaga({
      title: draft.title.trim(),
      author: draft.author.trim() || null,
      category: draft.category,
      total_books: total > 0 ? total : null,
      is_favorite: draft.isFavorite,
    });
    setIsSaving(false);
    setIsEditing(false);
    setIsReorderingBooks(false);
  }

  async function handleDelete() {
    const ok = await deleteSaga();
    setDeleteState(ok ? "success" : "error");
  }

  const covers: [string?, string?, string?] = [
    books[0]?.cover_url ?? undefined,
    books[1]?.cover_url ?? undefined,
    books[2]?.cover_url ?? undefined,
  ];

  const sagaStatus = (saga?.status ?? "pendiente") as ReadingStatus;

  // Lista de libros de la saga: en modo "Organizar" se envuelve en el contexto de arrastre.
  // En Ver son tarjetas separadas; en Editar, filas compactas dentro de una sola tarjeta.
  function renderBookList(mode: "view" | "edit") {
    const rows = books.map((book, i) =>
      mode === "view" ? (
        <SagaBookRow
          key={book.id}
          book={book}
          index={i}
          isReordering={isReorderingBooks}
          onOpen={() => onOpenBook(book.id)}
        />
      ) : (
        <SagaEditBookRow
          key={book.id}
          book={book}
          index={i}
          isReordering={isReorderingBooks}
          onRemove={() => removeBookFromSaga(book.id)}
        />
      ),
    );
    const listClass = mode === "view" ? "flex flex-col gap-2.5 mt-3" : "";
    const list = !isReorderingBooks ? (
      <div className={`${listClass} ${mode === "view" ? "stagger-children" : ""}`}>{rows}</div>
    ) : (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBookDragEnd}>
        <SortableContext items={books.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className={listClass}>
            {books.map((book, i) => (
              <SortableItem key={book.id} id={book.id}>
                {rows[i]}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
    return mode === "view" ? list : <FormCard>{list}</FormCard>;
  }

  const bookActions = (showEdit: boolean) => (
      <div className="flex items-center gap-2">
        {books.length > 1 && (
          <button
            type="button"
            onClick={() => setIsReorderingBooks((v) => !v)}
            aria-label={isReorderingBooks ? "Terminar de organizar" : "Organizar libros"}
            className={`w-9 h-9 rounded-full border flex items-center justify-center ${
              isReorderingBooks
                ? "bg-primary text-primary-ink border-primary"
                : "bg-surface-2 border-border text-primary-text"
            }`}
          >
            {isReorderingBooks ? <Check size={16} /> : <ArrowUpDown size={16} />}
          </button>
        )}
        {showEdit && (
          <button
            type="button"
            onClick={startEditing}
            aria-label="Editar saga"
            className="w-9 h-9 rounded-full bg-surface-2 border border-border text-primary-text flex items-center justify-center"
          >
            <PenLine size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsSelectBookOpen(true)}
          aria-label="Agregar libros a la saga"
          className="w-9 h-9 rounded-full bg-primary text-primary-ink flex items-center justify-center"
        >
          <Plus size={18} strokeWidth={2.4} />
        </button>
      </div>
  );

  const booksHeader = (showEdit: boolean) => (
    <div className="flex items-center justify-between gap-2 mt-6">
      <p className="font-body font-bold text-body-sm uppercase tracking-[0.14em] text-primary-text">
        Libros agregados
      </p>
      {bookActions(showEdit)}
    </div>
  );

  return (
    <>
      <Sheet
        onClose={onClose}
        title={isEditing ? "Editar saga" : "Detalles de la saga"}
        footer={isEditing && draft ? (
          <FormActions>
            <Button variant="outline" onClick={() => { setIsEditing(false); setIsReorderingBooks(false); }}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!canSave} isLoading={isSaving}>
              Guardar cambios
            </Button>
          </FormActions>
        ) : undefined}
      >
        {!saga ? <DetailSkeleton /> : !isEditing ? (
          <div key="detail" className="animate-fade-in">
            <div className="flex gap-4 items-start">
              <SagaStackPreview
                compact
                bookCount={books.length}
                covers={covers}
                status={sagaStatus}
                isFavorite={saga.is_favorite ?? false}
                showBadges
              />
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-display font-semibold text-[21px] leading-tight text-text text-balance">{saga.title}</h3>
                {saga.author && <p className="text-body-md text-text-secondary mt-1">{saga.author}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge status={sagaStatus} />
                  {saga.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-body-sm font-bold bg-primary-soft text-primary-text">
                      {saga.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 bg-surface-2 border border-border rounded-2xl px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-body-md text-text-secondary">Libros en tu estante</p>
                <p className="font-display font-semibold text-body-lg text-text tabular-nums">
                  {saga.total_books ? `${books.length} de ${saga.total_books}` : books.length}
                </p>
              </div>
              {saga.total_books ? (
                <ProgressBar percent={Math.min(100, (books.length / saga.total_books) * 100)} className="mt-2" />
              ) : null}
            </div>

            {booksHeader(true)}
            {isReorderingBooks && (
              <p className="text-body-sm text-text-secondary text-center mt-2">Arrastra los libros para cambiar el orden.</p>
            )}
            {books.length === 0 ? (
              <p className="text-body-md text-text-secondary text-center mt-4">Todavía no agregas libros a esta saga.</p>
            ) : (
              renderBookList("view")
            )}

          </div>
        ) : draft ? (
          <div key="edit" className="animate-fade-in">
            <div className="flex gap-3.5 items-end mb-5.5">
              <SagaStackPreview bookCount={books.length} covers={covers} status={sagaStatus} />
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <Input
                  bare
                  aria-label="Título"
                  placeholder="Título"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="border-b-[1.5px] border-border focus:border-primary-text py-1 font-display font-semibold text-[20px] leading-tight"
                />
                <Input
                  bare
                  aria-label="Autor"
                  placeholder="Autor"
                  value={draft.author}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                  className="border-b-[1.5px] border-border focus:border-primary-text py-1 text-body-lg text-text-secondary"
                />
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge status={sagaStatus} />
                  <span className="inline-flex items-center gap-1 text-body-sm text-text-muted">
                    <RefreshCw size={12} strokeWidth={2.2} aria-hidden="true" />
                    Según tus libros
                  </span>
                </div>
              </div>
            </div>

            <FormSection label="La saga">
              <FormCard>
                <FormRow label="Categoría">
                  <Select bare options={categoryOptions} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                </FormRow>
                <div>
                  <FormRow label="Libros en total" optional htmlFor="edit-saga-total" className="pb-1">
                    <span className="flex items-center justify-end gap-2">
                      <span className="font-display font-semibold text-body-lg text-text tabular-nums">{books.length}</span>
                      <span className="text-body-md text-text-muted">de</span>
                      <Input
                        bare
                        id="edit-saga-total"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="?"
                        value={draft.totalBooks}
                        onChange={(e) => setDraft({ ...draft, totalBooks: e.target.value })}
                        className="w-11! text-center text-body-lg tabular-nums border-b-[1.5px] border-border focus:border-primary-text"
                      />
                    </span>
                  </FormRow>
                  <p className="px-3.5 pb-2.5 text-body-sm text-text-muted">Déjalo vacío si todavía no sabes cuántos tendrá.</p>
                </div>
                <FormSwitchRow
                  icon={Heart}
                  label="Favorita"
                  checked={draft.isFavorite}
                  onChange={(isFavorite) => setDraft({ ...draft, isFavorite })}
                />
              </FormCard>
            </FormSection>

            <section className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <FormSectionLabel className="mb-0!">{`Libros · ${books.length}`}</FormSectionLabel>
                {bookActions(false)}
              </div>
              {isReorderingBooks && (
                <p className="text-body-sm text-text-secondary text-center mb-2 animate-fade-in">Arrastra los libros para cambiar el orden.</p>
              )}
              {books.length === 0 ? (
                <p className="text-body-md text-text-secondary text-center py-3">Todavía no agregas libros a esta saga.</p>
              ) : (
                renderBookList("edit")
              )}
            </section>

            {/* Eliminar va al final, lejos de Guardar, para no tocarlo sin querer. */}
            <button
              type="button"
              onClick={() => setDeleteState("confirm")}
              className="w-full flex items-center justify-center gap-2 py-2.5 font-body font-bold text-body-md text-primary-text"
            >
              <Trash2 size={16} />
              Eliminar saga
            </button>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        isOpen={deleteState !== "closed"}
        status={deleteState === "closed" ? "confirm" : deleteState}
        itemLabel="saga"
        feminine
        onConfirm={handleDelete}
        onClose={() => {
          const wasSuccess = deleteState === "success";
          setDeleteState("closed");
          if (wasSuccess) onDeleted();
        }}
      />

      <SelectBookModal
        isOpen={isSelectBookOpen}
        onClose={() => setIsSelectBookOpen(false)}
        userId={user?.id}
        onConfirm={assignBooksToSaga}
      />
    </>
  );
}
