import { useEffect, useState } from "react";
import { ImageOff, Heart, Trash2, ArrowUpDown, Plus, PenLine, GripVertical, Check } from "lucide-react";
import { useSaga } from "../hooks/useSaga";
import { useAuth } from "../hooks/useAuth";
import { DogEar } from "../assets/components/atoms/DogEar";
import { CoverImage } from "../assets/components/atoms/CoverImage";
import { Badge } from "../assets/components/atoms/Badge";
import { Input } from "../assets/components/atoms/Input";
import { Select } from "../assets/components/atoms/Select";
import { FavoriteToggle } from "../assets/components/atoms/FavoriteToggle";
import { Button } from "../assets/components/atoms/Button";
import { ProgressBar } from "../assets/components/atoms/ProgressBar";
import { ConfirmDialog } from "../assets/components/molecules/ConfirmDialog";
import { Sheet } from "../assets/components/atoms/Sheet";
import { DetailSkeleton } from "../assets/components/atoms/Skeleton";
import { getProgressInfo } from "../lib/progress";
import { statusLabel, type ReadingStatus } from "../lib/status";
import { SelectBookModal } from "../assets/components/molecules/SelectBookModal";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "../assets/components/atoms/SortableItem";

const categoryOptions = [
  { value: "Libro", label: "Libro" },
  { value: "Novela", label: "Novela" },
  { value: "Novela gráfica", label: "Novela gráfica" },
  { value: "Novela ligera", label: "Novela ligera" },
  { value: "Cómic", label: "Cómic" },
  { value: "Manga", label: "Manga" },
  { value: "Manhua", label: "Manhua" },
  { value: "Manhwa", label: "Manhwa" },
];

const statusOptions = (Object.keys(statusLabel) as ReadingStatus[]).map(
  (value) => ({
    value,
    label: statusLabel[value],
  }),
);

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
      <div className={`relative aspect-4/5 ${compact ? "w-28 shrink-0" : "w-32 mx-auto my-4"} rounded-[10px] overflow-hidden bg-accent-finished drop-shadow-md flex items-center justify-center`}>
        <ImageOff size={20} className="text-surface" />
      </div>
    );
  }

  if (bookCount === 1) {
    return (
      <div className={`relative aspect-4/5 ${compact ? "w-28 shrink-0" : "w-32 mx-auto my-4"} rounded-[10px] overflow-hidden bg-accent-finished drop-shadow-md`}>
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
    <div className={`relative flex aspect-4/5 ${compact ? "w-28 shrink-0" : "w-32 mx-auto my-4"} drop-shadow-md`}>
      {bookCount >= 3 && (
        <div className="relative w-5 h-[92%] mt-[8%] rounded-t-md rounded-l-md overflow-hidden shrink-0 bg-accent-wishlist">
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
        className={`relative w-6 h-[96%] mt-[4%] rounded-t-md rounded-l-md overflow-hidden shrink-0 bg-accent-reading ${bookCount >= 3 ? "-ml-1" : ""}`}
      >
        {covers[1] && (
          <CoverImage src={covers[1]} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="relative flex-1 h-full -ml-2 rounded-[10px] overflow-hidden bg-accent-finished">
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
    assignBookToSaga,
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
  const [draft, setDraft] = useState<{
    title: string;
    author: string;
    category: string;
    status: ReadingStatus;
    totalBooks: string;
  } | null>(null);

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
      status: (saga.status ?? "pendiente") as ReadingStatus,
      totalBooks: saga.total_books ? String(saga.total_books) : "",
    });
    setIsEditing(true);
    setIsReorderingBooks(false);
  }

  async function handleSave() {
    if (!draft) return;
    await updateSaga({
      title: draft.title,
      author: draft.author || null,
      category: draft.category,
      status: draft.status,
      total_books: draft.totalBooks ? parseInt(draft.totalBooks, 10) : null,
    });
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

  const labelClass = "font-body font-semibold text-body-sm text-text-secondary block mb-1.5";
  const sagaStatus = (saga?.status ?? "pendiente") as ReadingStatus;

  // Lista de libros de la saga: en modo "Organizar" se envuelve en el contexto de arrastre.
  function renderBookList(mode: "view" | "edit") {
    const rows = books.map((book, i) => (
      <SagaBookRow
        key={book.id}
        book={book}
        index={i}
        isReordering={isReorderingBooks}
        onOpen={mode === "view" ? () => onOpenBook(book.id) : undefined}
        onRemove={mode === "edit" ? () => removeBookFromSaga(book.id) : undefined}
      />
    ));
    if (!isReorderingBooks) return <div className="flex flex-col gap-2.5 mt-3 stagger-children">{rows}</div>;
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBookDragEnd}>
        <SortableContext items={books.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5 mt-3">
            {books.map((book, i) => (
              <SortableItem key={book.id} id={book.id}>
                {rows[i]}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  const booksHeader = (showEdit: boolean) => (
    <div className="flex items-center justify-between gap-2 mt-6">
      <p className="font-body font-bold text-body-sm uppercase tracking-[0.14em] text-primary-text">
        Libros agregados
      </p>
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
          aria-label="Agregar libro a la saga"
          className="w-9 h-9 rounded-full bg-primary text-primary-ink flex items-center justify-center"
        >
          <Plus size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Sheet onClose={onClose} title={isEditing ? "Editar saga" : "Detalles de la saga"}>
        {!saga ? <DetailSkeleton /> : !isEditing ? (
          <>
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

          </>
        ) : draft ? (
          <div className="flex flex-col gap-4">
            <SagaStackPreview bookCount={books.length} covers={covers} status={sagaStatus} isFavorite={saga.is_favorite ?? false} />

            <div>
              <label className={labelClass}>Título</label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>Autor</label>
              <Input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Categoría</label>
                <Select options={categoryOptions} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <Select
                  options={statusOptions}
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as ReadingStatus })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Cantidad total de libros de la saga</label>
              <Input
                type="number"
                min={1}
                placeholder={`Ej. ${Math.max(books.length, 1)}`}
                value={draft.totalBooks}
                onChange={(e) => setDraft({ ...draft, totalBooks: e.target.value })}
              />
              <p className="text-body-sm text-text-secondary mt-1.5">Déjalo vacío si todavía no sabes cuántos libros tendrá.</p>
            </div>

            <div>
              <label className={labelClass}>Marcar como favorito</label>
              <FavoriteToggle isFavorite={saga.is_favorite ?? false} onToggle={() => updateSaga({ is_favorite: !saga.is_favorite })} />
            </div>

            <div>
              {booksHeader(false)}
              {isReorderingBooks && (
                <p className="text-body-sm text-text-secondary text-center mt-2">Arrastra los libros para cambiar el orden.</p>
              )}
              {renderBookList("edit")}
            </div>

            <div className="flex gap-2.5 mt-2">
              <Button variant="outline" onClick={() => setDeleteState("confirm")}>
                <Trash2 size={17} />
                Eliminar
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Guardar cambios
              </Button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        isOpen={deleteState !== "closed"}
        status={deleteState === "closed" ? "confirm" : deleteState}
        itemLabel="saga"
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
        onSelect={assignBookToSaga}
      />
    </>
  );
}
