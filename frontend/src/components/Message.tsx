import type { ReactNode } from 'react'

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  const colors = tone === 'error' ? 'border-red-300 bg-red-50 text-red-800' : 'border-gray-300 bg-white text-gray-700'
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-6 text-center ${colors}`}>
      {children}
    </div>
  )
}
