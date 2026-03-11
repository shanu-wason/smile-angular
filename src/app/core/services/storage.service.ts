import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  constructor(private supabase: SupabaseService) {}

  async uploadImageToStorage(base64Data: string, patientId: string): Promise<string> {
    const byteCharacters = atob(base64Data);
    const byteArrays: Uint8Array[] = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    const blob = new Blob(byteArrays as BlobPart[], { type: 'image/webp' });
    const filePath = `${patientId}/${uuidv4()}.webp`;

    const { error } = await this.supabase.supabase.storage
      .from('smile-scans')
      .upload(filePath, blob, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Supabase Storage Error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data } = this.supabase.supabase.storage.from('smile-scans').getPublicUrl(filePath);
    return data.publicUrl;
  }
}
