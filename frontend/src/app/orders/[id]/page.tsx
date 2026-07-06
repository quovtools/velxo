"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  listing?: { title: string; image: string; price: number }
  seller?: { id: string; username: string; avatar: string; rating: number }
  quantity: number
  commission: number
  escrowStatus: string
}

export default function OrderDetailPage() {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelivery, setConfirmingDelivery] = useState(false)
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setOrder(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router])

  const handleConfirmDelivery = async () => {
    try {
      setConfirmingDelivery(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/orders/${orderId}/confirm-delivery`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        alert('Order confirmed! Funds released to seller.')
        router.refresh()
      }
    } catch (error) {
      alert('Failed to confirm delivery')
    } finally {
      setConfirmingDelivery(false)
    }
  }

  const getTimeline = () => {
    const events = [
      { status: 'PENDING', label: 'Order Placed', completed: true },
      { status: 'PAID', label: 'Payment Confirmed', completed: order?.status !== 'PENDING' },
      { status: 'DELIVERED', label: 'Seller Delivered', completed: ['DELIVERED', 'COMPLETED'].includes(order?.status || '') },
      { status: 'COMPLETED', label: 'Order Complete', completed: order?.status === 'COMPLETED' },
    ]
    return events
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full bg-zinc-800" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Order not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={() => router.back()} className="text-blue-400 hover:text-blue-300 mb-6">
          ← Back to Orders
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order #{order.orderNumber}</h1>
          <p className="text-zinc-400">{new Date(order.createdAt).toLocaleString()}</p>
        </div>

        {/* Timeline */}
        <Card className="p-6 bg-zinc-900 border-zinc-800 mb-8">
          <h2 className="text-lg font-semibold mb-6">Order Timeline</h2>
          <div className="space-y-4">
            {getTimeline().map((event, idx) => (
              <div key={event.status} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${event.completed ? 'bg-green-500' : 'bg-zinc-700'}`} />
                <div className="flex-1">
                  <p className={event.completed ? 'text-white' : 'text-zinc-400'}>{event.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm mb-1">Status</p>
            <p className="text-2xl font-bold text-blue-400">{order.status}</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm mb-1">Escrow Status</p>
            <p className="text-2xl font-bold text-purple-400">{order.escrowStatus || 'HELD'}</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 text-sm mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-green-400">${order.totalAmount.toFixed(2)}</p>
          </Card>
        </div>

        {/* Product Info */}
        {order.listing && (
          <Card className="p-6 bg-zinc-900 border-zinc-800 mb-8">
            <h2 className="text-lg font-semibold mb-4">Product Information</h2>
            <div className="flex gap-6">
              {order.listing.images?.[0] && (
                <img src={order.listing.images[0]} alt={order.listing.title} className="w-32 h-32 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{order.listing.title}</h3>
                <p className="text-zinc-400 mb-2">Quantity: {order.quantity}</p>
                <p className="text-lg font-semibold">Unit Price: ${order.listing.price.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Seller Info */}
        {order.seller && (
          <Card className="p-6 bg-zinc-900 border-zinc-800 mb-8">
            <h2 className="text-lg font-semibold mb-4">Seller Information</h2>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-semibold">{order.seller.storeName}</p>
                <p className="text-zinc-400">Rating: ⭐ {order.seller.averageRating.toFixed(1)}/5</p>
              </div>
            </div>
          </Card>
        )}

        {/* Price Breakdown */}
        <Card className="p-6 bg-zinc-900 border-zinc-800 mb-8">
          <h2 className="text-lg font-semibold mb-4">Price Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Subtotal:</span>
              <span>${(order.totalAmount + order.commission).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Commission (10%):</span>
              <span>-${order.commission.toFixed(2)}</span>
            </div>
            <div className="border-t border-zinc-700 pt-3 flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-green-400">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        {order.status === 'DELIVERED' && (
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <p className="text-zinc-400 mb-4">Confirm that you&apos;ve received the product to release funds to the seller.</p>
            <button
              onClick={handleConfirmDelivery}
              disabled={confirmingDelivery}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              {confirmingDelivery ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          </Card>
        )}
      </div>
    </div>
  )
}
