<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { 
    X, 
    Edit, 
    Trash2, 
    Save, 
    AlertTriangle,
    DollarSign,
    ShoppingCart
  } from 'lucide-svelte';
  import { formatDate } from '$lib/utils/dateUtils';

  export let show = false;
  export let venta: any = null;
  export let mode: 'edit' | 'delete' = 'edit';

  const dispatch = createEventDispatcher();

  let loading = false;
  let error = '';
  let confirmDelete = false;

  // Variables para edición
  let montoEfectivo = 0;
  let montoQR = 0;
  let observaciones = '';

  $: if (venta && show) {
    montoEfectivo = venta.monto_pagado_efectivo || 0;
    montoQR = venta.monto_pagado_qr || 0;
    // Las observaciones están en detalle_venta.observacion, no en ventas.codigo_barras
    observaciones = venta.detalle_venta?.[0]?.observacion || '';
  }

  function close() {
    if (!loading) {
      show = false;
      venta = null;
      error = '';
      confirmDelete = false;
      dispatch('close');
    }
  }

  async function handleSave() {
    if (!venta) return;

    loading = true;
    error = '';

    try {
      // Actualizar la venta principal
      const { error: updateError } = await supabase
        .from('ventas')
        .update({
          monto_pagado_efectivo: montoEfectivo,
          monto_pagado_qr: montoQR,
          monto_total: montoEfectivo + montoQR
        })
        .eq('id', venta.id);

      if (updateError) throw updateError;

      // Actualizar las observaciones en detalle_venta
      if (venta.detalle_venta && venta.detalle_venta.length > 0) {
        for (const detalle of venta.detalle_venta) {
          const { error: detalleError } = await supabase
            .from('detalle_venta')
            .update({
              observacion: observaciones
            })
            .eq('id', detalle.id);

          if (detalleError) {
            console.warn('Error al actualizar observación del detalle:', detalleError);
          }
        }
      }

      dispatch('saved', { venta: { ...venta, monto_pagado_efectivo: montoEfectivo, monto_pagado_qr: montoQR } });
      
      // Forzar el cierre del modal
      show = false;
      venta = null;
      error = '';
      confirmDelete = false;
      dispatch('close');
    } catch (err: any) {
      error = err.message || 'Error al actualizar la venta';
    } finally {
      loading = false;
    }
  }

  async function handleDelete() {
    if (!venta || !confirmDelete) return;

    loading = true;
    error = '';

    try {
      console.log('🗑️ Iniciando eliminación de venta:', venta.id);
      
      // Verificar permisos primero
      console.log('🔐 Verificando permisos de eliminación...');
      const { data: ventaTest, error: testError } = await supabase
        .from('ventas')
        .select('id, id_usuario')
        .eq('id', venta.id)
        .single();

      if (testError) {
        console.error('❌ Error al verificar permisos:', testError);
        throw new Error(`Error de permisos: ${testError.message}`);
      }

      if (!ventaTest) {
        throw new Error('No se encontró la venta para verificar permisos');
      }

      console.log('✅ Permisos verificados, venta encontrada:', ventaTest);
      
      // Primero restaurar el stock de todos los productos vendidos
      if (venta.detalle_venta && venta.detalle_venta.length > 0) {
        console.log('📦 Restaurando stock de', venta.detalle_venta.length, 'productos...');
        for (const detalle of venta.detalle_venta) {
          await restaurarStockProducto(detalle.id_producto, detalle.cantidad);
        }
        console.log('✅ Stock restaurado exitosamente');
      }

      // Luego eliminar detalles de venta
      console.log('🗑️ Eliminando detalles de venta...');
      const { data: detalleResult, error: detalleError } = await supabase
        .from('detalle_venta')
        .delete()
        .eq('id_venta', venta.id)
        .select(); // Agregar select para ver qué se eliminó

      if (detalleError) {
        console.error('❌ Error al eliminar detalles:', detalleError);
        throw detalleError;
      }

      console.log('✅ Detalles eliminados:', detalleResult);

      // Finalmente eliminar la venta
      console.log('🗑️ Eliminando venta principal...');
      const { data: ventaResult, error: ventaError } = await supabase
        .from('ventas')
        .delete()
        .eq('id', venta.id)
        .select(); // Agregar select para ver qué se eliminó

      if (ventaError) {
        console.error('❌ Error al eliminar venta:', ventaError);
        throw ventaError;
      }

      console.log('✅ Venta eliminada:', ventaResult);

      // Verificar que realmente se eliminó
      // En Supabase, cuando se elimina un registro, se retorna un array vacío si fue exitoso
      if (ventaResult === undefined) {
        throw new Error('Error en la respuesta de eliminación de la base de datos');
      }

      console.log('✅ Venta eliminada exitosamente de la base de datos');

      dispatch('deleted', { ventaId: venta.id });
      
      // Forzar el cierre del modal
      show = false;
      venta = null;
      error = '';
      confirmDelete = false;
      dispatch('close');
    } catch (err: any) {
      console.error('❌ Error completo en eliminación:', err);
      error = err.message || 'Error al eliminar la venta';
    } finally {
      loading = false;
    }
  }

  // Función para restaurar stock de un producto
  async function restaurarStockProducto(idProducto: number, cantidad: number) {
    try {
      // Obtener el almacén del producto
      const { data: almacenData, error: almacenError } = await supabase
        .from('stock')
        .select('id_almacen, cantidad')
        .eq('id_producto', idProducto)
        .limit(1);

      if (almacenError) throw almacenError;

      if (!almacenData || almacenData.length === 0) {
        console.warn(`No se encontró información de almacén para el producto ${idProducto}`);
        return;
      }

      const idAlmacen = almacenData[0].id_almacen;
      const stockActual = almacenData[0].cantidad;

      // Restaurar el stock sumando la cantidad vendida
      const { error: updateError } = await supabase
        .from('stock')
        .update({ 
          cantidad: stockActual + cantidad 
        })
        .eq('id_producto', idProducto)
        .eq('id_almacen', idAlmacen);

      if (updateError) throw updateError;

      console.log(`Stock restaurado para producto ${idProducto}: +${cantidad} (nuevo total: ${stockActual + cantidad})`);
    } catch (err: any) {
      console.error(`Error al restaurar stock del producto ${idProducto}:`, err);
      throw new Error(`Error al restaurar stock del producto: ${err.message}`);
    }
  }

  function getTipoPago(venta: any) {
    if (venta.monto_pagado_efectivo > 0 && venta.monto_pagado_qr > 0) {
      return 'Mixto';
    } else if (venta.monto_pagado_qr > 0) {
      return 'QR';
    } else {
      return 'Efectivo';
    }
  }

  function calcularGananciaVenta(venta: any) {
    return venta.detalle_venta?.reduce((sum: number, detalle: any) => {
      return sum + (detalle.total - (detalle.cantidad * detalle.precio_compra_unitario));
    }, 0) || 0;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !loading) {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show && venta}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content max-w-2xl" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          {#if mode === 'edit'}
            <Edit class="h-6 w-6 text-primary-600 mr-2" />
            <h2 class="text-xl font-semibold text-gray-900">Editar Venta</h2>
          {:else}
            <Trash2 class="h-6 w-6 text-danger-600 mr-2" />
            <h2 class="text-xl font-semibold text-gray-900">Eliminar Venta</h2>
          {/if}
        </div>
        <button class="text-gray-400 hover:text-gray-600" on:click={close}>
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        {#if error}
          <div class="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
            <p class="text-danger-700">{error}</p>
          </div>
        {/if}

        <!-- Información de la venta -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Fecha y Hora</p>
              <p class="font-medium">{formatDate(venta.fecha)}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Método de Pago</p>
              <p class="font-medium">{getTipoPago(venta)}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Total Venta</p>
              <p class="font-bold text-primary-600">{venta.monto_total.toFixed(2)}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Ganancia</p>
              <p class="font-medium text-success-600">{calcularGananciaVenta(venta).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {#if mode === 'edit'}
          <!-- Formulario de edición -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="monto-efectivo" class="block text-sm font-medium text-gray-700 mb-2">
                  Monto Efectivo
                </label>
                <input
                  id="monto-efectivo"
                  type="number"
                  step="0.01"
                  bind:value={montoEfectivo}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label for="monto-qr" class="block text-sm font-medium text-gray-700 mb-2">
                  Monto QR
                </label>
                <input
                  id="monto-qr"
                  type="number"
                  step="0.01"
                  bind:value={montoQR}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label for="observaciones" class="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                bind:value={observaciones}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Observaciones adicionales..."
              ></textarea>

            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center">
                <AlertTriangle class="h-5 w-5 text-blue-600 mr-2" />
                <p class="text-sm text-blue-700">
                  <strong>Total calculado:</strong> {(montoEfectivo + montoQR).toFixed(2)}
                  {#if Math.abs((montoEfectivo + montoQR) - venta.monto_total) > 0.01}
                    <span class="text-orange-600 ml-2">(Diferencia: {((montoEfectivo + montoQR) - venta.monto_total).toFixed(2)})</span>
                  {/if}
                </p>
              </div>
            </div>
          </div>
        {:else}
          <!-- Confirmación de eliminación -->
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 mb-4">
              <AlertTriangle class="h-6 w-6 text-danger-600" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              ¿Estás seguro de que quieres eliminar esta venta?
            </h3>
            <p class="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. Se eliminarán todos los detalles de la venta.
            </p>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div class="flex items-center">
                <ShoppingCart class="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p class="text-sm font-medium text-red-800">Venta #{venta.id}</p>
                  <p class="text-sm text-red-700">
                    {venta.detalle_venta?.length || 0} productos - {venta.monto_total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-center space-x-2 mb-6">
              <input
                id="confirm-delete"
                type="checkbox"
                bind:checked={confirmDelete}
                class="h-4 w-4 text-danger-600 focus:ring-danger-500 border-gray-300 rounded"
              />
              <label for="confirm-delete" class="text-sm text-gray-700">
                Confirmo que quiero eliminar esta venta
              </label>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t">
        <button
          type="button"
          on:click={close}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          Cancelar
        </button>
        
        {#if mode === 'edit'}
          <button
            type="button"
            on:click={handleSave}
            disabled={loading}
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {#if loading}
              Guardando...
            {:else}
              <div class="flex items-center">
                <Save class="h-4 w-4 mr-2" />
                Guardar Cambios
              </div>
            {/if}
          </button>
        {:else}
          <button
            type="button"
            on:click={handleDelete}
            disabled={loading || !confirmDelete}
            class="px-4 py-2 text-sm font-medium text-white bg-danger-600 border border-transparent rounded-md hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 disabled:opacity-50"
          >
            {#if loading}
              Eliminando...
            {:else}
              <div class="flex items-center">
                <Trash2 class="h-4 w-4 mr-2" />
                Eliminar Venta
              </div>
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 0.5rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  }
</style>
