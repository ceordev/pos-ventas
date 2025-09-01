import { supabase } from '$lib/supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export async function uploadToSupabaseStorage(
  file: File, 
  bucket: string = 'product-images',
  folder: string = 'productos',
  skipAuthCheck: boolean = false
): Promise<UploadResult> {
  try {
    // Verificar autenticación solo si es necesario
    if (!skipAuthCheck) {
      console.log('🔍 Verificando autenticación...');
      
      // Crear timeout para autenticación
      const authTimeoutMs = 10000; // 10 segundos
      const authTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout en verificación de autenticación')), authTimeoutMs);
      });
      
      try {
        const { data: { user }, error: authError } = await Promise.race([
          supabase.auth.getUser(),
          authTimeoutPromise
        ]);
        
        if (authError || !user) {
          return {
            success: false,
            error: `Error de autenticación: ${authError?.message || 'Usuario no autenticado'}`
          };
        }

        console.log('✅ Usuario autenticado:', user.id);
      } catch (authTimeoutError: any) {
        console.warn('⚠️ Timeout en autenticación, continuando sin verificación...');
        console.warn('⚠️ Error:', authTimeoutError.message);
      }
    } else {
      console.log('⏭️ Saltando verificación de autenticación...');
    }

    // Verificar que el archivo sea válido
    console.log('🔍 Verificando archivo...');
    if (!file || file.size === 0) {
      return {
        success: false,
        error: 'Archivo inválido o vacío'
      };
    }

    // Generar nombre de archivo único
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log('📤 Iniciando subida:', {
      bucket,
      filePath,
      fileName,
      fileSize: file.size,
      fileType: file.type
    });

    // Crear un timeout más largo para Android
    const timeoutMs = 60000; // 60 segundos
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout después de ${timeoutMs/1000} segundos`)), timeoutMs);
    });

    // Intentar subida directamente sin verificar bucket
    console.log('⏳ Iniciando subida a Supabase...');
    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    console.log('⏳ Esperando respuesta de Supabase...');
    const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);

    if (uploadError) {
      console.error('❌ Error de subida:', uploadError);
      console.error('❌ Detalles del error:', {
        message: uploadError.message,
        name: uploadError.name
      });
      return {
        success: false,
        error: `Error de subida: ${uploadError.message}`
      };
    }

    console.log('✅ Subida exitosa:', uploadData);

    // Generar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('🔗 URL pública generada:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      path: uploadData.path
    };

  } catch (error: any) {
    console.error('❌ Error general en uploadToSupabaseStorage:', error);
    console.error('❌ Stack trace:', error.stack);
    return {
      success: false,
      error: `Error general: ${error.message}`
    };
  }
}

// Función específica para productos
export async function uploadProductImage(file: File): Promise<string> {
  const result = await uploadToSupabaseStorage(file, 'product-images', 'productos');
  
  if (!result.success) {
    throw new Error(result.error || 'Error desconocido al subir imagen');
  }
  
  return result.url!;
}

// Función alternativa que no usa procesamiento (como galería)
export async function uploadProductImageDirect(file: File): Promise<string> {
  try {
    console.log('📤 Subida directa (sin procesamiento):', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Generar nombre único
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `productos/${fileName}`;

    console.log('⏳ Subiendo directamente a Supabase...');
    
    // Subida directa sin verificación de auth
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error en subida directa:', error);
      throw new Error(`Error de subida: ${error.message}`);
    }

    console.log('✅ Subida directa exitosa:', data);

    // Generar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('🔗 URL generada:', publicUrl);
    return publicUrl;

  } catch (error: any) {
    console.error('❌ Error en uploadProductImageDirect:', error);
    throw error;
  }
}

// Función de prueba para diagnosticar problemas
export async function testUpload(): Promise<UploadResult> {
  try {
    console.log('🧪 Iniciando prueba de subida...');
    
    // Crear un archivo de prueba simple
    const testContent = 'Test file content for debugging';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    console.log('📝 Archivo de prueba creado:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    const result = await uploadToSupabaseStorage(testFile, 'product-images', 'test', true);
    
    if (result.success) {
      console.log('✅ Prueba exitosa, limpiando archivo...');
      // Limpiar archivo de prueba
      await supabase.storage.from('product-images').remove(['test/test.txt']);
      console.log('🧹 Archivo de prueba eliminado');
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error en prueba:', error);
    return {
      success: false,
      error: `Error en prueba: ${error.message}`
    };
  }
}

// Función para probar archivos de imagen procesados
export async function testImageUpload(file: File): Promise<UploadResult> {
  try {
    console.log('🖼️ Probando subida de imagen procesada...');
    console.log('📊 Detalles del archivo:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // Verificar si el archivo es válido
    if (!file || file.size === 0) {
      return {
        success: false,
        error: 'Archivo de imagen inválido o vacío'
      };
    }
    
    // Verificar tipo MIME
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: `Tipo de archivo inválido: ${file.type}`
      };
    }
    
    console.log('✅ Archivo de imagen válido');
    
    const result = await uploadToSupabaseStorage(file, 'product-images', 'test-images', true);
    
    if (result.success) {
      console.log('✅ Imagen subida exitosamente, limpiando...');
      // Limpiar archivo de prueba
      const fileName = result.path?.split('/').pop();
      if (fileName) {
        await supabase.storage.from('product-images').remove([`test-images/${fileName}`]);
        console.log('🧹 Imagen de prueba eliminada');
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error en prueba de imagen:', error);
    return {
      success: false,
      error: `Error en prueba de imagen: ${error.message}`
    };
  }
}

// Función para verificar configuración del bucket
export async function checkBucketConfiguration(): Promise<{success: boolean, info: any, error?: string}> {
  try {
    console.log('🔍 Verificando configuración del bucket...');
    
    // Verificar autenticación con timeout
    const authTimeoutMs = 10000; // 10 segundos
    const authTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout en verificación de autenticación')), authTimeoutMs);
    });
    
    let user = null;
    try {
      const { data: { user: authUser }, error: authError } = await Promise.race([
        supabase.auth.getUser(),
        authTimeoutPromise
      ]);
      
      if (authError || !authUser) {
        return {
          success: false,
          info: null,
          error: `Error de autenticación: ${authError?.message || 'Usuario no autenticado'}`
        };
      }
      
      user = authUser;
      console.log('✅ Usuario autenticado:', user.id);
    } catch (authTimeoutError: any) {
      console.warn('⚠️ Timeout en autenticación, continuando sin verificación...');
      console.warn('⚠️ Error:', authTimeoutError.message);
      // Continuar sin usuario autenticado
    }
    
    // Verificar permisos intentando listar archivos directamente
    const { data: files, error: listError } = await supabase.storage
      .from('product-images')
      .list('productos', { limit: 1 });
    
    if (listError) {
      return {
        success: false,
        info: { user: user?.id || 'unknown' },
        error: `Error al listar archivos: ${listError.message}`
      };
    }
    
    console.log('✅ Permisos de lectura OK');
    console.log('📁 Archivos encontrados:', files);
    
    return {
      success: true,
      info: {
        user: user?.id || 'unknown',
        files: files,
        canRead: true,
        bucket: 'product-images'
      }
    };
    
  } catch (error: any) {
    console.error('❌ Error al verificar configuración:', error);
    return {
      success: false,
      info: null,
      error: `Error general: ${error.message}`
    };
  }
}

// Función para probar conexión básica a Supabase
export async function testSupabaseConnection(): Promise<{success: boolean, error?: string, info?: any}> {
  try {
    console.log('🌐 Probando conexión básica a Supabase...');
    
    // Probar conexión básica con timeout corto
    const connectionTimeoutMs = 5000; // 5 segundos
    const connectionTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout en conexión básica')), connectionTimeoutMs);
    });
    
    // Intentar una operación simple
    const testPromise = supabase.from('productos').select('id').limit(1);
    
    const { data, error } = await Promise.race([testPromise, connectionTimeoutPromise]);
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
        info: { code: error.code, details: error.details }
      };
    }
    
    console.log('✅ Conexión básica exitosa');
    return {
      success: true,
      info: { data, connection: 'OK' }
    };
    
  } catch (error: any) {
    console.error('❌ Error en prueba de conexión:', error);
    return {
      success: false,
      error: `Error de conexión: ${error.message}`
    };
  }
}
