<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { X, Package, Plus, Minus, AlertTriangle } from 'lucide-svelte';

  export let show = false;
  export let producto: any = null;

  const dispatch = createEventDispatcher();

  let loading = false;
  let error = '';
  let stockActual = 0;
  let cantidadAgregar = '';
  let cantidadQuitar = '';
  let operacion = 'agregar'; // 'agregar' o 'quitar'
  let motivo = '';

  // Reactive calculations
  $: stockFinal = operacion === 'agregar' 
    ? stockActual + (parseFloat(cantidadAgregar) || 0)
    : stockActual - (parseFloat(cantidadQuitar) || 0);

  $: stockFinalValido = stockFinal >= 0;

  // Initialize when modal opens
  $: if (show && producto) {
    stockActual = producto.stock || 0;
    cantidadAgregar = '';
    cantidadQuitar = '';
    operacion = 'agregar';
    motivo = '';
    error = '';
  }

  function close() {
    if (loading) return;
    dispatch('close');
  }

  function resetForm() {
    cantidadAgregar = '';
    cantidadQuitar = '';
    operacion = 'agregar';
    motivo = '';
    error = '';
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    loading = true;
    error = '';

    try {
      const cantidad = operacion === 'agregar' 
        ? parseFloat(cantidadAgregar) 
        : parseFloat(cantidadQuitar);

      // Obtener el almacén del producto
      const { data: almacenData, error: almacenError } = await supabase
        .from('stock')
        .select('id_almacen')
        .eq('id_producto', producto.id)
        .limit(1);

      if (almacenError) throw almacenError;

      if (!almacenData || almacenData.length === 0) {
        throw new Error('No se encontró información de almacén para este producto');
      }

      const idAlmacen = almacenData[0].id_almacen;

      if (operacion === 'agregar') {
        // Agregar stock
        const { error: updateError } = await supabase
          .from('stock')
          .update({ 
            cantidad: stockActual + cantidad 
          })
          .eq('id_producto', producto.id)
          .eq('id_almacen', idAlmacen);

        if (updateError) throw updateError;
      } else {
        // Quitar stock
        if (stockActual < cantidad) {
          throw new Error('No hay suficiente stock para quitar');
        }

        const { error: updateError } = await supabase
          .from('stock')
          .update({ 
            cantidad: stockActual - cantidad 
          })
          .eq('id_producto', producto.id)
          .eq('id_almacen', idAlmacen);

        if (updateError) throw updateError;
      }

      // Registrar movimiento de stock (opcional - para auditoría)
      await registrarMovimientoStock(producto.id, operacion, cantidad, motivo);

      dispatch('saved', { 
        nuevoStock: operacion === 'agregar' ? stockActual + cantidad : stockActual - cantidad 
      });
      resetForm();
    } catch (err: any) {
      error = err.message || 'Error al actualizar stock';
    } finally {
      loading = false;
    }
  }

  async function registrarMovimientoStock(productoId: number, operacion: string, cantidad: number, motivo: string) {
    try {
      // Aquí podrías crear una tabla de movimientos de stock si quieres auditoría
      // Por ahora solo hacemos el update directo
    } catch (err) {
      console.error('Error al registrar movimiento:', err);
    }
  }

  function validateForm(): boolean {
    if (operacion === 'agregar') {
      if (!cantidadAgregar || parseFloat(cantidadAgregar) <= 0) {
        error = 'Ingrese una cantidad válida para agregar';
        return false;
      }
    } else {
      if (!cantidadQuitar || parseFloat(cantidadQuitar) <= 0) {
        error = 'Ingrese una cantidad válida para quitar';
        return false;
      }
      if (parseFloat(cantidadQuitar) > stockActual) {
        error = 'No puede quitar más stock del disponible';
        return false;
      }
    }

    if (!stockFinalValido) {
      error = 'El stock final no puede ser negativo';
      return false;
    }

    return true;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !loading) {
      close();
    }
    if (event.key === 'Enter' && !loading) {
      handleSubmit();
    }
  }

  // Focus management
  let cantidadInput: HTMLInputElement;
  $: if (show && cantidadInput) {
    setTimeout(() => cantidadInput.focus(), 100);
  }

  // Reactive value for input
  $: cantidadValue = operacion === 'agregar' ? cantidadAgregar : cantidadQuitar;
  
  function handleCantidadChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (operacion === 'agregar') {
      cantidadAgregar = value;
    } else {
      cantidadQuitar = value;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content max-w-md" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          <Package class="h-6 w-6 text-primary-600 mr-2" />
          <h2 class="text-xl font-semibold text-gray-900">Gestionar Stock</h2>
        </div>
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors"
          on:click={close}
          disabled={loading}
        >
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Content -->
      <form on:submit|preventDefault={handleSubmit} class="p-6">
        <!-- Información del producto -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="flex items-center mb-3">
            {#if producto?.imagen_url}
              <img class="h-10 w-10 rounded-lg object-cover mr-3" src={producto.imagen_url} alt={producto.nombre} />
            {:else}
              <div class="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                <Package class="h-5 w-5 text-gray-400" />
              </div>
            {/if}
            <div>
              <h3 class="font-medium text-gray-900">{producto?.nombre}</h3>
              <p class="text-sm text-gray-600">Stock actual: <span class="font-semibold">{stockActual}</span></p>
            </div>
          </div>
        </div>

        <!-- Tipo de operación -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Operación
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="p-3 border rounded-lg text-center transition-colors {operacion === 'agregar' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 hover:border-gray-400'}"
              on:click={() => operacion = 'agregar'}
              disabled={loading}
            >
              <Plus class="h-5 w-5 mx-auto mb-1" />
              <span class="text-sm font-medium">Agregar Stock</span>
            </button>
            
            <button
              type="button"
              class="p-3 border rounded-lg text-center transition-colors {operacion === 'quitar' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 hover:border-gray-400'}"
              on:click={() => operacion = 'quitar'}
              disabled={loading}
            >
              <Minus class="h-5 w-5 mx-auto mb-1" />
              <span class="text-sm font-medium">Quitar Stock</span>
            </button>
          </div>
        </div>

        <!-- Cantidad -->
        <div class="mb-6">
          <label for="cantidad" class="block text-sm font-medium text-gray-700 mb-2">
            Cantidad a {operacion === 'agregar' ? 'agregar' : 'quitar'}
          </label>
          <input
            bind:this={cantidadInput}
            value={cantidadValue}
            on:input={handleCantidadChange}
            type="number"
            id="cantidad"
            min="0.01"
            step="0.01"
            placeholder="0"
            class="input"
            disabled={loading}
            required
          />
        </div>

        <!-- Motivo (opcional) -->
        <div class="mb-6">
          <label for="motivo" class="block text-sm font-medium text-gray-700 mb-2">
            Motivo (opcional)
          </label>
          <textarea
            bind:value={motivo}
            id="motivo"
            rows="2"
            placeholder="Ej: Compra de proveedor, Ajuste de inventario, etc."
            class="input"
            disabled={loading}
          ></textarea>
        </div>

        <!-- Resumen -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex justify-between items-center">
            <span class="text-sm text-blue-700">Stock actual:</span>
            <span class="font-medium text-blue-900">{stockActual}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-blue-700">Operación:</span>
            <span class="font-medium text-blue-900">
              {operacion === 'agregar' ? '+' : '-'} {operacion === 'agregar' ? (parseFloat(cantidadAgregar) || 0) : (parseFloat(cantidadQuitar) || 0)}
            </span>
          </div>
          <div class="flex justify-between items-center border-t border-blue-200 pt-2 mt-2">
            <span class="text-sm font-medium text-blue-700">Stock final:</span>
            <span class="font-bold text-lg {stockFinalValido ? 'text-blue-900' : 'text-red-600'}">
              {stockFinal}
            </span>
          </div>
          {#if !stockFinalValido}
            <div class="mt-2 flex items-center text-red-600 text-sm">
              <AlertTriangle class="h-4 w-4 mr-1" />
              El stock final no puede ser negativo
            </div>
          {/if}
        </div>

        {#if error}
          <div class="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-md">
            <p class="text-sm text-danger-700">{error}</p>
          </div>
        {/if}

        <!-- Actions -->
        <div class="flex space-x-3">
          <button
            type="button"
            class="btn-secondary flex-1"
            on:click={close}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary flex-1"
            disabled={loading || !stockFinalValido}
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Actualizando...
            {:else}
              {operacion === 'agregar' ? 'Agregar' : 'Quitar'} Stock
            {/if}
          </button>
        </div>
      </form>
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
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-height: 90vh;
    overflow-y: auto;
  }
</style>
