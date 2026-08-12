import { useState } from "react";
import { ImageOff, Heart, Trash2 } from "lucide-react";
import { useSaga } from "../hooks/useSaga";
import { useAuth } from "../hooks/useAuth";
import { DogEar } from "../assets/components/atoms/DogEar";
import { Badge } from "../assets/components/atoms/Badge";
import { Input } from "../assets/components/atoms/Input";
import { Select } from "../assets/components/atoms/Select";
import { FavoriteToggle } from "../assets/components/atoms/FavoriteToggle";
import { Button } from "../assets/components/atoms/Button";
import { ProgressBar } from "../assets/components/atoms/ProgressBar";
import { ConfirmDialog } from "../assets/components/molecules/ConfirmDialog";
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
  { value: "Novela", label: "Novela" },
  { value: "Ensayo", label: "Ensayo" },
  { value: "Poesía", label: "Poesía" },
  { value: "Cómic/Manga", label: "Cómic/Manga" },
  { value: "No ficción", label: "No ficción" },
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
}

function SagaStackPreview({
  bookCount,
  covers,
  status,
  isFavorite,
  showBadges,
}: {
  bookCount: number;
  covers: [string?, string?, string?];
  status: ReadingStatus;
  isFavorite?: boolean;
  showBadges?: boolean;
}) {
  if (bookCount === 0) {
    return (
      <div className="relative aspect-4/5 w-32 mx-auto my-4 rounded-xl overflow-hidden bg-accent-finished drop-shadow-md flex items-center justify-center">
        <ImageOff size={20} className="text-surface" />
      </div>
    );
  }

  if (bookCount === 1) {
    return (
      <div className="relative aspect-4/5 w-32 mx-auto my-4 rounded-xl overflow-hidden bg-accent-finished drop-shadow-md">
        {covers[0] ? (
          <img src={covers[0]} alt="" className="w-full h-full object-cover" />
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
          <span className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-surface flex items-center justify-center shadow-sm">
            <Heart
              size={12}
              fill="var(--color-accent-wishlist)"
              color="var(--color-accent-wishlist)"
            />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex aspect-4/5 w-32 mx-auto my-4 drop-shadow-md">
      {bookCount >= 3 && (
        <div className="relative w-5 h-[92%] mt-[8%] rounded-t-md rounded-l-md overflow-hidden shrink-0 bg-accent-wishlist">
          {covers[2] && (
            <img
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
          <img src={covers[1]} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="relative flex-1 h-full -ml-2 rounded-xl overflow-hidden bg-accent-finished">
        {covers[0] ? (
          <img src={covers[0]} alt="" className="w-full h-full object-cover" />
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
          <span className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-surface flex items-center justify-center shadow-sm">
            <Heart
              size={12}
              fill="var(--color-accent-wishlist)"
              color="var(--color-accent-wishlist)"
            />
          </span>
        )}
      </div>
    </div>
  );
}

export function DetalleSaga({
  sagaId,
  onClose,
  onOpenBook,
  onDeleted,
}: DetalleSagaProps) {
  const { user } = useAuth();
  const {
    saga,
    books,
    updateSaga,
    assignBookToSaga,
    removeBookFromSaga,
    reorderBookInSaga,
    deleteSaga,
  } = useSaga(sagaId);

  const [isEditing, setIsEditing] = useState(false);
  const [deleteState, setDeleteState] = useState<
    "closed" | "confirm" | "success" | "error"
    >("closed");
  const [isSelectBookOpen, setIsSelectBookOpen] = useState(false);
  const [draft, setDraft] = useState<{
    title: string;
    author: string;
    category: string;
    status: ReadingStatus;
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
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!draft) return;
    await updateSaga({
      title: draft.title,
      author: draft.author || null,
      category: draft.category,
      status: draft.status,
    });
    setIsEditing(false);
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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!saga ? (
          <p className="text-center text-text-secondary py-10">Cargando...</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-display-md text-accent-wishlist">
                {isEditing ? "Editar Saga" : "Detalles de la Saga"}
              </h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="text-text-secondary"
              >
                ✕
              </button>
            </div>

            {!isEditing ? (
              <>
                <h3 className="font-display italic text-display-md text-accent-wishlist text-center">
                  {saga.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-body-md text-text-secondary">{saga.author}</p>
                    <p className="text-body-sm text-text-secondary">
                      {books.length} de {books.length} libros
                    </p>
                  </div>
                  <Badge status={(saga.status ?? "pendiente") as ReadingStatus} />
                </div>
                {saga.category && <p className="text-body-md text-text mt-2">{saga.category}</p>}

                <SagaStackPreview
                  bookCount={books.length}
                  covers={covers}
                  status={(saga.status ?? "pendiente") as ReadingStatus}
                  isFavorite={saga.is_favorite ?? false}
                  showBadges
                />

                <h3 className="font-display italic text-display-md text-accent-wishlist">
                  Libros agregados
                </h3>
                <div className="border-b-6 border-border mt-2 mb-3" />
                <Button variant="primary" onClick={() => setIsSelectBookOpen(true)}>
                  Agregar Libro
                </Button>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBookDragEnd}>
                  <SortableContext items={books.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 mt-3">
                      {books.map((book, i) => {
                        const { percent, label } = getProgressInfo(book);
                        return (
                          <SortableItem key={book.id} id={book.id}>
                            <div
                              onClick={() => onOpenBook(book.id)}
                              className="flex gap-3 bg-bg rounded-2xl p-3 cursor-pointer"
                            >
                              <div className="relative w-12 shrink-0 aspect-2/3 rounded-lg overflow-hidden bg-border">
                                {book.cover_url ? (
                                  <img
                                    src={book.cover_url}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageOff size={14} className="text-text-secondary" />
                                  </div>
                                )}
                                <DogEar
                                  status={book.status as ReadingStatus}
                                  size={20}
                                  className="absolute top-0 right-0"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-body-sm text-text-secondary">
                                  Libro {String(i + 1).padStart(2, "0")}
                                </p>
                                <p className="text-body-md text-text line-clamp-1">{book.title}</p>
                                {book.status === "leyendo" ? (
                                  <div className="mt-1">
                                    <div className="flex justify-between text-body-sm text-text-secondary">
                                      {label && <span>{label}</span>}
                                      <span>{Math.round(percent)}%</span>
                                    </div>
                                    <ProgressBar percent={percent} />
                                  </div>
                                ) : (
                                  <Badge status={book.status as ReadingStatus} className="mt-1" />
                                )}
                              </div>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>

                <Button variant="amber" className="mt-5" onClick={startEditing}>
                  Editar Saga
                </Button>
              </>
            ) : draft ? (
              <>
                <SagaStackPreview
                  bookCount={books.length}
                  covers={covers}
                  status={(saga.status ?? "pendiente") as ReadingStatus}
                  isFavorite={saga.is_favorite ?? false}
                />

                <label className="text-body-sm text-text-secondary block mb-1">Título</label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />

                <label className="text-body-sm text-text-secondary block mb-1 mt-4">Autor</label>
                <Input
                  value={draft.author}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-body-sm text-text-secondary block mb-1">Categoría</label>
                    <Select
                      options={categoryOptions}
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-body-sm text-text-secondary block mb-1">Estado</label>
                    <Select
                      options={statusOptions}
                      value={draft.status}
                      onChange={(e) =>
                        setDraft({ ...draft, status: e.target.value as ReadingStatus })
                      }
                    />
                  </div>
                </div>

                <label className="text-body-sm text-text-secondary block mb-1 mt-4">
                  Marcar como favorito
                </label>
                <FavoriteToggle
                  isFavorite={saga.is_favorite ?? false}
                  onToggle={() => updateSaga({ is_favorite: !saga.is_favorite })}
                />

                <h3 className="font-display italic text-display-md text-accent-wishlist mt-5">
                  Libros agregados
                </h3>
                <div className="border-b-6 border-border mt-2 mb-3" />
                <Button variant="primary" onClick={() => setIsSelectBookOpen(true)}>
                  Agregar Libro
                </Button>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBookDragEnd}>
                  <SortableContext items={books.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 mt-3">
                      {books.map((book, i) => (
                        <SortableItem key={book.id} id={book.id}>
                          <div className="flex gap-3 items-center bg-bg rounded-2xl p-3">
                            <div className="relative w-12 shrink-0 aspect-2/3 rounded-lg overflow-hidden bg-border">
                              {book.cover_url ? (
                                <img
                                  src={book.cover_url}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageOff size={14} className="text-text-secondary" />
                                </div>
                              )}
                              <DogEar
                                status={book.status as ReadingStatus}
                                size={20}
                                className="absolute top-0 right-0"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-body-sm text-text-secondary">
                                Libro {String(i + 1).padStart(2, "0")}
                              </p>
                              <p className="text-body-md text-text line-clamp-1">{book.title}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBookFromSaga(book.id);
                              }}
                              aria-label="Quitar de la saga"
                              className="text-accent-wishlist shrink-0"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div className="flex gap-3 mt-5">
                  <Button variant="outline" onClick={() => setDeleteState("confirm")}>
                    Eliminar Saga
                  </Button>
                  <Button variant="green" onClick={handleSave}>
                    Guardar Cambios
                  </Button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

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
    </div>
  );
}