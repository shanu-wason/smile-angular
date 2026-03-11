import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageProcessorService {
  async compressAndCropImage(base64Image: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const targetWidth = 512;
        const targetHeight = 512;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D context'));
          return;
        }
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        let sourceX = 0;
        let sourceY = 0;
        let sourceSize = Math.min(img.width, img.height);
        if (img.width > img.height) {
          sourceX = (img.width - img.height) / 2;
          sourceSize = img.height;
        } else {
          sourceX = 0;
          sourceSize = img.width;
          sourceY = (img.height - img.width) * 0.6;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, targetWidth, targetHeight);
        const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
        const b64Data = compressedBase64.split(',')[1];
        resolve(b64Data ?? '');
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = base64Image.includes('data:image') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
    });
  }
}
