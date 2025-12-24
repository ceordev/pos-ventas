<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { 
    X, 
    Edit, 
    Trash2, 
    Save, 
    DollarSign,
    AlertTriangle,
    ShoppingCart,
    Package
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
      console.log('🗑️ Iniciando eliminación de venta (RPC):', venta.id);

      // Llamar a la función RPC que maneja todo de forma atómica
      const { data, error: rpcError } = await supabase.rpc('delete_venta_and_restore_stock', {
        p_venta_id: venta.id
      });

      if (rpcError) {
        console.error('❌ Error en RPC de eliminación:', rpcError);
        throw rpcError;
      }
      
      // La función RPC devuelve un objeto json { success: boolean, message: string }
      // Pero Supabase lo devuelve como 'data'. Si la función retorna JSON, data es el JSON.
      // TypeScript podría no inferirlo bien sin un cast o un tipo genérico en rpc.
      const result = data as any;

      if (!result || !result.success) {
        throw new Error(result?.message || 'Error al eliminar la venta');
      }

      console.log('✅ Venta eliminada exitosamente (RPC)');

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

  // Comentamos o eliminamos esta función ya que ahora se maneja en el backend
  // async function restaurarStockProducto...




  let confirmingDeleteId: number | null = null;

  async function handleReturnProduct(detalle: any) {
    // Si no estamos confirmando este producto específico, activamos el modo confirmación
    if (confirmingDeleteId !== detalle.id) {
        confirmingDeleteId = detalle.id;
        // Resetear después de 3 segundos si no confirma
        setTimeout(() => {
            if (confirmingDeleteId === detalle.id) confirmingDeleteId = null;
        }, 3000);
        return;
    }

    // Si ya estaba en modo confirmación, procedemos
    confirmingDeleteId = null; 

    if (!detalle.id) {
        console.error('❌ Error: El detalle no tiene ID:', detalle);
        return;
    }

    loading = true;
    error = '';

    try {
      console.log('🔄 Llamando a RPC return_sale_product con ID:', detalle.id);

      const { data, error: rpcError } = await supabase.rpc('return_sale_product', {
        p_detalle_id: detalle.id
      });

      if (rpcError) throw rpcError;

      const result = data as any;
      if (!result || !result.success) {
        throw new Error(result?.message || 'Error al devolver el producto');
      }

      console.log('✅ Éxito confirmado. Actualizando UI...');

      // Actualizar estado local
      if (venta && venta.detalle_venta) {
        venta.detalle_venta = venta.detalle_venta.filter((d: any) => d.id !== detalle.id);
        
        // Recalcular total venta localmente para reflejo inmediato
        venta.monto_total -= detalle.total;
        
        // Si no quedan productos, quizás cerrar modal o mostrar aviso
        if (venta.detalle_venta.length === 0) {
          dispatch('deleted', { ventaId: venta.id }); 
          close();
          return;
        }

        // Emitir evento de guardado para recargar lista padre
        dispatch('saved', { venta: { ...venta } });
      }

    } catch (err: any) {
      console.error('❌ Excepción atrapada:', err);
      // alert('Error al devolver: ' + (err.message || 'Desconocido')); // Opcional
      error = err.message || 'Error al devolver el producto';
    } finally {
      loading = false;
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
          <!-- Lista de Productos -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Package class="h-4 w-4 mr-2" />
              Productos en la venta
            </h3>
            <div class="bg-white border rounded-lg overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {#if venta.detalle_venta}
                    {#each venta.detalle_venta as detalle}
                      <tr>
                        <td class="px-3 py-2 text-sm text-gray-900">
                          <div class="font-medium">{detalle.productos?.nombre || 'Producto'}</div>
                          {#if detalle.observacion}
                            <div class="text-xs text-gray-500">{detalle.observacion}</div>
                          {/if}
                        </td>
                        <td class="px-3 py-2 text-sm text-gray-900 text-center">{detalle.cantidad}</td>
                        <td class="px-3 py-2 text-sm text-gray-900 text-right">{detalle.total.toFixed(2)}</td>
                        <td class="px-3 py-2 text-right">
                          <button
                            class="{confirmingDeleteId === detalle.id ? 'bg-red-600 text-white hover:bg-red-700' : 'text-danger-600 hover:text-danger-900 bg-danger-50 hover:bg-danger-100'} p-1 rounded transition-colors flex items-center gap-1"
                            on:click={() => handleReturnProduct(detalle)}
                            title={confirmingDeleteId === detalle.id ? "Click para confirmar" : "Devolver producto"}
                            disabled={loading}
                          >
                            {#if confirmingDeleteId === detalle.id}
                                <spam class="text-xs font-bold px-1">Confirmar?</spam>
                            {:else}
                                <Trash2 class="h-4 w-4" />
                            {/if}
                          </button>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </div>

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
