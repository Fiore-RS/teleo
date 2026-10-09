import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDownAZ, User, CalendarDays, Move, SlidersHorizontal, X, Shuffle, LayoutGrid } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLibraryBooks } from "../hooks/useLibraryBooks";
import { useLibrarySagas } from "../hooks/useLibrarySagas";
import { useProfile } from "../hooks/useProfile";
import { getPriorityListName } from "../lib/priorityList";
import { ScreenHeader, HeaderBarButton } from "../assets/components/molecules/ScreenHeader";
import { BookTileSkeleton } from "../assets/components/atoms/Skeleton";
import { FilterModal } from "../assets/components/molecules/FilterModal";
import { defaultAdvancedFilters, type AdvancedFilters } from "../lib/advancedFilters";
import { BookCover } from "../assets/components/molecules/BookCover";
import { SagaCover } from "../assets/components/molecules/SagaCover";
import { Shelf } from "../assets/components/molecules/Shelf";
import { ShelfViewSheet } from "../assets/components/molecules/ShelfViewSheet";
import { shelfViewFromProfile, shelfViewToProfile, type ShelfView } from "../lib/shelfView";
import { AddBookModal } from "../assets/components/molecules/AddBookModal";
import { TabBar, type TabKey } from "../assets/components/molecules/TabBar";
import { Fab } from "../assets/components/atoms/Fab";
import type { ReadingStatus } from "../lib/status";
import { DetalleLibro } from "../pages/DetalleLibro";
import { DetalleSaga } from "../pages/DetalleSaga";
import { AddSagaModal } from "../assets/components/molecules/AddSagaModal";
import { RandomPickSheet } from "../assets/components/molecules/RandomPickSheet";
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
import { sortByMode, getStoredSortMode, setStoredSortMode, type LibrarySortMode } from "../lib/librarySort";
import { languageOptionsFrom, normalizeLanguage } from "../lib/languages";
import { computeSagaCategories } from "../lib/sagaStatus";

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
  const { profile, updateProfile } = useProfile(user?.id);
  // Vista del estante (V.3.0.0): sale del perfil; al cambiarla se aplica al instante y se
  // guarda en la cuenta.
  const [viewOverride, setViewOverride] = useState<ShelfView | null>(null);
  const shelfView = viewOverride ?? shelfViewFromProfile(profile);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  function changeShelfView(view: ShelfView) {
    setViewOverride(view);
    updateProfile(shelfViewToProfile(view));
  }
  const priorityListName = getPriorityListName(profile?.priority_list_name);

  // Se puede llegar desde "Ver todos" en Perfil con un filtro ya activado, ej.
  // /estante?filtro=deseado o /estante?filtro=favoritos. Se lee una sola vez al entrar y los
  // filtros arrancan ya puestos (antes se ponían en un efecto, con un render de más).
  const [initialFiltro] = useState(() => searchParams.get("filtro"));
  const initialQuickFlag =
    initialFiltro === "favoritos" || initialFiltro === "recomendados" || initialFiltro === "temporada"
      ? initialFiltro
      : null;

  const [tab, setTab] = useState<LibraryTab>("libros");
  const [advFilters, setAdvFilters] = useState<AdvancedFilters>(() =>
    initialFiltro && !initialQuickFlag
      ? { ...defaultAdvancedFilters, status: initialFiltro as AdvancedFilters["status"] }
      : defaultAdvancedFilters
  );
  const [quickFlag, setQuickFlag] = useState<"favoritos" | "recomendados" | "temporada" | null>(initialQuickFlag);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isRandomPickOpen, setIsRandomPickOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedSagaId, setSelectedSagaId] = useState<string | null>(null);
  const [isAddSagaOpen, setIsAddSagaOpen] = useState(false);
  // Se incrementa cada vez que se cierra el detalle de un libro, para avisarle a la saga
  // que pueda estar abierta detras (DetalleSaga) que su estado puede haber cambiado y
  // tiene que refetchear (su propio useSaga no se entera solo, ya que vive en un
  // componente separado del modal de libro).
  const [bookChangeSignal, setBookChangeSignal] = useState(0);
  // Un modo de orden y un estado de "arrastrando" separados por pestaña (libros/sagas), ya
  // que cada una tiene su propio orden persistido (estante_sort_order de cada tabla) y no
  // tiene sentido que activar el drag en una afecte a la otra. El modo elegido (título/autor/
  // fecha/libre) se guarda en localStorage para que no se reinicie al refrescar la página;
  // el estado de "arrastrando" en sí no se guarda, ese siempre arranca apagado.
  const [bookSortMode, setBookSortModeState] = useState<LibrarySortMode>(() =>
    getStoredSortMode("estante-libros")
  );
  const [sagaSortMode, setSagaSortModeState] = useState<LibrarySortMode>(() =>
    getStoredSortMode("estante-sagas")
  );
  const [isReorderingBooks, setIsReorderingBooks] = useState(false);
  const [isReorderingSagas, setIsReorderingSagas] = useState(false);

  function setBookSortMode(mode: LibrarySortMode) {
    setBookSortModeState(mode);
    setStoredSortMode("estante-libros", mode);
  }

  function setSagaSortMode(mode: LibrarySortMode) {
    setSagaSortModeState(mode);
    setStoredSortMode("estante-sagas", mode);
  }

  // Ya aplicado el filtro de la URL, se limpia para que no vuelva a aplicarse al recargar.
  useEffect(() => {
    if (initialFiltro) setSearchParams({}, { replace: true });
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

  // Menú de idioma del filtro: Español, Inglés y los idiomas que ya tengan los libros.
  const languageOptions = useMemo(() => languageOptionsFrom(books.map((b) => b.language)), [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesFilter = advFilters.status === "todos" || book.status === advFilters.status;
      const matchesLanguage =
        advFilters.language === "todos" || normalizeLanguage(book.language) === advFilters.language;
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
      const matchesCategory =
        advFilters.category === "todos" ||
        computeSagaCategories(
          books.filter((b) => b.saga_id === saga.id).map((b) => b.category),
          saga.category,
        ).includes(advFilters.category);
      const matchesSearch =
        !search.trim() ||
        saga.title.toLowerCase().includes(search.toLowerCase()) ||
        (saga.author ?? "").toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [sagas, books, advFilters, search]);

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

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <ScreenHeader
        title="Estante"
        tabsLabel="Libros o sagas"
        tabs={[
          { value: "libros", label: "Libros", count: booksLoading ? undefined : filteredBooks.length },
          { value: "sagas", label: "Sagas", count: sagasLoading ? undefined : filteredSagas.length },
        ]}
        active={tab}
        onTabChange={handleTabSwitch}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Buscar por título o autor",
          actions: (
            <>
              <HeaderBarButton label="Filtros" onClick={() => setIsFilterModalOpen(true)} dot={hasActiveAdvFilters}>
                <SlidersHorizontal size={18} />
              </HeaderBarButton>
              <HeaderBarButton label="Vista del estante" onClick={() => setIsViewSheetOpen(true)}>
                <LayoutGrid size={18} />
              </HeaderBarButton>
              {tab === "libros" ? (
                <SortMenu variant="bar" options={bookSortOptions} activeKey={bookSortMode} onSelect={handleBookSortSelect} />
              ) : (
                <SortMenu variant="bar" options={sagaSortOptions} activeKey={sagaSortMode} onSelect={handleSagaSortSelect} />
              )}
            </>
          ),
        }}
        tabsEnd={
          tab === "libros" && (
            <button
              type="button"
              onClick={() => setIsRandomPickOpen(true)}
              className="inline-flex items-center gap-1.5 font-body text-[13px] font-bold text-primary-text rounded-full focus-visible:outline-2 focus-visible:outline-primary-text"
            >
              <Shuffle size={14} aria-hidden="true" />
              ¿Qué leo ahora?
            </button>
          )
        }
      />

      <div className="space-y-5">
        {quickFlag && (
          <div className="flex">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary-text pl-3.5 pr-2 py-1.5 text-body-sm font-body font-semibold">
              Mostrando:{" "}
              {quickFlag === "favoritos"
                ? "Favoritos"
                : quickFlag === "recomendados"
                  ? "Recomendados"
                  : priorityListName}
              <button
                onClick={() => setQuickFlag(null)}
                aria-label="Quitar filtro"
                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-surface/60"
              >
                <X size={14} />
              </button>
            </span>
          </div>
        )}

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

        {isLoading && (
          <div
            className="grid gap-x-3 gap-y-4"
            style={{ gridTemplateColumns: `repeat(${shelfView.columns}, minmax(0, 1fr))` }}
            aria-label="Cargando"
          >
            {Array.from({ length: shelfView.columns * 3 }, (_, i) => (
              <BookTileSkeleton key={i} />
            ))}
          </div>
        )}
        {tab === "libros" && !isLoading && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBookDragEnd}>
            <SortableContext items={isReorderingBooks ? sortedBooks.map((b) => b.id) : []} strategy={rectSortingStrategy}>
              <Shelf
                className="stagger-children"
                perRow={shelfView.columns}
                showNames={shelfView.showNames}
                planks={shelfView.planks}
                items={sortedBooks.map((book) => ({
                  key: book.id,
                  title: book.title,
                  subtitle: book.author ?? undefined,
                  onClick: () => setSelectedBookId(book.id),
                  cover: (
                    <BookCover
                      title={book.title}
                      coverUrl={book.cover_url ?? undefined}
                      status={book.status as ReadingStatus}
                      isFavorite={book.is_favorite ?? false}
                      small={shelfView.columns === 4}
                    />
                  ),
                }))}
                wrap={
                  isReorderingBooks
                    ? (item, cell) => (
                        <SortableItem id={item.key} className="h-full">
                          {cell}
                        </SortableItem>
                      )
                    : undefined
                }
              />
            </SortableContext>
          </DndContext>
        )}

        {tab === "sagas" && !isLoading && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSagaDragEnd}>
            <SortableContext items={isReorderingSagas ? sortedSagas.map((s) => s.id) : []} strategy={rectSortingStrategy}>
              <Shelf
                className="stagger-children"
                perRow={shelfView.columns}
                showNames={shelfView.showNames}
                planks={shelfView.planks}
                items={sortedSagas.map((saga) => ({
                  key: saga.id,
                  title: saga.title,
                  subtitle: saga.author ?? undefined,
                  onClick: () => setSelectedSagaId(saga.id),
                  cover: (
                    <SagaCover
                      title={saga.title}
                      covers={saga.covers}
                      bookCount={saga.bookCount}
                      status={(saga.status ?? "pendiente") as ReadingStatus}
                      isFavorite={saga.is_favorite ?? false}
                      small={shelfView.columns === 4}
                    />
                  ),
                }))}
                wrap={
                  isReorderingSagas
                    ? (item, cell) => (
                        <SortableItem id={item.key} className="h-full">
                          {cell}
                        </SortableItem>
                      )
                    : undefined
                }
              />
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="pb-24" />
      <Fab
        label={tab === "libros" ? "Agregar libro" : "Agregar saga"}
        onClick={() => (tab === "libros" ? setIsAddBookOpen(true) : setIsAddSagaOpen(true))}
      />
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
          refreshSignal={bookChangeSignal}
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
            refetchSagas();
            setBookChangeSignal((n) => n + 1);
          }}
          onDeleted={() => {
            setSelectedBookId(null);
            refetchBooks();
            refetchSagas();
            setBookChangeSignal((n) => n + 1);
          }}
        />
      )}

      {isRandomPickOpen && <RandomPickSheet userId={user?.id} onClose={() => setIsRandomPickOpen(false)} />}

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

      {isViewSheetOpen && (
        <ShelfViewSheet view={shelfView} onChange={changeShelfView} onClose={() => setIsViewSheetOpen(false)} />
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        tab={tab}
        value={advFilters}
        languageOptions={languageOptions}
        onApply={(filters) => {
          setAdvFilters(filters);
          setQuickFlag(null);
        }}
      />
    </div>
  );
}