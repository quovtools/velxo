import * as React from 'react'
import { cn } from '@/lib/utils'

function Toast({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="status" className={cn('fixed bottom-4 right-4 z-50 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-white shadow-lg', className)} {...props} />
}

export { Toast }
