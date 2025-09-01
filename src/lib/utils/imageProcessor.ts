// Utilidad para procesar imágenes en Android
export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export async function processImageForAndroid(
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Crear nuevo archivo con el blob procesado
              const processedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              });
              resolve(processedFile);
            } else {
              reject(new Error('No se pudo procesar la imagen'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('No se pudo cargar la imagen'));
    };

    // Cargar imagen desde el archivo
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo'));
    };
    reader.readAsDataURL(file);
  });
}

export function isAndroidDevice(): boolean {
  return /Android/i.test(navigator.userAgent);
}

export function isMobileDevice(): boolean {
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
}

export async function createOptimizedFile(file: File): Promise<File> {
  // Si es Android y es una imagen, procesarla
  if (isAndroidDevice() && file.type.startsWith('image/')) {
    try {
      console.log('🔄 Procesando imagen para Android...');
      const processedFile = await processImageForAndroid(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8
      });
      console.log('✅ Imagen procesada:', {
        originalSize: file.size,
        processedSize: processedFile.size,
        compression: ((1 - processedFile.size / file.size) * 100).toFixed(1) + '%'
      });
      return processedFile;
    } catch (error) {
      console.warn('⚠️ Error procesando imagen, usando archivo original:', error);
      return file;
    }
  }
  
  return file;
}

