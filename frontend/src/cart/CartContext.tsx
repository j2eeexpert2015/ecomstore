import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { getProducts } from '../api'
import type { Product } from '../types'

export interface CartLine {
  productId: number
  name: string
  price: number
  quantity: number
}

type Action =
  | { type: 'add'; product: Product }
  | { type: 'setQuantity'; productId: number; quantity: number }
  | { type: 'remove'; productId: number }
  | { type: 'refreshPrices'; products: Product[] }
  | { type: 'clear' }

const STORAGE_KEY = 'ecomstore.cart'

function load(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function reducer(lines: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case 'add': {
      const { product } = action
      if (lines.some((l) => l.productId === product.id)) {
        return lines.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [...lines, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    }
    case 'setQuantity':
      return lines.map((l) => (l.productId === action.productId ? { ...l, quantity: action.quantity } : l))
    case 'remove':
      return lines.filter((l) => l.productId !== action.productId)
    case 'refreshPrices':
      // Only name/price are refreshed; quantities are never changed or removed.
      return lines.map((l) => {
        const p = action.products.find((x) => x.id === l.productId)
        return p ? { ...l, name: p.name, price: p.price } : l
      })
    case 'clear':
      return []
  }
}

interface CartValue {
  lines: CartLine[]
  unitCount: number
  total: number
  add: (product: Product) => void
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Storage unavailable: the cart still works for this page view.
    }
  }, [lines])

  // Keep displayed prices current (the server always uses its own prices at checkout).
  useEffect(() => {
    const controller = new AbortController()
    getProducts('', null, controller.signal)
      .then((products) => dispatch({ type: 'refreshPrices', products }))
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  const value = useMemo<CartValue>(
    () => ({
      lines,
      unitCount: lines.reduce((n, l) => n + l.quantity, 0),
      total: lines.reduce((sum, l) => sum + Math.round(l.price * 100) * l.quantity, 0) / 100,
      add: (product) => dispatch({ type: 'add', product }),
      setQuantity: (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity }),
      remove: (productId) => dispatch({ type: 'remove', productId }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [lines],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside CartProvider')
  return value
}
