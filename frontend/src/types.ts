export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  categoryId: number
  categoryName: string
}

export interface OrderRequest {
  customer: { fullName: string; email: string }
  shippingAddress: string
  items: { productId: number; quantity: number }[]
}

export interface OrderItem {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface Order {
  orderNumber: string
  customer: { fullName: string; email: string }
  shippingAddress: string
  items: OrderItem[]
  totalAmount: number
  createdAt: string
}

/** 400 body: ProblemDetail with field errors. */
export interface FieldProblem {
  field: string
  message: string
}

/** 409 body: ProblemDetail with the short products. */
export interface Shortage {
  productId: number
  productName: string
  requested: number
  available: number
}
