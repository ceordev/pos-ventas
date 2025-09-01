-- Políticas RLS para la tabla ventas
-- Permite a los usuarios eliminar ventas de su empresa

-- Política para DELETE (eliminar ventas)
CREATE POLICY "Usuarios pueden eliminar ventas de su empresa" ON ventas
FOR DELETE USING (
  id_cierre_caja IN (
    SELECT cierrecaja.id
    FROM cierrecaja
    WHERE cierrecaja.id_caja IN (
      SELECT caja.id
      FROM caja
      WHERE caja.id_sucursal IN (
        SELECT sucursal.id
        FROM sucursal
        WHERE sucursal.id_empresa = get_my_company_id()
      )
    )
  )
);

-- Política para UPDATE (editar ventas)
CREATE POLICY "Usuarios pueden editar ventas de su empresa" ON ventas
FOR UPDATE USING (
  id_cierre_caja IN (
    SELECT cierrecaja.id
    FROM cierrecaja
    WHERE cierrecaja.id_caja IN (
      SELECT caja.id
      FROM caja
      WHERE caja.id_sucursal IN (
        SELECT sucursal.id
        FROM sucursal
        WHERE sucursal.id_empresa = get_my_company_id()
      )
    )
  )
);

-- Política para INSERT (crear ventas)
CREATE POLICY "Usuarios pueden crear ventas en su empresa" ON ventas
FOR INSERT WITH CHECK (
  id_cierre_caja IN (
    SELECT cierrecaja.id
    FROM cierrecaja
    WHERE cierrecaja.id_caja IN (
      SELECT caja.id
      FROM caja
      WHERE caja.id_sucursal IN (
        SELECT sucursal.id
        FROM sucursal
        WHERE sucursal.id_empresa = get_my_company_id()
      )
    )
  )
);

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ventas'
ORDER BY policyname;
