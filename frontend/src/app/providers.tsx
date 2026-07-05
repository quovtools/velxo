import { Toaster } from '@/components/ui/toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ToastProvider } from '@/hooks/use-toast'
import { FadeIn } from '@/components/fade-in'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }))

  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ToastProvider>
  )
}
