export const compressImage = async (file: File, maxSizeMB: number = 1): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    // Cannot compress non-images natively
    return file;
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size <= maxSizeBytes) {
    return file; // Already small enough
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Initial dimensions
      let width = img.width;
      let height = img.height;

      // Aggressively cap max dimensions for very large files (e.g. 15-20MB photos)
      const MAX_DIMENSION = 1920; 
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      let finalFile = file;

      const attemptCompression = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            
            // Generate new file
            finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            // If it's still too large and we can compress more
            if (finalFile.size > maxSizeBytes && quality > 0.3) {
              quality -= 0.15;
              
              // If quality is getting low, start shrinking dimensions too
              if (quality < 0.6) {
                  width = Math.round(width * 0.8);
                  height = Math.round(height * 0.8);
                  canvas.width = width;
                  canvas.height = height;
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, width, height);
                  ctx.drawImage(img, 0, 0, width, height);
              }
              
              attemptCompression();
            } else {
              resolve(finalFile);
            }
          },
          'image/jpeg',
          quality
        );
      };

      attemptCompression();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};
