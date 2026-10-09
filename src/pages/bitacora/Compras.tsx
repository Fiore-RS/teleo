import { useMemo, useState } from 'react'
import { Coins, ShoppingBag, CalendarDays, Type, User, Banknote, Library, TrendingUp } from 'lucide-react'
import { usePurchases, type PurchaseBook } from '../../hooks/usePurchases'
import { queryClient } from '../../lib/queryClient'
import { formatCurrency } from '../../lib/currencies'
import { StatTile } from '../../assets/components/atoms/StatTile'
import { MiniCover } from '../../assets/components/atoms/MiniCover'
import { Skeleton, StatTileSkeleton } from '../../assets/components/atoms/Skeleton'
import { Card } from '../../assets/components/molecules/Card'
import { MoreRow } from '../../assets/components/molecules/MoreRow'
import { MONTH_ABBR, MONTH_NAMES } from '../../lib/months'
import { SortMenu, type SortMenuOption } from '../../assets/components/molecules/SortMenu'
import { DetalleLibro } from '../DetalleLibro'

type Filter = 'todos' | 'sin-precio' | 'gratis' | 'regalos'
type Sort = 'precio' | 'fecha' | 'titulo' | 'autor'

const sortOptions: SortMenuOption<Sort>[] = [
  { key: 'precio', label: 'Precio', icon: Banknote },
  { key: 'fecha', label: 'Fecha de compra', icon: CalendarDays },
  { key: 'titulo', label: 'Título', icon: Type },
  { key: 'autor', label: 'Autor', icon: User },
]

const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })

function formatPurchaseDate(value: string | null) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return dateFormat.format(new Date(y, m - 1, d))
}

/** "4 oct", para las filas dentro de un mes (el mes y el año ya van en el título del grupo). */
function shortDay(value: string | null) {
  if (!value) return null
  const [, m, d] = value.split('-').map(Number)
  return `${d} ${MONTH_ABBR[m - 1]}`
}

/** Agrupa por mes de compra, del más reciente al más antiguo; los que no tienen fecha van
 *  al final en "Sin fecha". Dentro de cada mes se respeta el orden que ya traen. */
function groupByMonth(books: PurchaseBook[]) {
  const groups = new Map<string, PurchaseBook[]>()
  for (const b of books) {
    const key = b.purchaseDate ? b.purchaseDate.slice(0, 7) : 'sin-fecha'
    groups.set(key, [...(groups.get(key) ?? []), b])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === 'sin-fecha' ? 1 : b === 'sin-fecha' ? -1 : b.localeCompare(a)))
    .map(([key, items]) => ({
      key,
      label: key === 'sin-fecha' ? 'Sin fecha' : `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
      items,
    }))
}

function sumPrices(books: PurchaseBook[]) {
  return books.reduce((sum, b) => sum + (b.price ?? 0), 0)
}

function sortBooks(books: PurchaseBook[], sort: Sort) {
  const byTitle = (a: PurchaseBook, b: PurchaseBook) => a.title.localeCompare(b.title, 'es')
  return [...books].sort((a, b) => {
    if (sort === 'precio') {
      // Más caros primero; los sin precio al final.
      if (a.price == null || b.price == null) return a.price == null ? (b.price == null ? byTitle(a, b) : 1) : -1
      return b.price - a.price || byTitle(a, b)
    }
    if (sort === 'fecha') {
      // Compras más recientes primero; sin fecha al final.
      if (!a.purchaseDate || !b.purchaseDate) return !a.purchaseDate ? (!b.purchaseDate ? byTitle(a, b) : 1) : -1
      return b.purchaseDate.localeCompare(a.purchaseDate) || byTitle(a, b)
    }
    if (sort === 'autor') return (a.author ?? '').localeCompare(b.author ?? '', 'es') || byTitle(a, b)
    return byTitle(a, b)
  })
}

interface ComprasProps {
  userId: string | undefined
  currency: string | null | undefined
}

/** Bitácora > Compras (fase 6; V.3.0.0): el total con una barra por estado, lo que costaría
 *  completar los deseados aparte, el dato curioso plegado y la lista de tus libros agrupada
 *  por mes de compra (al ordenar por fecha) con su precio. Los deseados no cuentan como compra: solo suman en "Completar deseados".
 *  Tocar un libro abre su detalle, donde se agrega o cambia el precio. */
export function Compras({ userId, currency }: ComprasProps) {
  const { books, isLoading } = usePurchases(userId)
  const [filter, setFilter] = useState<Filter>('todos')
  const [sort, setSort] = useState<Sort>('fecha')
  const [isCuriousOpen, setIsCuriousOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)

  const summary = useMemo(() => {
    const owned = books.filter((b) => b.status !== 'deseado')
    const withPrice = owned.filter((b) => b.price != null)
    const paid = withPrice.filter((b) => (b.price ?? 0) > 0)
    const invested = sumPrices(withPrice)
    const mostExpensive = paid.length > 0 ? paid.reduce((max, b) => (b.price! > max.price! ? b : max)) : null
    const cheapest = paid.length > 0 ? paid.reduce((min, b) => (b.price! < min.price! ? b : min)) : null
    const inStatus = (status: PurchaseBook['status']) => books.filter((b) => b.status === status && b.price != null)
    return {
      owned,
      withPrice,
      invested,
      finished: sumPrices(inStatus('terminado')),
      pending: sumPrices(inStatus('pendiente')),
      wishlist: sumPrices(inStatus('deseado')),
      wishlistWithPrice: inStatus('deseado').length,
      abandoned: sumPrices(inStatus('abandonado')),
      mostExpensive,
      cheapest,
    }
  }, [books])

  const byStatus = [
    { label: 'en terminados', amount: summary.finished, color: 'var(--color-accent-finished)' },
    { label: 'en pendientes', amount: summary.pending, color: 'var(--color-state-pending)' },
    { label: 'en abandonados', amount: summary.abandoned, color: 'var(--color-state-abandoned)' },
  ]

  const counts = {
    todos: summary.owned.length,
    'sin-precio': summary.owned.filter((b) => b.price == null).length,
    gratis: summary.owned.filter((b) => b.price === 0 && !b.isGift).length,
    regalos: summary.owned.filter((b) => b.isGift).length,
  }

  const visibleBooks = useMemo(() => {
    const filtered = summary.owned.filter((b) =>
      filter === 'sin-precio'
        ? b.price == null
        : filter === 'gratis'
          ? b.price === 0 && !b.isGift
          : filter === 'regalos'
            ? b.isGift
            : true
    )
    return sortBooks(filtered, sort)
  }, [summary.owned, filter, sort])

  const money = (amount: number) => formatCurrency(amount, currency)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5" aria-label="Cargando">
        <div className="bg-surface border border-border rounded-card shadow-card p-[18px]">
          <Skeleton className="h-3.5 w-2/5 rounded-full mb-4" />
          <Skeleton className="h-10 w-3/5 rounded-full" />
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            {[0, 1, 2, 3].map((i) => <StatTileSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  const filterChips: { key: Filter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'sin-precio', label: 'Sin precio' },
    { key: 'gratis', label: 'Gratis' },
    { key: 'regalos', label: 'Regalos' },
  ]

  return (
    <>
      <div className="flex flex-col gap-5 stagger-children">
        {/* Total invertido */}
        <Card tab={{ label: 'Total invertido', icon: Coins }} tone="magenta">
          <p className="font-display font-semibold text-[36px] leading-none text-text tabular-nums break-words">{money(summary.invested)}</p>
          <p className="text-body-md text-text-secondary mt-2">
            en {summary.withPrice.length} de {summary.owned.length} {summary.owned.length === 1 ? 'libro' : 'libros'} con precio
          </p>

          {summary.invested > 0 && (
            <div className="flex h-4 gap-[3px] rounded-full overflow-hidden mt-3.5" aria-hidden="true">
              {byStatus.filter((s) => s.amount > 0).map((s) => (
                <i key={s.label} style={{ flex: s.amount, background: s.color }} />
              ))}
            </div>
          )}
          <ul className="flex flex-col gap-2.5 mt-3.5">
            {byStatus.map((s) => (
              <li key={s.label} className="flex items-baseline gap-2 text-body-md text-text-secondary">
                <i aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] shrink-0 self-center" style={{ background: s.color }} />
                <b className="font-display font-semibold text-[20px] text-text tabular-nums">{money(s.amount)}</b>
                {s.label}
              </li>
            ))}
          </ul>

          {summary.wishlistWithPrice > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-2 mt-3 pt-3 border-t border-dashed border-border text-body-md text-text-secondary">
              <i aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] border-2 border-accent-wishlist shrink-0 self-center" />
              <b className="font-display font-semibold text-[20px] text-text tabular-nums">{money(summary.wishlist)}</b>
              en deseados
              <span className="basis-full pl-[18px] text-[12px] text-text-muted">por comprar, no suma al total</span>
            </div>
          )}
          <p className="text-[12px] text-text-muted text-center mt-4">Puedes cambiar la moneda en Configuración.</p>
        </Card>

        {/* Dato curioso, plegado */}
        {summary.mostExpensive && summary.cheapest && (
          <Card tab={{ label: 'Dato curioso', icon: Library }} padding="px-4 py-1">
            <div>
              <MoreRow
                id="compras-curioso"
                tone="orange"
                icon={TrendingUp}
                title="El más caro y el más barato"
                summary={`De ${money(summary.mostExpensive.price!)} a ${money(summary.cheapest.price!)}`}
                isOpen={isCuriousOpen}
                onToggle={() => setIsCuriousOpen((o) => !o)}
              >
                <div className="grid grid-cols-1 gap-2.5">
                  <StatTile label="El más caro" value={`${summary.mostExpensive.title} (${money(summary.mostExpensive.price!)})`} />
                  <StatTile label="El más barato" value={`${summary.cheapest.title} (${money(summary.cheapest.price!)})`} />
                </div>
              </MoreRow>
            </div>
          </Card>
        )}

        {/* Lista */}
        <Card
          tab={{ label: 'Tus libros', icon: ShoppingBag }}
          tone="pink"
          action={<SortMenu variant="bar" className="-mt-1" options={sortOptions} activeKey={sort} onSelect={setSort} />}
        >
          {/* Filtros en una sola fila que se desliza de lado. */}
          <div
            className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-[18px] px-[18px] mb-2.5"
            role="radiogroup"
            aria-label="Filtrar libros"
          >
            {filterChips.map(({ key, label }) => {
              const isActive = filter === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setFilter(key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-body border transition-colors focus-visible:outline-2 focus-visible:outline-primary-text ${
                    isActive ? 'bg-primary border-primary text-primary-ink font-bold' : 'bg-surface-2 border-border text-text-secondary font-semibold'
                  }`}
                >
                  {label}
                  <small className="ml-[3px] text-[13px] opacity-80 tabular-nums">{counts[key]}</small>
                </button>
              )
            })}
          </div>

          {filter === 'sin-precio' && counts['sin-precio'] > 0 && (
            <p className="text-body-sm text-text-secondary mb-1">Toca un libro para agregarle el precio.</p>
          )}

          {visibleBooks.length === 0 ? (
            <p className="text-body-md text-text-secondary mt-2">
              {filter === 'sin-precio'
                ? 'Todos tus libros tienen precio.'
                : filter === 'gratis'
                  ? 'No tienes libros marcados como gratis. Pon el precio en 0 para marcarlo.'
                  : filter === 'regalos'
                    ? 'No tienes libros marcados como regalo. Márcalo al editar el libro.'
                    : 'Todavía no tienes libros.'}
            </p>
          ) : sort === 'fecha' ? (
            groupByMonth(visibleBooks).map((group) => (
              <section key={group.key} aria-label={group.label}>
                <div className="flex justify-between gap-2 pt-3 pb-1 border-b border-border text-[12.5px] font-bold text-text-secondary">
                  <span>{group.label}</span>
                  <span className="tabular-nums">{money(sumPrices(group.items.filter((b) => !b.isGift)))}</span>
                </div>
                <ul>
                  {group.items.map((book) => (
                    <PurchaseRow key={book.id} book={book} detail={shortDay(book.purchaseDate)} money={money} onOpen={setSelectedBookId} />
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <ul>
              {visibleBooks.map((book) => (
                <PurchaseRow key={book.id} book={book} detail={formatPurchaseDate(book.purchaseDate)} money={money} onOpen={setSelectedBookId} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {selectedBookId && (
        <DetalleLibro
          bookId={selectedBookId}
          onClose={() => {
            setSelectedBookId(null)
            queryClient.invalidateQueries({ queryKey: ['purchases', userId] })
          }}
          onDeleted={() => {
            setSelectedBookId(null)
            queryClient.invalidateQueries()
          }}
        />
      )}
    </>
  )
}

/** Una compra en la lista: portada, título, autor con la fecha (o quién lo regaló) y el precio. */
function PurchaseRow({ book, detail, money, onOpen }: {
  book: PurchaseBook
  detail: string | null
  money: (amount: number) => string
  onOpen: (bookId: string) => void
}) {
  return (
    <li className="border-t border-dashed border-border first:border-t-0">
      <button
        type="button"
        onClick={() => onOpen(book.id)}
        className="w-full grid grid-cols-[38px_1fr_auto] items-center gap-2.5 py-[9px] text-left rounded-xl focus-visible:outline-2 focus-visible:outline-primary-text"
      >
        <MiniCover src={book.coverUrl} title={book.title} className="w-[38px] rounded-[5px]!" />
        <span className="min-w-0">
          <span className="block font-display font-semibold text-[15px] leading-[1.2] text-text truncate">{book.title}</span>
          <span className="block text-[12.5px] text-text-secondary truncate">
            {[book.author, book.isGift ? (book.giftFrom ? `Regalo de ${book.giftFrom}` : 'Regalo') : detail].filter(Boolean).join(' · ') || ' '}
          </span>
        </span>
        <span
          className={`shrink-0 tabular-nums ${
            book.isGift
              ? 'text-body-md font-bold text-magenta-text'
              : book.price == null
                ? 'text-[12.5px] font-semibold text-text-muted'
                : 'text-body-md font-bold text-text'
          }`}
        >
          {book.isGift ? 'Regalo' : book.price == null ? 'Sin precio' : book.price === 0 ? 'Gratis' : money(book.price)}
        </span>
      </button>
    </li>
  )
}
