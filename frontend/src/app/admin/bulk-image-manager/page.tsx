'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Check, X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ImageFile {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export default function BulkImageManagerPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Assignment filters
  const [filter, setFilter] = useState({
    categoryId: '',
    gameName: '',
    sellerId: '',
    status: 'ACTIVE',
  });
  
  const [strategy, setStrategy] = useState<'rotate' | 'all' | 'first' | 'random'>('rotate');
  const [assigning, setAssigning] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newImages = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Upload images
  const uploadImages = async () => {
    setUploading(true);
    
    for (let i = 0; i < images.length; i++) {
      if (images[i].uploaded) continue;
      
      setImages(prev => {
        const newImages = [...prev];
        newImages[i].uploading = true;
        return newImages;
      });

      try {
        // Convert to base64 for upload
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(images[i].file);
        });

        // Upload to backend (assuming you have an image upload endpoint)
        // For now, we'll use the base64 directly
        const imageUrl = base64;

        setImages(prev => {
          const newImages = [...prev];
          newImages[i].uploading = false;
          newImages[i].uploaded = true;
          newImages[i].url = imageUrl;
          return newImages;
        });
      } catch (err) {
        console.error('Upload error:', err);
        setImages(prev => {
          const newImages = [...prev];
          newImages[i].uploading = false;
          newImages[i].error = 'Upload failed';
          return newImages;
        });
      }
    }
    
    setUploading(false);
  };

  // Assign images to listings
  const assignImages = async () => {
    const uploadedUrls = images.filter(img => img.uploaded && img.url).map(img => img.url!);
    
    if (uploadedUrls.length === 0) {
      alert('Please upload images first');
      return;
    }

    // Build filter object
    const filterObj: any = {};
    if (filter.categoryId) filterObj.categoryId = filter.categoryId;
    if (filter.gameName) filterObj.gameName = filter.gameName;
    if (filter.sellerId) filterObj.sellerId = filter.sellerId;
    if (filter.status) filterObj.status = filter.status;

    if (Object.keys(filterObj).length === 0) {
      alert('Please select at least one filter to target listings');
      return;
    }

    setAssigning(true);
    try {
      const res = await api.post('/admin/bulk/images/update-listings', {
        imageUrls: uploadedUrls,
        filter: filterObj,
        strategy,
      });

      setResult(res.data);
      alert(res.message || 'Images assigned successfully!');
    } catch (err: any) {
      console.error('Assignment error:', err);
      alert(err?.response?.data?.message || 'Error assigning images');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Bulk Image Manager</h1>
        <p className="text-gray-400">Upload images and assign them to multiple listings at once</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">1. Upload Images</h2>
          
          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="bg-cardBg border-2 border-dashed border-borderBg rounded-lg p-12 text-center hover:border-brand transition cursor-pointer"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="imageUpload"
            />
            <label htmlFor="imageUpload" className="cursor-pointer">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">Drop images here or click to browse</p>
              <p className="text-sm text-gray-400">Supports JPG, PNG, WebP, GIF</p>
            </label>
          </div>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold">{images.length} image{images.length !== 1 ? 's' : ''} selected</p>
                <button
                  onClick={uploadImages}
                  disabled={uploading || images.every(img => img.uploaded)}
                  className="px-4 py-2 bg-brand hover:bg-brand-dark rounded-lg text-white font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload All'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    
                    {/* Status overlay */}
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                      {img.uploading && <div className="text-white text-sm">Uploading...</div>}
                      {img.uploaded && <Check className="w-8 h-8 text-green-400" />}
                      {img.error && <X className="w-8 h-8 text-red-400" />}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assignment Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">2. Assign to Listings</h2>
          
          <div className="bg-cardBg border border-borderBg rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Assignment Strategy
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="w-full bg-background border border-borderBg rounded-lg px-3 py-2 text-white"
              >
                <option value="rotate">Rotate (cycle through images)</option>
                <option value="all">All (assign all images to each listing)</option>
                <option value="first">First (assign only first image)</option>
                <option value="random">Random (random image per listing)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {strategy === 'rotate' && 'Each listing gets a different image in sequence'}
                {strategy === 'all' && 'Every listing gets all uploaded images'}
                {strategy === 'first' && 'All listings get the first image only'}
                {strategy === 'random' && 'Each listing gets a random image'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Target Filters</label>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="w-full bg-background border border-borderBg rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="PENDING_APPROVAL">Pending Only</option>
                    <option value="DRAFT">Draft Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Game Name</label>
                  <input
                    type="text"
                    value={filter.gameName}
                    onChange={(e) => setFilter({ ...filter, gameName: e.target.value })}
                    placeholder="e.g., Free Fire"
                    className="w-full bg-background border border-borderBg rounded px-3 py-2 text-white text-sm placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category ID (optional)</label>
                  <input
                    type="text"
                    value={filter.categoryId}
                    onChange={(e) => setFilter({ ...filter, categoryId: e.target.value })}
                    placeholder="Category ID"
                    className="w-full bg-background border border-borderBg rounded px-3 py-2 text-white text-sm placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Seller ID (optional)</label>
                  <input
                    type="text"
                    value={filter.sellerId}
                    onChange={(e) => setFilter({ ...filter, sellerId: e.target.value })}
                    placeholder="Seller ID"
                    className="w-full bg-background border border-borderBg rounded px-3 py-2 text-white text-sm placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={assignImages}
              disabled={assigning || !images.some(img => img.uploaded)}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? 'Assigning Images...' : 'Assign Images to Listings'}
            </button>

            {/* Result */}
            {result && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-300 font-semibold mb-2">✓ Assignment Complete</p>
                <div className="text-sm text-green-200 space-y-1">
                  <p>Matched: {result.matched} listings</p>
                  <p>Updated: {result.updated} listings</p>
                  {result.failed > 0 && <p className="text-red-300">Failed: {result.failed}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <AlertCircle size={20} />
          How It Works
        </h3>
        <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
          <li>Upload multiple images using drag & drop or file browser</li>
          <li>Choose an assignment strategy (rotate, all, first, or random)</li>
          <li>Set target filters to select which listings should receive images</li>
          <li>Click "Assign Images to Listings" to apply</li>
          <li>Check the result summary to verify successful assignment</li>
        </ol>
      </div>
    </div>
  );
}
