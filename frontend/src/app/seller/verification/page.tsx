'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { apiCall } from '@/hooks/useApi'
import { ChevronLeft, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function SellerVerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'info' | 'documents' | 'review'>('info')
  const [formData, setFormData] = useState({
    storeName: '',
    businessDescription: '',
    businessType: 'individual',
    yearsInBusiness: '1',
    businessDocument: null as File | null,
    identityDocument: null as File | null,
    addressDocument: null as File | null,
  })
  const [uploadProgress, setUploadProgress] = useState({ id: 0, addr: 0, biz: 0 })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, [name]: e.target.files![0] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('storeName', formData.storeName)
      formDataToSend.append('businessDescription', formData.businessDescription)
      formDataToSend.append('businessType', formData.businessType)
      formDataToSend.append('yearsInBusiness', formData.yearsInBusiness)
      
      if (formData.identityDocument) {
        formDataToSend.append('identityDocument', formData.identityDocument)
      }
      if (formData.addressDocument) {
        formDataToSend.append('addressDocument', formData.addressDocument)
      }
      if (formData.businessDocument) {
        formDataToSend.append('businessDocument', formData.businessDocument)
      }

      await apiCall('/seller/verify', {
        method: 'POST',
        body: Object.fromEntries(
          Array.from(formDataToSend.entries()).filter(([_, v]) => v instanceof File === false)
        ),
      })

      setStep('review')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-20">
        <Link href="/seller/dashboard" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Seller Verification</h1>
          <p className="text-zinc-400">Get verified to increase trust and visibility</p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-4 mb-12">
          {[
            { step: 'info', label: 'Store Info', icon: '1' },
            { step: 'documents', label: 'Documents', icon: '2' },
            { step: 'review', label: 'Review', icon: '3' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === s.step
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {s.icon}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              {i < 2 && <div className="flex-1 h-1 bg-zinc-800 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Store Info */}
        {step === 'info' && (
          <Card className="p-8 border-zinc-700 bg-zinc-900/50">
            <h2 className="text-2xl font-bold mb-6">Store Information</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              setStep('documents')
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Store Name</label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                  placeholder="My Gaming Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="corporation">Corporation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Years in Business</label>
                <input
                  type="number"
                  name="yearsInBusiness"
                  value={formData.yearsInBusiness}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Business Description</label>
                <textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                  placeholder="Tell us about your gaming business..."
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Continue to Documents
              </Button>
            </form>
          </Card>
        )}

        {/* Step 2: Documents */}
        {step === 'documents' && (
          <Card className="p-8 border-zinc-700 bg-zinc-900/50">
            <h2 className="text-2xl font-bold mb-6">Upload Documents</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
                <p className="text-sm text-blue-300">
                  We need to verify your identity to protect our community. All documents are kept secure and encrypted.
                </p>
              </div>

              {/* Identity Document */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Government ID (Photo)</label>
                <div className="relative border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="file"
                    name="identityDocument"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {formData.identityDocument ? formData.identityDocument.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">PNG, JPG or PDF up to 10MB</p>
                </div>
              </div>

              {/* Address Proof */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Address Proof (Utility Bill, etc.)</label>
                <div className="relative border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="file"
                    name="addressDocument"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {formData.addressDocument ? formData.addressDocument.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">PNG, JPG or PDF up to 10MB</p>
                </div>
              </div>

              {/* Business Document */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Business Document (Business Registration, etc.) - Optional
                </label>
                <div className="relative border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="file"
                    name="businessDocument"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {formData.businessDocument ? formData.businessDocument.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">PNG, JPG or PDF up to 10MB</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('info')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.identityDocument || !formData.addressDocument}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <Card className="p-8 border-cyan-500/20 bg-cyan-500/5">
            <div className="text-center mb-8">
              <Clock className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Verification Submitted</h2>
              <p className="text-zinc-400">We are reviewing your application</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-2 text-sm text-zinc-400 ml-4">
                  <li>1. Our team will review your documents (usually within 24-48 hours)</li>
                  <li>2. You will receive an email with verification status</li>
                  <li>3. Once approved, you'll get a verification badge on your profile</li>
                </ul>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Your documents are securely stored and encrypted
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Link href="/seller/dashboard" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Home
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  )
}
