import { Link, Navigate } from 'react-router-dom'
import { formatMoney } from '../format'
import { getLastOrder } from '../lastOrder'

/** Shows the order returned by the POST response; it is held in memory only, so a refresh loses it. */
export default function ConfirmationPage() {
  const order = getLastOrder()
  if (!order) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-green-700">Thank you! Your order is confirmed.</h1>
        <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Order number</dt>
            <dd className="font-mono font-semibold" data-testid="order-number">
              {order.orderNumber}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Order date and time</dt>
            <dd className="font-semibold">{new Date(order.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Customer</dt>
            <dd className="font-semibold">
              {order.customer.fullName} ({order.customer.email})
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Shipping address</dt>
            <dd className="font-semibold whitespace-pre-line">{order.shippingAddress}</dd>
          </div>
        </dl>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.productId} className="border-b">
                <td className="py-2">{i.productName}</td>
                <td className="py-2 text-right">{formatMoney(i.unitPrice)}</td>
                <td className="py-2 text-right">{i.quantity}</td>
                <td className="py-2 text-right">{formatMoney(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-3 text-right font-bold">
                Total
              </td>
              <td className="py-3 text-right text-lg font-bold" data-testid="order-total">
                {formatMoney(order.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        <Link to="/" className="mt-4 inline-block rounded-lg bg-amber-400 px-5 py-2 font-semibold text-navy hover:bg-amber-500">
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
