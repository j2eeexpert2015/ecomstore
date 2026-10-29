export default function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Out of stock</span>
  }
  if (stock <= 5) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        Only {stock} left
      </span>
    )
  }
  return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">In stock</span>
}
