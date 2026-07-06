'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { User, ShieldCheck, Mail, Phone, UploadCloud } from 'lucide-react';

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  emailVerified: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // KYC states
  const [kycFileUrl, setKycFileUrl] = useState('');
  const [kycStatus, setKycStatus] = useState('UNVERIFIED');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadProfile() {
      try {
        const response = await api.get<{ success: boolean; data: ProfileData }>('/auth/me');
        if (response.success && response.data) {
          const p = response.data;
          setProfile(p);
          setFirstName(p.firstName || '');
          setLastName(p.lastName || '');
          setPhone(p.phone || '');
          setAvatarUrl(p.avatarUrl || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.patch<{ success: boolean }>('/users/me', {
        firstName,
        lastName,
        phone,
        avatarUrl,
      });

      if (response.success) {
        alert('Profile details updated successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFileUrl) return;

    alert('KYC documents submitted successfully. Verification status: PENDING.');
    setKycStatus('PENDING');
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading user profile...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-6">
      {/* Edit Profile Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
          <h1 className="text-3xl font-extrabold text-white">General Settings</h1>
          <p className="text-gray-400 text-sm">Update your account detail profile fields</p>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">First Name</label>
                <input
                  type="text"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Phone number</label>
              <input
                type="text"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
                placeholder="+234..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Avatar URL</label>
              <input
                type="text"
                className="w-full bg-background border border-borderBg rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
                placeholder="https://image.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark py-3.5 rounded-xl font-bold transition disabled:opacity-50 text-white"
            >
              Update Settings
            </button>
          </form>
        </div>
      </div>

      {/* KYC / Account Status Sidebar */}
      <div className="space-y-6">
        <div className="bg-cardBg border border-borderBg rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-bold text-white border-b border-borderBg pb-4">Verification Status</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="text-sm font-bold text-white mt-0.5">{profile?.email}</p>
                {profile?.emailVerified ? (
                  <span className="text-[10px] text-emerald-400 font-semibold">Verified</span>
                ) : (
                  <span className="text-[10px] text-yellow-400 font-semibold">Pending Verification</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Identity (KYC)</p>
                <p className="text-sm font-bold text-white mt-0.5">{kycStatus}</p>
              </div>
            </div>

            {kycStatus === 'UNVERIFIED' && (
              <form onSubmit={handleKYCSubmit} className="border-t border-borderBg pt-6 space-y-4">
                <p className="text-xs text-gray-400">Upload national ID card, passport or driving license to become a verified merchant.</p>
                <input
                  type="url"
                  required
                  placeholder="KYC Document URL"
                  className="w-full bg-background border border-borderBg rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  value={kycFileUrl}
                  onChange={(e) => setKycFileUrl(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand-light font-bold py-2 rounded-xl text-xs transition"
                >
                  Submit verification documents
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
