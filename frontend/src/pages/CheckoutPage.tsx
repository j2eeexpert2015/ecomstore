import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, placeOrder } from '../api'
import { useCart } from '../cart/CartContext'
import { Notice } from '../components/Message'
import { formatMoney } from '../format'
import { setLastOrder } from '../lastOrder'
import type { Shortage } from '../types'

type Field = 'fullName' | 'email' | 'shippingAddress'
type FieldErrors = Partial<Record<Field, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Maps a backend field path such as "customer.email" to a form field. */
function toField(path: string): Field | null {
  if (path === 'customer.fullName') return 'fullName'
  if (path === 'customer.email') return 'email'
  if (path === 'shippingAddress') return 'shippingAddress'
  return null
}

export default function CheckoutPage() {
  const { lines, total, clear } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', shippingAddress: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [shortages, setShortages] = useState<Shortage[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Notice>
          <p>Your cart is empty, so there is nothing to check out.</p>
          <Link to="/" className="mt-3 inline-block font-semibold text-navy underline">
            Browse products
          </Link>
        </Notice>
      </div>
    )
  }

  function validate(): FieldErrors {
    const found: FieldErrors = {}
    if (!form.fullName.trim()) found.fullName = 'Full name is required.'
    if (!form.email.trim()) found.email = 'Email address is required.'
    else if (!EMAIL_PATTERN.test(form.email.trim())) found.email = 'Enter a valid email address.'
    if (!form.shippingAddress.trim()) found.shippingAddress = 'Shipping address is required.'
    return found
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setShortages([])
    setFormError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      // Only product ids and quantities are sent; the server prices the order.
      const order = await placeOrder({
        customer: { fullName: form.fullName.trim(), email: form.email.trim() },
        shippingAddress: form.shippingAddress.trim(),
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      })
      clear() // only after the server confirmed success
      setLastOrder(order)
      navigate('/confirmation', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setShortages(error.shortages)
      } else if (error instanceof ApiError && error.status === 400) {
        const fieldErrors: FieldErrors = {}
        const other: string[] = []
        for (const problem of error.errors) {
          const field = toField(problem.field)
          if (field) fieldErrors[field] = problem.message
          else other.push(`${problem.field}: ${problem.message}`)
        }
        setErrors(fieldErrors)
        if (other.length > 0 || Object.keys(fieldErrors).length === 0) {
          setFormError(other.join('; ') || error.message)
        }
      } else {
        setFormError('The order could not be sent. Check that the backend is running and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const input = (field: Field, label: string, type = 'text') => (
    <div>
      <label htmlFor={field} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={field}
        type={type}
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        aria-invalid={Boolean(errors[field])}
        className={`w-full rounded-lg border px-3 py-2 ${errors[field] ? 'border-red-500' : 'border-gray-300'}`}
      />
      {errors[field] && <p className="mt-1 text-sm text-red-700">{errors[field]}</p>}
    </div>
  )

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8 md:grid-cols-5">
      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl bg-white p-5 shadow-sm md:col-span-3">
        <h1 className="text-2xl font-bold">Checkout</h1>

        {shortages.length > 0 && (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Some items are not available in the requested quantity. Your order was not placed.</p>
            <ul className="mt-2 list-disc pl-5">
              {shortages.map((s) => (
                <li key={s.productId}>
                  {s.productName}: requested {s.requested}, available {s.available}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              Your cart is unchanged. <Link to="/cart" className="font-semibold underline">Adjust quantities in the cart</Link>.
            </p>
          </div>
        )}
        {formError && (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
            {formError}
          </div>
        )}

        {input('fullName', 'Full name')}
        {input('email', 'Email address', 'email')}
        <div>
          <label htmlFor="shippingAddress" className="mb-1 block text-sm font-semibold">
            Shipping address
          </label>
          <textarea
            id="shippingAddress"
            rows={3}
            value={form.shippingAddress}
            onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
            aria-invalid={Boolean(errors.shippingAddress)}
            className={`w-full rounded-lg border px-3 py-2 ${errors.shippingAddress ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.shippingAddress && <p className="mt-1 text-sm text-red-700">{errors.shippingAddress}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-navy hover:bg-amber-500 disabled:opacity-60"
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>

      <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">Order summary</h2>
        <ul className="space-y-1 text-sm">
          {lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2">
              <span>
                {l.name} × {l.quantity}
              </span>
              <span>{formatMoney((Math.round(l.price * 100) * l.quantity) / 100)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t pt-3 font-bold">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </p>
      </aside>
    </div>
  )
}
