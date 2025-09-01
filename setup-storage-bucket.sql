-- Script para configurar el bucket de storage para imágenes de productos
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;

-- 3. Crear políticas nuevas
-- Política para subida (INSERT)
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = 'productos'
);

-- Política para lectura (SELECT)
CREATE POLICY "Allow public to view images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'product-images');

-- Política para actualización (UPDATE)
CREATE POLICY "Allow authenticated users to update images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Política para eliminación (DELETE)
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

-- 4. Verificar configuración
SELECT 
  'Bucket configurado' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'product-images';

-- 5. Verificar políticas
SELECT 
  'Políticas configuradas' as status,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%images%';

