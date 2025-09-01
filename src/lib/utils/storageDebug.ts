import { supabase } from '$lib/supabase';

export interface StorageDebugInfo {
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  uploadResult: {
    success: boolean;
    error?: string;
    path?: string;
    url?: string;
  };
  networkInfo: {
    userAgent: string;
    isAndroid: boolean;
    isMobile: boolean;
    connectionType?: string;
  };
}

export async function debugStorageUpload(file: File): Promise<StorageDebugInfo> {
  const debugInfo: StorageDebugInfo = {
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    },
    uploadResult: {
      success: false
    },
    networkInfo: {
      userAgent: navigator.userAgent,
      isAndroid: /Android/i.test(navigator.userAgent),
      isMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
      connectionType: (navigator as any).connection?.effectiveType
    }
  };

  try {
    console.log('🔍 Debug Storage Upload:', debugInfo);

    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      debugInfo.uploadResult.error = `Error de autenticación: ${authError?.message || 'Usuario no autenticado'}`;
      return debugInfo;
    }

    // 2. Verificar bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      debugInfo.uploadResult.error = `Error al verificar bucket: ${bucketError.message}`;
      return debugInfo;
    }

    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    if (!productImagesBucket) {
      debugInfo.uploadResult.error = 'Bucket "product-images" no encontrado';
      return debugInfo;
    }

    // 3. Intentar subida con timeout
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `debug_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `productos/${fileName}`;

    console.log('📤 Intentando subida:', filePath);

    const uploadPromise = supabase.storage
      .from('product-images')
      .upload(filePath, file);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout después de 30 segundos')), 30000);
    });

    const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);

    if (uploadError) {
      debugInfo.uploadResult.error = `Error de subida: ${uploadError.message}`;
      console.error('❌ Error de subida:', uploadError);
      return debugInfo;
    }

    // 4. Generar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    debugInfo.uploadResult = {
      success: true,
      path: uploadData.path,
      url: publicUrl
    };

    console.log('✅ Subida exitosa:', debugInfo.uploadResult);

    // 5. Limpiar archivo de prueba
    await supabase.storage.from('product-images').remove([filePath]);
    console.log('🧹 Archivo de prueba eliminado');

    return debugInfo;

  } catch (error: any) {
    debugInfo.uploadResult.error = `Error general: ${error.message}`;
    console.error('❌ Error general:', error);
    return debugInfo;
  }
}

export function isAndroidDevice(): boolean {
  return /Android/i.test(navigator.userAgent);
}

export function getNetworkInfo() {
  return {
    userAgent: navigator.userAgent,
    isAndroid: isAndroidDevice(),
    isMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
    connectionType: (navigator as any).connection?.effectiveType,
    onLine: navigator.onLine
  };
}

