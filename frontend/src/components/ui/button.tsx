import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50', {
  variants: { variant: { default: 'bg-white text-black hover:bg-zinc-200', destructive: 'bg-red-600 text-white hover:bg-red-700', outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800', secondary: 'bg-zinc-800 text-white hover:bg-zinc-700', ghost: 'hover:bg-zinc-800', link: 'text-white underline-offset-4 hover:underline' }, size: { default: 'h-10 px-4 py-2', sm: 'h-9 rounded-md px-3', lg: 'h-11 rounded-md px-8', icon: 'h-10 w-10' } }, defaultVariants: { variant: 'default', size: 'default' } })

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
