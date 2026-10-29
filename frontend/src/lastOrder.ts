import type { Order } from './types'

// Held in memory only: the confirmation comes from the POST response and is
// intentionally lost on refresh (there is no order lookup).
let lastOrder: Order | null = null

export const setLastOrder = (order: Order) => {
  lastOrder = order
}

export const getLastOrder = () => lastOrder
