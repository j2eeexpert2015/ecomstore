import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart, type CartLine } from '../cart/CartContext'
import { Notice } from '../components/Message'
import { formatMoney } from '../format'

function QuantityInput({ line }: { line: CartLine }) {
  const { setQuantity } = useCart()
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(line.quantity)
  const invalid = draft !== null && !/^[1-9]\d{0,5}$/.test(draft.trim())

  function onChange(value: string) {
    setDraft(value)
    if (/^[1-9]\d{0,5}$/.test(value.trim())) setQuantity(line.productId, Number(value.trim()))
  }

  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Quantity for ${line.name}`}
        value={shown}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setDraft(null)}
        aria-invalid={invalid}
        className={`w-20 rounded-lg border px-3 py-1.5 text-center ${invalid ? 'border-red-500' : 'border-gray-300'}`}
      />
      {invalid && <p className="mt-1 text-xs text-red-700">Enter a whole number of 1 or more.</p>}
    </div>
  )
}

export default function CartPage() {
  const { lines, total, remove } = useCart()

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Notice>
          <p>Your cart is empty.</p>
          <Link to="/" className="mt-3 inline-block font-semibold text-navy underline">
            Browse products
          </Link>
        </Notice>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Your cart</h1>
      <ul className="divide-y rounded-2xl bg-white shadow-sm">
        {lines.map((line) => (
          <li key={line.productId} className="flex flex-wrap items-start gap-4 p-4">
            <div className="min-w-40 flex-1">
              <p className="font-semibold">{line.name}</p>
              <p className="text-sm text-gray-500">{formatMoney(line.price)} each</p>
            </div>
            <QuantityInput line={line} />
            <p className="w-24 text-right font-semibold" aria-label={`Subtotal for ${line.name}`}>
              {formatMoney(Math.round(line.price * 100) * line.quantity / 100)}
            </p>
            <button
              onClick={() => remove(line.productId)}
              aria-label={`Remove ${line.name}`}
              className="text-sm font-semibold text-red-700 underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-2xl font-bold" data-testid="cart-total">
          {formatMoney(total)}
        </span>
      </div>
      <div className="mt-4 flex justify-between">
        <Link to="/" className="font-semibold text-navy underline">
          Continue shopping
        </Link>
        <Link to="/checkout" className="rounded-lg bg-amber-400 px-5 py-2 font-semibold text-navy hover:bg-amber-500">
          Checkout
        </Link>
      </div>
    </div>
  )
}
