'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera, UserCheck, ScanLine, ShieldCheck, CheckCircle2, Loader2, AlertTriangle,
  CreditCard, FileText, ArrowLeft, ArrowRight, Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { uploadKycImage } from '@/lib/upload';
import CameraCapture from '@/components/CameraCapture';
import VerifiedBadge from '@/components/VerifiedBadge';

type KYCStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

interface Seller {
  id: string;
  storeName: string;
  isVerified: boolean;
  kycStatus: KYCStatus;
  kycIdType?: string | null;
  kycFullName?: string | null;
  kycDocumentNumber?: string | null;
  kycIdImageUrl?: string | null;
  kycSelfieImageUrl?: string | null;
  kycSubmittedAt?: string | null;
  kycRejectionReason?: string | null;
  verifiedAt?: string | null;
}

const ID_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID', icon: CreditCard },
  { value: 'PASSPORT', label: 'Passport', icon: FileText },
  { value: 'DRIVERS_LICENSE', label: "Driver's License", icon: CreditCard },
];

type Step = 'intro' | 'id' | 'selfie' | 'details' | 'review';

export default function SellerKycPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>('intro');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [idType, setIdType] = useState('NATIONAL_ID');
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: Seller }>('/sellers/me');
        if (res.success) {
          setSeller(res.data);
          if (res.data.kycFullName) setFullName(res.data.kycFullName);
          if (res.data.kycIdType) setIdType(res.data.kycIdType);
          if (res.data.kycDocumentNumber) setDocumentNumber(res.data.kycDocumentNumber);
          if (res.data.kycStatus === 'SUBMITTED' || res.data.kycStatus === 'APPROVED' || res.data.kycStatus === 'REJECTED') {
            setStep('review');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const onIdCapture = (file: File, preview: string) => {
    setIdFile(file);
    setIdPreview(preview);
    setError('');
  };
  const onSelfieCapture = (file: File, preview: string) => {
    setSelfieFile(file);
    setSelfiePreview(preview);
    setError('');
  };

  const next = () => {
    if (step === 'intro') setStep('id');
    else if (step === 'id') {
      if (!idFile) return setError('Please capture or upload your ID document.');
      setStep('selfie');
    } else if (step === 'selfie') {
      if (!selfieFile) return setError('Please complete the facial verification selfie.');
      setStep('details');
    } else if (step === 'details') {
      if (!fullName.trim()) return setError('Full name (as on ID) is required.');
      setStep('review');
    }
    setError('');
  };

  const back = () => {
    if (step === 'id') setStep('intro');
    else if (step === 'selfie') setStep('id');
    else if (step === 'details') setStep('selfie');
    else if (step === 'review') setStep('details');
    setError('');
  };

  const submit = async () => {
    if (!seller || !idFile || !selfieFile) return;
    setSubmitting(true);
    setError('');
    try {
      const ts = Date.now();
      const idUrl = await uploadKycImage(idFile, `ids/${seller.id}-${ts}.jpg`);
      const selfieUrl = await uploadKycImage(selfieFile, `selfies/${seller.id}-${ts}.jpg`);

      await api.post('/sellers/kyc/submit', {
        idType,
        fullName: fullName.trim(),
        documentNumber: documentNumber.trim() || undefined,
        idImageUrl: idUrl,
        selfieImageUrl: selfieUrl,
      });

      const res = await api.get<{ success: boolean; data: Seller }>('/sellers/me');
      if (res.success) setSeller(res.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  // Already verified
  if (seller?.isVerified && seller.kycStatus === 'APPROVED') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-cardBg border border-blue-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-9 h-9 text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            Identity Verified <VerifiedBadge size="md" variant="badge" />
          </h1>
          <p className="text-sm text-gray-400 mt-3">
            Your seller identity is verified. The blue badge is now shown on your store and listings.
          </p>
          {seller.verifiedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Verified since {new Date(seller.verifiedAt).toLocaleDateString()}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/seller/dashboard" className="bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl text-sm font-bold text-white transition">
              Go to Dashboard
            </Link>
            <Link href="/seller/settings" className="border border-borderBg px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition">
              Store Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending review
  if (seller?.kycStatus === 'SUBMITTED') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-cardBg border border-yellow-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-9 h-9 text-yellow-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-black text-white">Verification In Review</h1>
          <p className="text-sm text-gray-400 mt-3">
            Thanks! Your ID and selfie have been submitted. Our admin team will review your submission and grant the verified badge once approved.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Submitted {seller.kycSubmittedAt ? new Date(seller.kycSubmittedAt).toLocaleString() : ''}
          </p>
          <Link href="/seller/dashboard" className="inline-block mt-6 bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl text-sm font-bold text-white transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Rejected — allow resubmission
  if (seller?.kycStatus === 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-cardBg border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-9 h-9 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Verification Rejected</h1>
          {seller.kycRejectionReason && (
            <p className="text-sm text-red-300 mt-3">Reason: {seller.kycRejectionReason}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">You can submit a new verification below.</p>
          <button
            onClick={() => { setSeller({ ...seller, kycStatus: 'NOT_SUBMITTED' }); setStep('intro'); }}
            className="mt-6 bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl text-sm font-bold text-white transition"
          >
            Resubmit Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/seller/settings" className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand" /> Seller Identity Verification (KYC)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete all steps to receive your blue verified badge.
          </p>
        </div>
      </div>

      {/* Progress */}
      <Progress step={step} />

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-cardBg border border-borderBg rounded-2xl p-6 space-y-4">
        {step === 'intro' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-hoverBg/30 rounded-xl">
              <div className="p-2 bg-brand/10 rounded-lg"><ScanLine className="w-5 h-5 text-brand" /></div>
              <div>
                <p className="text-sm font-semibold text-white">1. Snap your ID document</p>
                <p className="text-xs text-gray-400">Use your camera to capture a clear photo of a government-issued ID.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-hoverBg/30 rounded-xl">
              <div className="p-2 bg-brand/10 rounded-lg"><Camera className="w-5 h-5 text-brand" /></div>
              <div>
                <p className="text-sm font-semibold text-white">2. Facial verification</p>
                <p className="text-xs text-gray-400">Take a live selfie so we can match it to your ID.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-hoverBg/30 rounded-xl">
              <div className="p-2 bg-brand/10 rounded-lg"><Lock className="w-5 h-5 text-brand" /></div>
              <div>
                <p className="text-sm font-semibold text-white">3. Submit for review</p>
                <p className="text-xs text-gray-400">Our team reviews submissions and grants the verified badge on approval.</p>
              </div>
            </div>
            <button onClick={next} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-6 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-brand/20">
              Start Verification <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'id' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><ScanLine className="w-5 h-5 text-brand" /> Snap your ID</h2>
            <p className="text-xs text-gray-400">Capture a clear, well-lit photo of your ID. Ensure all details are readable.</p>
            <CameraCapture onCapture={onIdCapture} capturedPreview={idPreview} label="ID document" captureText="Capture ID" />
          </div>
        )}

        {step === 'selfie' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Camera className="w-5 h-5 text-brand" /> Facial verification</h2>
            <p className="text-xs text-gray-400">Take a selfie in good lighting. Remove hats/glasses if they cover your face.</p>
            <CameraCapture onCapture={onSelfieCapture} capturedPreview={selfiePreview} label="Selfie" captureText="Capture Selfie" />
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-brand" /> Confirm details</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">ID Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ID_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setIdType(t.value)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      idType === t.value ? 'border-brand bg-brand/10 text-white' : 'border-borderBg text-gray-400 hover:text-white'
                    }`}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Full Legal Name (as on ID)</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Document Number (optional)</label>
              <input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="ID / passport number"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
              />
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand" /> Review & submit</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl overflow-hidden border border-borderBg">
                // eslint-disable-next-line @next/next/no-img-element
                <img src={idPreview || seller?.kycIdImageUrl || ''} alt="ID" className="w-full aspect-[4/3] object-cover bg-black" />
                <p className="text-xs text-center text-gray-400 py-1.5">ID Document</p>
              </div>
              <div className="rounded-xl overflow-hidden border border-borderBg">
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selfiePreview || seller?.kycSelfieImageUrl || ''} alt="Selfie" className="w-full aspect-[4/3] object-cover bg-black" />
                <p className="text-xs text-center text-gray-400 py-1.5">Selfie</p>
              </div>
            </div>
            <div className="text-sm text-gray-300 space-y-1 bg-hoverBg/30 rounded-xl p-4">
              <p><span className="text-gray-500">ID Type:</span> {ID_TYPES.find((t) => t.value === idType)?.label}</p>
              <p><span className="text-gray-500">Full Name:</span> {fullName}</p>
              {documentNumber && <p><span className="text-gray-500">Document #:</span> {documentNumber}</p>}
            </div>
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-dark hover:to-purple-700 px-6 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-brand/20 disabled:opacity-50"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><ShieldCheck className="w-4 h-4" /> Submit for Review</>}
            </button>
          </div>
        )}
      </div>

      {step !== 'intro' && step !== 'review' && (
        <div className="flex justify-between">
          <button onClick={back} className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white px-4 py-2.5 rounded-xl border border-borderBg">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={next} className="flex items-center gap-2 text-sm font-semibold text-white bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-xl">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const order: Step[] = ['intro', 'id', 'selfie', 'details', 'review'];
  const labels: Record<Step, string> = {
    intro: 'Start', id: 'ID', selfie: 'Selfie', details: 'Details', review: 'Submit',
  };
  const current = order.indexOf(step);
  return (
    <div className="flex items-center gap-2">
      {order.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex-1 h-1.5 rounded-full ${i <= current ? 'bg-brand' : 'bg-borderBg'}`} />
        </React.Fragment>
      ))}
      <span className="text-[11px] text-gray-400 ml-2 hidden sm:inline">{labels[step]}</span>
    </div>
  );
}
