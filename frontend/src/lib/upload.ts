import { supabase } from './supabase';
import { fileToDataUrl } from './file';

/**
 * Upload a KYC image (snapped ID or selfie) to Supabase storage.
 * Falls back to a base64 data URL if the bucket is unavailable so the
 * KYC flow still works end-to-end without extra storage configuration.
 */
export async function uploadKycImage(file: File, path: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('kyc')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('kyc').getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err) {
    console.warn('[KYC] Supabase upload failed, using data URL fallback:', err);
    return fileToDataUrl(file);
  }
}

/**
 * Upload a seller-uploaded listing image to Supabase Storage.
 * Falls back to a base64 data URL if the bucket is unavailable so the
 * listing flow still works end-to-end without extra storage config.
 */
export async function uploadListingImage(file: File, _path?: string): Promise<string> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
    const random = Math.random().toString(36).slice(2, 10);
    const path = `listings/${Date.now()}-${random}.${safeExt}`;

    const { data, error } = await supabase.storage
      .from('listings')
      .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('listings').getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err) {
    console.warn('[Listing] Supabase upload failed, using data URL fallback:', err);
    return fileToDataUrl(file);
  }
}
