import type { Category, FieldProblem, Order, OrderRequest, Product, Shortage } from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

/** An HTTP error response from the backend (ProblemDetail body, when present). */
export class ApiError extends Error {
  status: number
  errors: FieldProblem[]
  shortages: Shortage[]

  constructor(status: number, body: { detail?: string; errors?: FieldProblem[]; shortages?: Shortage[] } | null) {
    super(body?.detail ?? `Request failed (HTTP ${status})`)
    this.status = status
    this.errors = body?.errors ?? []
    this.shortages = body?.shortages ?? []
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}/api/v1${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body)
  }
  return response.json() as Promise<T>
}

export const getCategories = (signal?: AbortSignal) => request<Category[]>('/categories', { signal })

export function getProducts(search: string, categoryId: number | null, signal?: AbortSignal) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (categoryId !== null) params.set('categoryId', String(categoryId))
  const query = params.toString()
  return request<Product[]>(`/products${query ? `?${query}` : ''}`, { signal })
}

export const placeOrder = (order: OrderRequest) =>
  request<Order>('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
