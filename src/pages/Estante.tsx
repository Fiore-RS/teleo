import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLibraryBooks } from "../hooks/useLibraryBooks";
import { useLibrarySagas } from "../hooks/useLibrarySagas";
import { SearchBar } from "../assets/components/molecules/SearchBar";
import { SegmentedTabs } from "../assets/components/atoms/SegmentedTabs";
import {
  FilterBar,
  type FilterValue,
} from "../assets/components/molecules/FilterBar";
import { Button } from "../assets/components/atoms/Button";
import { BookCard } from "../assets/components/molecules/BookCard";
import { SeriesCard } from "../assets/components/molecules/SeriesCard";
import { AddBookModal } from "../assets/components/molecules/AddBookModal";
import { TabBar, type TabKey } from "../assets/components/molecules/TabBar";
import type { ReadingStatus } from "../lib/status";
import { SectionHeader } from "../assets/components/atoms/SectionHeader";
import { DetalleLibro } from "../pages/DetalleLibro";
import { DetalleSaga } from "../pages/DetalleSaga";
import { AddSagaModal } from "../assets/components/molecules/AddSagaModal";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableItem } from "../assets/components/atoms/SortableItem";

type LibraryTab = "libros" | "sagas";

export function Estante() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    books,
    isLoading: booksLoading,
    refetch: refetchBooks,
    addBook,
    reorderBook,
  } = useLibraryBooks(user?.id);
  const {
    sagas,
    isLoading: sagasLoading,
    refetch: refetchSagas,
    reorderSaga,
  } = useLibrarySagas(user?.id);

  const [tab, setTab] = useState<LibraryTab>("libros");
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [search, setSearch] = useState("");
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedSagaId, setSelectedSagaId] = useState<string | null>(null);
  const [isAddSagaOpen, setIsAddSagaOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesFilter = filter === "todos" || book.status === filter;
      const matchesSearch =
        !search.trim() ||
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        (book.author ?? "").toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [books, filter, search]);

  const filteredSagas = useMemo(() => {
    return sagas.filter((saga) => {
      const matchesFilter = filter === "todos" || saga.status === filter;
      const matchesSearch =
        !search.trim() ||
        saga.title.toLowerCase().includes(search.toLowerCase()) ||
        (saga.author ?? "").toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sagas, filter, search]);

  function handleTabBarChange(t: TabKey) {
    navigate(`/${t}`);
  }

  function handleTabSwitch(newTab: LibraryTab) {
    setTab(newTab);
    setFilter("todos");
    setIsReordering(false);
  }

  function handleBookDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredBooks.findIndex((b) => b.id === active.id);
    const newIndex = filteredBooks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(filteredBooks, oldIndex, newIndex);
    const droppedIndex = reordered.findIndex((b) => b.id === active.id);
    const beforeId = reordered[droppedIndex - 1]?.id ?? null;
    const afterId = reordered[droppedIndex + 1]?.id ?? null;
    reorderBook(active.id as string, beforeId, afterId);
  }

  function handleSagaDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredSagas.findIndex((s) => s.id === active.id);
    const newIndex = filteredSagas.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(filteredSagas, oldIndex, newIndex);
    const droppedIndex = reordered.findIndex((s) => s.id === active.id);
    const beforeId = reordered[droppedIndex - 1]?.id ?? null;
    const afterId = reordered[droppedIndex + 1]?.id ?? null;
    reorderSaga(active.id as string, beforeId, afterId);
  }

  const isLoading = tab === "libros" ? booksLoading : sagasLoading;
  const count = tab === "libros" ? filteredBooks.length : filteredSagas.length;

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="mt-4 space-y-6">
        <SectionHeader
          title="Tu librería privada"
          rightContent={`${String(count).padStart(3, "0")} ${tab}`}
        />

        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onCameraClick={() => setIsAddBookOpen(true)}
        />

        <SegmentedTabs
          active={tab}
          onChange={handleTabSwitch}
          options={[
            { value: "libros", label: "Libros" },
            { value: "sagas", label: "Sagas" },
          ]}
        />

        <FilterBar value={filter} onChange={setFilter} />

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() =>
              tab === "libros" ? setIsAddBookOpen(true) : setIsAddSagaOpen(true)
            }
          >
            {tab === "libros" ? "Agregar Libro Nuevo" : "Agregar Saga Nueva"}
          </Button>

          {((tab === "libros" && filteredBooks.length > 1) || (tab === "sagas" && filteredSagas.length > 1)) && (
            <button
              onClick={() => setIsReordering((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-body-sm font-body text-surface shrink-0"
              style={{ backgroundColor: "var(--color-state-pending)" }}
            >
              <ArrowUpDown size={15} />
              {isReordering ? "Listo" : "Organizar"}
            </button>
          )}
        </div>

        {isLoading && (
          <p className="text-body-md text-text-secondary text-center">
            Cargando...
          </p>
        )}

        {!isLoading && tab === "libros" && filteredBooks.length === 0 && (
          <p className="text-body-md text-text-secondary text-center">
            No hay libros que coincidan con este filtro.
          </p>
        )}
        {!isLoading && tab === "sagas" && filteredSagas.length === 0 && (
          <p className="text-body-md text-text-secondary text-center">
            No hay sagas que coincidan con este filtro.
          </p>
        )}

        {tab === "libros" && (
          isReordering ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleBookDragEnd}
            >
              <SortableContext
                items={filteredBooks.map((b) => b.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-5">
                  {filteredBooks.map((book) => (
                    <SortableItem key={book.id} id={book.id}>
                      <BookCard
                        title={book.title}
                        author={book.author ?? undefined}
                        coverUrl={book.cover_url ?? undefined}
                        status={book.status as ReadingStatus}
                        isFavorite={book.is_favorite ?? false}
                        onClick={() => setSelectedBookId(book.id)}
                      />
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  author={book.author ?? undefined}
                  coverUrl={book.cover_url ?? undefined}
                  status={book.status as ReadingStatus}
                  isFavorite={book.is_favorite ?? false}
                  onClick={() => setSelectedBookId(book.id)}
                />
              ))}
            </div>
          )
        )}

        {tab === "sagas" && (
          isReordering ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSagaDragEnd}
            >
              <SortableContext
                items={filteredSagas.map((s) => s.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-5">
                  {filteredSagas.map((saga) => (
                    <SortableItem key={saga.id} id={saga.id}>
                      <SeriesCard
                        title={saga.title}
                        author={saga.author ?? undefined}
                        covers={saga.covers}
                        bookCount={saga.bookCount}
                        status={(saga.status ?? "pendiente") as ReadingStatus}
                        isFavorite={saga.is_favorite ?? false}
                        onClick={() => setSelectedSagaId(saga.id)}
                      />
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {filteredSagas.map((saga) => (
                <SeriesCard
                  key={saga.id}
                  title={saga.title}
                  author={saga.author ?? undefined}
                  covers={saga.covers}
                  bookCount={saga.bookCount}
                  status={(saga.status ?? "pendiente") as ReadingStatus}
                  isFavorite={saga.is_favorite ?? false}
                  onClick={() => setSelectedSagaId(saga.id)}
                />
              ))}
            </div>
          )
        )}
      </div>

      <div className="pb-24" />
      <TabBar active="estante" onChange={handleTabBarChange} />

      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        onAdd={addBook}
      />

      {selectedBookId && (
        <DetalleLibro
          bookId={selectedBookId}
          onClose={() => {
            setSelectedBookId(null);
            refetchBooks();
          }}
          onDeleted={() => {
            setSelectedBookId(null);
            refetchBooks();
          }}
        />
      )}
      {selectedSagaId && (
        <DetalleSaga
          sagaId={selectedSagaId}
          onClose={() => {
            setSelectedSagaId(null);
            refetchSagas();
          }}
          onOpenBook={(bookId) => setSelectedBookId(bookId)}
          onDeleted={() => {
            setSelectedSagaId(null);
            refetchSagas();
          }}
        />
      )}

      <AddSagaModal
        isOpen={isAddSagaOpen}
        onClose={() => setIsAddSagaOpen(false)}
        userId={user?.id}
        onAdded={(newSagaId) => {
          refetchSagas();
          setSelectedSagaId(newSagaId);
        }}
      />
    </div>
  );
}