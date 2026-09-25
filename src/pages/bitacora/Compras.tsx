import { useMemo, useState } from 'react'
import { Coins, ShoppingBag, CalendarDays, Type, User, Banknote } from 'lucide-react'
import { usePurchases, type PurchaseBook } from '../../hooks/usePurchases'
import { queryClient } from '../../lib/queryClient'
import { formatCurrency } from '../../lib/currencies'
import { StatTile } from '../../assets/components/atoms/StatTile'
import { Eyebrow } from '../../assets/components/atoms/Eyebrow'
import { MiniCover } from '../../assets/components/atoms/MiniCover'
import { Skeleton, StatTileSkeleton } from '../../assets/components/atoms/Skeleton'
import { Card } from '../../assets/components/molecules/Card'
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

/** Bitácora > Compras (fase 6): cuánto invertiste en tu biblioteca y la lista de tus libros
 *  con su precio. Los deseados no cuentan como compra: solo suman en "Completar deseados".
 *  Tocar un libro abre su detalle, donde se agrega o cambia el precio. */
export function Compras({ userId, currency }: ComprasProps) {
  const { books, isLoading } = usePurchases(userId)
  const [filter, setFilter] = useState<Filter>('todos')
  const [sort, setSort] = useState<Sort>('precio')
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
      avg: withPrice.length > 0 ? invested / withPrice.length : 0,
      pending: sumPrices(inStatus('pendiente')),
      wishlist: sumPrices(inStatus('deseado')),
      wishlistWithPrice: inStatus('deseado').length,
      abandoned: sumPrices(inStatus('abandonado')),
      mostExpensive,
      cheapest,
    }
  }, [books])

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
        <Card labelledBy="compras-total" tint="magenta">
          <Eyebrow id="compras-total" icon={Coins} tone="magenta" className="mb-3">Total invertido</Eyebrow>
          <p className="font-display font-semibold text-[36px] leading-none text-text tabular-nums break-words">{money(summary.invested)}</p>
          <p className="text-body-md text-text-secondary mt-2">
            {summary.withPrice.length} {summary.withPrice.length === 1 ? 'libro' : 'libros'} de {summary.owned.length} con precio
          </p>

          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <StatTile compact tone="orange" label="Promedio por libro" value={summary.withPrice.length > 0 ? money(summary.avg) : '—'} />
            <StatTile compact tone="magenta" label="En pendientes" value={money(summary.pending)} />
            <StatTile compact label="En abandonados" value={money(summary.abandoned)} />
            <StatTile
              compact
              tone="pink"
              label="Completar deseados"
              value={summary.wishlistWithPrice > 0 ? money(summary.wishlist) : '—'}
            />
            <StatTile
              label="El más caro"
              value={summary.mostExpensive ? `${summary.mostExpensive.title} (${money(summary.mostExpensive.price!)})` : '—'}
              className="col-span-2"
            />
            <StatTile
              label="El más barato"
              value={summary.cheapest ? `${summary.cheapest.title} (${money(summary.cheapest.price!)})` : '—'}
              className="col-span-2"
            />
          </div>
          <p className="text-body-sm text-text-secondary text-center mt-4 text-balance">
            Los deseados no cuentan como compra hasta que cambian de estado. Puedes cambiar la moneda en Configuración.
          </p>
        </Card>

        {/* Lista */}
        <Card labelledBy="compras-lista">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <Eyebrow id="compras-lista" icon={ShoppingBag} tone="pink">Tus libros</Eyebrow>
            <SortMenu variant="icon" options={sortOptions} activeKey={sort} onSelect={setSort} />
          </div>

          <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label="Filtrar libros">
            {filterChips.map(({ key, label }) => {
              const isActive = filter === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setFilter(key)}
                  className={`px-3.5 py-1.5 rounded-full text-body-sm font-body border transition-colors ${
                    isActive ? 'bg-primary border-primary text-primary-ink font-bold' : 'bg-surface-2 border-border text-text-secondary font-semibold'
                  }`}
                >
                  {label} <span className="tabular-nums opacity-80">{counts[key]}</span>
                </button>
              )
            })}
          </div>

          {filter === 'sin-precio' && counts['sin-precio'] > 0 && (
            <p className="text-body-sm text-text-secondary mb-3">Toca un libro para agregarle el precio.</p>
          )}

          {visibleBooks.length === 0 ? (
            <p className="text-body-md text-text-secondary">
              {filter === 'sin-precio'
                ? 'Todos tus libros tienen precio.'
                : filter === 'gratis'
                  ? 'No tienes libros marcados como gratis. Pon el precio en 0 para marcarlo.'
                  : filter === 'regalos'
                    ? 'No tienes libros marcados como regalo. Márcalo al editar el libro.'
                    : 'Todavía no tienes libros.'}
            </p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {visibleBooks.map((book) => {
                const date = formatPurchaseDate(book.purchaseDate)
                return (
                  <li key={book.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedBookId(book.id)}
                      className="w-full flex items-center gap-3 px-1 py-2.5 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-primary-text"
                    >
                      <MiniCover src={book.coverUrl} title={book.title} className="w-10" />
                      <span className="flex-1 min-w-0">
                        <span className="block font-display font-semibold text-body-md text-text truncate">{book.title}</span>
                        <span className="block text-body-sm text-text-secondary truncate">
                          {[book.author, book.isGift && book.giftFrom ? `Regalo de ${book.giftFrom}` : null, date].filter(Boolean).join(' · ') || ' '}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-body-md tabular-nums ${
                          book.price == null ? 'text-text-muted text-body-sm' : 'font-semibold text-text'
                        }`}
                      >
                        {book.isGift ? 'Regalo' : book.price == null ? 'Sin precio' : book.price === 0 ? 'Gratis' : money(book.price)}
                      </span>
                    </button>
                  </li>
                )
              })}
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
