'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  capturedPreview?: string | null;
  label?: string;
  captureText?: string;
  retakeText?: string;
}

/**
 * Captures a photo via the device camera (getUserMedia) with a file-upload
 * fallback. Produces a File + object URL preview for the parent to upload.
 */
export default function CameraCapture({
  onCapture,
  capturedPreview,
  label = 'Capture',
  captureText = 'Take Photo',
  retakeText = 'Retake',
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const startStream = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStreaming(true);
    } catch (err: any) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Use the upload option instead.'
          : 'Camera unavailable. Use the upload option instead.',
      );
    }
  }, []);

  useEffect(() => {
    if (!capturedPreview) startStream();
    return () => stopStream();
  }, [capturedPreview, startStream, stopStream]);

  const snap = async () => {
    const video = videoRef.current;
    if (!video || !streaming) return;
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Capture failed'))), 'image/jpeg', 0.9),
      );
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      stopStream();
      onCapture(file, previewUrl);
    } catch (e: any) {
      setError(e?.message || 'Failed to capture photo');
    } finally {
      setBusy(false);
    }
  };

  if (capturedPreview) {
    return (
      <div className="space-y-3">
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capturedPreview}
          alt={label}
          className="w-full aspect-[4/3] object-cover rounded-xl border border-borderBg bg-black"
        />
        <button
          type="button"
          onClick={() => startStream()}
          className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" /> {retakeText}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-borderBg bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${streaming ? 'block' : 'hidden'}`}
        />
        {!streaming && !error && (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Camera className="w-8 h-8" />
            <span className="text-xs">Starting camera…</span>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-2 text-center px-6">
            <Camera className="w-8 h-8 text-yellow-400" />
            <span className="text-xs text-gray-400">{error}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={snap}
          disabled={!streaming || busy}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {captureText}
        </button>

        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-300 hover:text-white border border-borderBg px-4 py-2.5 rounded-xl transition">
          <Check className="w-4 h-4" />
          Upload File
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onCapture(f, URL.createObjectURL(f));
            }}
          />
        </label>
      </div>
    </div>
  );
}
