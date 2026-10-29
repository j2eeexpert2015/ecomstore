import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, getProducts } from '../api'
import { useCart } from '../cart/CartContext'
import { Notice } from '../components/Message'
import StockBadge from '../components/StockBadge'
import { formatMoney } from '../format'
import type { Category, Product } from '../types'

type Status = 'loading' | 'error' | 'ready'

export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const categoryParam = params.get('categoryId')
  const categoryId = categoryParam && /^\d+$/.test(categoryParam) ? Number(categoryParam) : null

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)
  const { add } = useCart()

  useEffect(() => {
    getCategories().then(setCategories).catch(() => undefined)
  }, [attempt])

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    getProducts(search, categoryId, controller.signal)
      .then((result) => {
        setProducts(result)
        setStatus('ready')
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus('error')
      })
    return () => controller.abort()
  }, [search, categoryId, attempt])

  function selectCategory(id: number | null) {
    const next = new URLSearchParams(params)
    if (id === null) next.delete('categoryId')
    else next.set('categoryId', String(id))
    setParams(next)
  }

  function clearFilters() {
    setParams(new URLSearchParams())
  }

  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap ${
      active ? 'bg-amber-400 text-navy' : 'bg-navy-light text-white hover:bg-navy-light/80'
    }`

  return (
    <>
      <nav aria-label="Categories" className="bg-navy pb-3">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4">
          <button className={pill(categoryId === null)} onClick={() => selectCategory(null)}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.id} className={pill(categoryId === c.id)} onClick={() => selectCategory(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {status === 'loading' && <Notice>Loading products…</Notice>}

        {status === 'error' && (
          <Notice tone="error">
            <p>Products could not be loaded. Check that the backend is running.</p>
            <button
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-3 rounded-lg bg-navy px-4 py-2 font-semibold text-white"
            >
              Retry
            </button>
          </Notice>
        )}

        {status === 'ready' && products.length === 0 && (
          <Notice>
            <p>No products found.</p>
            {(search || categoryId !== null) && (
              <button onClick={clearFilters} className="mt-3 font-semibold text-navy underline">
                Clear filters
              </button>
            )}
          </Notice>
        )}

        {status === 'ready' && products.length > 0 && (
          <>
            {(search || categoryId !== null) && (
              <button onClick={clearFilters} className="mb-4 text-sm font-semibold text-navy underline">
                Clear filters
              </button>
            )}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <li key={p.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold">{p.name}</h2>
                    <StockBadge stock={p.stock} />
                  </div>
                  <p className="mt-1 text-xs font-medium tracking-wide text-gray-500 uppercase">{p.categoryName}</p>
                  <p className="mt-2 flex-1 text-sm text-gray-600">{p.description}</p>
                  <p className="mt-3 text-sm text-gray-500">Stock: {p.stock}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-bold">{formatMoney(p.price)}</span>
                    <button
                      onClick={() => add(p)}
                      disabled={p.stock === 0}
                      className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-navy hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      Add to Cart
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
