import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../cart/CartContext'

export default function Layout() {
  const { unitCount } = useCart()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const search = params.get('search') ?? ''

  // The search lives in the URL so it works from any page and survives navigation.
  function onSearch(value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set('search', value)
    else next.delete('search')
    const query = next.toString()
    navigate({ pathname: '/', search: query ? `?${query}` : '' }, { replace: pathname === '/' })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy text-white shadow">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            Ecom<span className="text-amber-400">Store</span>
          </Link>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products by name…"
            aria-label="Search products by name"
            className="order-3 w-full rounded-lg bg-white px-4 py-2 text-base text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-400 sm:order-none sm:w-auto sm:flex-1"
          />
          <Link
            to="/cart"
            className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 font-semibold hover:bg-navy-light sm:ml-0"
          >
            Cart
            <span
              aria-label={`${unitCount} items in cart`}
              data-testid="cart-count"
              className="min-w-7 rounded-full bg-amber-400 px-2 py-0.5 text-center text-sm font-bold text-navy"
            >
              {unitCount}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-footer py-6 text-center text-sm text-gray-400">
        © EcomStore — a demo store. No payments are processed.
      </footer>
    </div>
  )
}
