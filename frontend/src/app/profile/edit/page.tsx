'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useApi, apiCall } from '@/hooks/useApi'
import { User } from '@/types'
import { ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    dateOfBirth: '',
  })

  const { data: user, loading: userLoading } = useApi<User>('/users/me')

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phone: '',
        address: '',
        city: '',
        country: '',
        dateOfBirth: '',
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await apiCall('/users/me', {
        method: 'PATCH',
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          dateOfBirth: formData.dateOfBirth,
        },
      })
      setSuccess(true)
      setTimeout(() => router.push('/profile'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-zinc-800 rounded w-1/3" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-20">
        {/* Breadcrumb */}
        <Link href="/profile" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
          <p className="text-zinc-400">Update your personal information</p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="p-4 bg-green-500/10 border border-green-500/30 mb-6 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-400">Profile updated successfully!</h3>
              <p className="text-sm text-green-300">Redirecting you back to your profile...</p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-500/10 border border-red-500/30 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-400">Update failed</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </Card>
        )}

        {/* Form */}
        <Card className="p-8 border-zinc-700 bg-zinc-900/50">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-bold mb-6">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 placeholder-zinc-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Contact support to change email</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="text-xl font-bold mb-6">Address Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/profile" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
