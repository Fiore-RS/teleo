import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDownAZ, User, CalendarDays, Move, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLibraryBooks } from "../hooks/useLibraryBooks";
import { useLibrarySagas } from "../hooks/useLibrarySagas";
import { useProfile } from "../hooks/useProfile";
import { getPriorityListName } from "../lib/priorityList";
import { SearchBar } from "../assets/components/molecules/SearchBar";
import { SegmentedTabs } from "../assets/components/atoms/SegmentedTabs";
import {
  FilterModal,
  defaultAdvancedFilters,
  type AdvancedFilters,
} from "../assets/components/molecules/FilterModal";
import { Button } from "../assets/components/atoms/Button";
import { BookCard } from "../assets/components/molecules/BookCard";
import { SeriesCard } from "../assets/components/molecules/SeriesCard";
import { AddBookModal } from "../assets/components/molecules/AddBookModal";
import { TabBar, type TabKey } from "../assets/components/molecules/TabBar";
import { ScrollToTopButton } from "../assets/components/atoms/ScrollToTopButton";
import type { ReadingStatus } from "../lib/status";
import { SectionHeader } from "../assets/components/atoms/SectionHeader";
import { DetalleLibro } from "../pages/DetalleLibro";
import { DetalleSaga } from "../pages/DetalleSaga";
import { AddSagaModal } from "../assets/components/molecules/AddSagaModal";
import {
  DndContext,
  closestCenter,
  PointerSensor,
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
import { SortMenu, type SortMenuOption } from "../assets/components/molecules/SortMenu";
import { sortByMode, type LibrarySortMode } from "../lib/librarySort";

type LibraryTab = "libros" | "sagas";

export function Estante() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const { profile } = useProfile(user?.id);
  const priorityListName = getPriorityListName(profile?.priority_list_name);

  const [tab, setTab] = useState<LibraryTab>("libros");
  const [advFilters, setAdvFilters] = useState<AdvancedFilters>(defaultAdvancedFilters);
  const [quickFlag, setQuickFlag] = useState<"favoritos" | "recomendados" | "temporada" | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedSagaId, setSelectedSagaId] = useState<string | null>(null);
  const [isAddSagaOpen, setIsAddSagaOpen] = useState(false);
  // Un modo de orden y un estado de "arrastrando" separados por pestaña (libros/sagas), ya
  // que cada una tiene su propio orden persistido (estante_sort_order de cada tabla) y no
  // tiene sentido que activar el drag en una afecte a la otra.
  const [bookSortMode, setBookSortMode] = useState<LibrarySortMode>("libre");
  const [sagaSortMode, setSagaSortMode] = useState<LibrarySortMode>("libre");
  const [isReorderingBooks, setIsReorderingBooks] = useState(false);
  const [isReorderingSagas, setIsReorderingSagas] = useState(false);

  // Soporta llegar desde "Ver todos" en Perfil con un filtro ya activado,
  // ej. /estante?filtro=deseado o /estante?filtro=favoritos
  useEffect(() => {
    const filtro = searchParams.get("filtro");
    if (!filtro) return;

    setTab("libros");
    if (filtro === "favoritos" || filtro === "recomendados" || filtro === "temporada") {
      setQuickFlag(filtro);
      setAdvFilters(defaultAdvancedFilters);
    } else {
      setQuickFlag(null);
      setAdvFilters({ ...defaultAdvancedFilters, status: filtro as AdvancedFilters["status"] });
    }
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Activación por "mantener presionado" (delay) en vez de por distancia: así un gesto
  // normal de scroll (que mueve rápido) no dispara el drag, y solo se arma cuando el dedo
  // se mantiene quieto sobre una tarjeta unos instantes. Un solo PointerSensor cubre mouse
  // y touch — usar además un TouchSensor por separado generaba conflictos entre ambos.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const hasActiveAdvFilters =
    advFilters.status !== "todos" ||
    advFilters.language !== "todos" ||
    advFilters.category !== "todos" ||
    advFilters.format !== "todos";

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesFilter = advFilters.status === "todos" || book.status === advFilters.status;
      const matchesLanguage =
        advFilters.language === "todos" || (book.language ?? "").toLowerCase() === advFilters.language;
      const matchesCategory = advFilters.category === "todos" || book.category === advFilters.category;
      const matchesFormat = advFilters.format === "todos" || book.format === advFilters.format;
      const matchesQuickFlag =
        !quickFlag ||
        (quickFlag === "favoritos"
          ? book.is_favorite
          : quickFlag === "recomendados"
            ? book.is_recommended
            : book.is_priority);
      const matchesSearch =
        !search.trim() ||
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        (book.author ?? "").toLowerCase().includes(search.toLowerCase());
      return (
        matchesFilter && matchesLanguage && matchesCategory && matchesFormat && matchesQuickFlag && matchesSearch
      );
    });
  }, [books, advFilters, quickFlag, search]);

  const filteredSagas = useMemo(() => {
    return sagas.filter((saga) => {
      const matchesFilter = advFilters.status === "todos" || saga.status === advFilters.status;
      const matchesCategory = advFilters.category === "todos" || saga.category === advFilters.category;
      const matchesSearch =
        !search.trim() ||
        saga.title.toLowerCase().includes(search.toLowerCase()) ||
        (saga.author ?? "").toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [sagas, advFilters, search]);

  // Los tres modos de solo-vista (título/autor/fecha) se calculan encima de lo ya filtrado;
  // "libre" devuelve el mismo array, que ya viene en su orden persistido (estante_sort_order).
  const sortedBooks = useMemo(
    () =>
      sortByMode(filteredBooks, bookSortMode, {
        title: (b) => b.title,
        author: (b) => b.author,
        createdAt: (b) => b.created_at,
      }),
    [filteredBooks, bookSortMode]
  );
  const sortedSagas = useMemo(
    () =>
      sortByMode(filteredSagas, sagaSortMode, {
        title: (s) => s.title,
        author: (s) => s.author,
        createdAt: (s) => s.created_at,
      }),
    [filteredSagas, sagaSortMode]
  );

  const bookSortOptions: SortMenuOption<LibrarySortMode>[] = [
    { key: "titulo", label: "Título", icon: ArrowDownAZ },
    { key: "autor", label: "Autor", icon: User },
    { key: "fecha", label: "Fecha agregado", icon: CalendarDays },
    { key: "libre", label: isReorderingBooks ? "Listo" : "Libre (arrastrar)", icon: Move },
  ];
  const sagaSortOptions: SortMenuOption<LibrarySortMode>[] = [
    { key: "titulo", label: "Título", icon: ArrowDownAZ },
    { key: "autor", label: "Autor", icon: User },
    { key: "fecha", label: "Fecha agregado", icon: CalendarDays },
    { key: "libre", label: isReorderingSagas ? "Listo" : "Libre (arrastrar)", icon: Move },
  ];

  // Elegir "Libre" activa el modo de arrastrar de una vez (si no se estaba ya en ese modo);
  // si ya se estaba en "libre", vuelve a elegirlo desde el menú funciona como "Listo" —
  // apaga el arrastre sin perder el orden manual. Elegir cualquiera de los otros tres
  // siempre apaga el arrastre, porque no tiene sentido arrastrar sobre una vista ordenada
  // alfabéticamente o por fecha.
  function handleBookSortSelect(mode: LibrarySortMode) {
    if (mode === "libre") {
      if (bookSortMode === "libre") {
        setIsReorderingBooks((v) => !v);
      } else {
        setBookSortMode("libre");
        setIsReorderingBooks(true);
      }
    } else {
      setBookSortMode(mode);
      setIsReorderingBooks(false);
    }
  }

  function handleSagaSortSelect(mode: LibrarySortMode) {
    if (mode === "libre") {
      if (sagaSortMode === "libre") {
        setIsReorderingSagas((v) => !v);
      } else {
        setSagaSortMode("libre");
        setIsReorderingSagas(true);
      }
    } else {
      setSagaSortMode(mode);
      setIsReorderingSagas(false);
    }
  }

  function handleTabBarChange(t: TabKey) {
    navigate(`/${t}`);
  }

  function handleTabSwitch(newTab: LibraryTab) {
    setTab(newTab);
    setAdvFilters(defaultAdvancedFilters);
    setQuickFlag(null);
  }

  function handleBookDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedBooks.findIndex((b) => b.id === active.id);
    const newIndex = sortedBooks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(sortedBooks, oldIndex, newIndex);
    const droppedIndex = reordered.findIndex((b) => b.id === active.id);
    const beforeId = reordered[droppedIndex - 1]?.id ?? null;
    const afterId = reordered[droppedIndex + 1]?.id ?? null;
    reorderBook(active.id as string, beforeId, afterId);
  }

  function handleSagaDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedSagas.findIndex((s) => s.id === active.id);
    const newIndex = sortedSagas.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sortedSagas, oldIndex, newIndex);
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

        {quickFlag && (
          <div className="flex items-center justify-between bg-bg border border-border rounded-xl px-4 py-2">
            <span className="text-body-sm text-text">
              Mostrando:{" "}
              {quickFlag === "favoritos"
                ? "Favoritos"
                : quickFlag === "recomendados"
                  ? "Recomendados"
                  : priorityListName}
            </span>
            <button onClick={() => setQuickFlag(null)} aria-label="Quitar filtro" className="text-text-secondary">
              <X size={16} />
            </button>
          </div>
        )}

        <Button
          variant="primary"
          onClick={() =>
            tab === "libros" ? setIsAddBookOpen(true) : setIsAddSagaOpen(true)
          }
        >
          {tab === "libros" ? "Agregar Libro Nuevo" : "Agregar Saga Nueva"}
        </Button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Filtros"
            className="relative flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-body-sm font-body text-surface"
            style={{ backgroundColor: "var(--color-state-pending)" }}
          >
            <SlidersHorizontal size={15} />
            Filtros
            {hasActiveAdvFilters && (
              <span className="absolute top-1.5 right-3 w-2.5 h-2.5 rounded-full bg-accent-reading border-2 border-bg" />
            )}
          </button>

          {tab === "libros" ? (
            <SortMenu options={bookSortOptions} activeKey={bookSortMode} onSelect={handleBookSortSelect} className="flex-1" />
          ) : (
            <SortMenu options={sagaSortOptions} activeKey={sagaSortMode} onSelect={handleSagaSortSelect} className="flex-1" />
          )}
        </div>

        {((tab === "libros" && isReorderingBooks) || (tab === "sagas" && isReorderingSagas)) && (
          <p className="text-body-sm text-text-secondary text-center">
            Mantén presionado unos instantes para arrastrar y organizar tu estante a tu gusto.
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
          isReorderingBooks ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleBookDragEnd}
            >
              <SortableContext
                items={sortedBooks.map((b) => b.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-3 gap-3">
                  {sortedBooks.map((book) => (
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
            <div className="grid grid-cols-3 gap-3">
              {sortedBooks.map((book) => (
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
          isReorderingSagas ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSagaDragEnd}
            >
              <SortableContext
                items={sortedSagas.map((s) => s.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-3 gap-3">
                  {sortedSagas.map((saga) => (
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
            <div className="grid grid-cols-3 gap-3">
              {sortedSagas.map((saga) => (
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
      <ScrollToTopButton />
      <TabBar active="estante" onChange={handleTabBarChange} />

      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        userId={user?.id}
        onAdd={addBook}
      />

      {/* DetalleSaga va ANTES que DetalleLibro a propósito: ambos son overlays "fixed
          inset-0 z-50", y con el mismo z-index gana el que aparece más abajo en el DOM. Se
          puede abrir un libro DESDE dentro de una saga (onOpenBook), así que el modal del
          libro siempre debe quedar por encima del de la saga cuando los dos están abiertos a
          la vez. */}
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

      <AddSagaModal
        isOpen={isAddSagaOpen}
        onClose={() => setIsAddSagaOpen(false)}
        userId={user?.id}
        existingSagas={sagas}
        onAdded={(newSagaId) => {
          refetchSagas();
          setSelectedSagaId(newSagaId);
        }}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        tab={tab}
        value={advFilters}
        onApply={(filters) => {
          setAdvFilters(filters);
          setQuickFlag(null);
        }}
      />
    </div>
  );
}