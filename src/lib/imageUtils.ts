/**
 * Image helper utility to compress uploaded photos using HTML5 Canvas.
 * Prevents Firestore maximum document size errors (1MB limit).
 */
export function compressImage(
  file: File, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      console.warn('FileReader failed, returning placeholder');
      resolve('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80');
    };
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        resolve('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80');
        return;
      }
      const img = new Image();
      img.onerror = () => {
        // Fallback to original read result if image element fails
        resolve(result);
      };
      img.onload = () => {
        try {
          let width = img.width || 400;
          let height = img.height || 400;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }
          // Fill white background to avoid black transparency in JPEGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl || result);
        } catch (err) {
          console.warn('Canvas compression error, falling back to original base64:', err);
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
