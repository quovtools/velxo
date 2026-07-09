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
