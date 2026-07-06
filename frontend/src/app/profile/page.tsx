'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiCall } from '@/hooks/useApi'
import { User, Mail, Calendar, Edit, Save, X } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await apiCall('/users/me', {
        method: 'PATCH',
        body: formData,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin">Loading...</div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <h1 className="text-4xl font-black mb-12">Account Settings</h1>

          {/* Profile Card */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Profile Information</h2>
                <p className="text-zinc-400">Manage your account details</p>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {/* Profile Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-zinc-400">{user?.role}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 text-zinc-300">{user?.firstName || 'Not set'}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 text-zinc-300">{user?.lastName || 'Not set'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="px-4 py-2 text-zinc-300">{user?.email}</p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium mb-2">Account Type</label>
                  <p className="px-4 py-2 text-zinc-300 capitalize">{user?.role}</p>
                </div>

                {/* Joined */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <p className="px-4 py-2 text-zinc-300">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 pt-6 border-t border-zinc-800">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Security Card */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Security</h2>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Active Sessions
              </Button>
            </div>
          </Card>

          {/* Notifications Card */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Notifications</h2>
            <div className="space-y-4">
              {[
                'Order Updates',
                'Security Alerts',
                'Marketing Emails',
                'Weekly Newsletter',
              ].map((item) => (
                <label key={item} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-900/50 bg-red-900/10 p-8">
            <h2 className="text-2xl font-bold mb-6 text-red-400">Danger Zone</h2>
            <p className="text-zinc-400 mb-6">
              These actions cannot be undone. Please proceed with caution.
            </p>
            <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
              Delete Account
            </Button>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
