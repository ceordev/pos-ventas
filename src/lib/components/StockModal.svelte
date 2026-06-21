<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { X, Package, Plus, Minus, AlertTriangle } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth';

  export let show = false;
  export let producto: any = null;

  const dispatch = createEventDispatcher();

  let loading = false;
  let error = '';
  let tallas: any[] = [];
  let selectedTalla = '';
  let stockActual = 0;
  let cantidadAgregar = '';
  let cantidadQuitar = '';
  let operacion = 'agregar'; // 'agregar' o 'quitar'
  let motivo = '';
  let esNuevaTalla = false;
  let nuevaTallaInput = '';

  // Assign sizes state
  let modoAsignacion = false;
  let stockSinAsignar = 0;
  let asignaciones = [{ talla: '', cantidad: 1 }];
  let permitirAumento = false;
  
  $: totalAsignado = asignaciones.reduce((sum, a) => sum + (parseFloat(a.cantidad as any) || 0), 0);
  $: asignacionValida = permitirAumento ? true : totalAsignado <= stockSinAsignar;

  // Reactive calculations
  
  $: {
    if (esNuevaTalla) {
      stockActual = 0;
    } else if (tallas.length > 0 && selectedTalla) {
      const t = tallas.find(x => x.talla === selectedTalla);
      stockActual = t ? t.stock : 0;
    } else if (producto && tallas.length === 0) {
      stockActual = producto.stock || 0;
    }
  }
  
  $: stockFinal = operacion === 'agregar'
    ? stockActual + (parseFloat(cantidadAgregar) || 0)
    : stockActual - (parseFloat(cantidadQuitar) || 0);

  $: stockFinalValido = stockFinal >= 0;

  // Initialize when modal opens
  
  async function loadTallas(productId: number) {
    const { data } = await supabase.from('producto_tallas').select('*').eq('id_producto', productId);
    if (data && data.length > 0) {
      const sumTallas = data.reduce((sum, t) => sum + (t.stock || 0), 0);
      stockSinAsignar = (producto.stock || 0) - sumTallas;
      
      tallas = data;
      if (stockSinAsignar > 0) {
        tallas = [...data, { talla: 'SIN_TALLA', stock: stockSinAsignar }];
      }
      selectedTalla = tallas[0].talla;
    } else {
      stockSinAsignar = producto.stock || 0;
      tallas = [];
      selectedTalla = '';
    }
  }

  $: if (show && producto) {
    loadTallas(producto.id);
    stockActual = producto.stock || 0;

    cantidadAgregar = '';
    cantidadQuitar = '';
    operacion = 'agregar';
    motivo = '';
    error = '';
    esNuevaTalla = false;
    nuevaTallaInput = '';
    modoAsignacion = false;
    asignaciones = [{ talla: '', cantidad: 1 }];
    permitirAumento = false;
  }

  function close() {
    if (loading) return;
    dispatch('close');
  }

  function resetForm() {
    tallas = [];
    selectedTalla = '';
    cantidadAgregar = '';
    cantidadQuitar = '';
    operacion = 'agregar';
    motivo = '';
    error = '';
    esNuevaTalla = false;
    nuevaTallaInput = '';
    modoAsignacion = false;
    asignaciones = [{ talla: '', cantidad: 1 }];
    permitirAumento = false;
  }

  function addAsignacionRow() {
    asignaciones = [...asignaciones, { talla: '', cantidad: 1 }];
  }

  function removeAsignacionRow(index: number) {
    asignaciones = asignaciones.filter((_, i) => i !== index);
  }

  async function handleSubmit() {
    if (!modoAsignacion && !validateForm()) return;

    loading = true;
    error = '';

    try {
      if (modoAsignacion) {
        const validAsignaciones = asignaciones.filter(a => a.talla.trim() && a.cantidad > 0);
        if (validAsignaciones.length === 0) {
          throw new Error('Debe agregar al menos una asignación válida con nombre de talla y cantidad.');
        }
        if (!permitirAumento && totalAsignado > stockSinAsignar) {
          throw new Error('La cantidad total a asignar supera el stock sin asignar disponible.');
        }
        
        const { error: rpcError } = await supabase.rpc('asignar_stock_a_tallas', {
          _id_producto: producto.id,
          _id_usuario: $authStore.profile?.id,
          _asignaciones: validAsignaciones,
          _permitir_aumento: permitirAumento
        });
        
        if (rpcError) throw rpcError;
        
        let aumento = 0;
        if (permitirAumento && totalAsignado > stockSinAsignar) {
          aumento = totalAsignado - stockSinAsignar;
        }
        dispatch('saved', { nuevoStock: (producto.stock || 0) + aumento });
        resetForm();
        loading = false;
        return;
      }

      const cantidad = operacion === 'agregar' 
        ? parseFloat(cantidadAgregar) 
        : parseFloat(cantidadQuitar);

      let tallaParaActualizar = selectedTalla === 'SIN_TALLA' ? null : selectedTalla;
      
      if (esNuevaTalla && nuevaTallaInput.trim()) {
        const tallaNombre = nuevaTallaInput.trim();
        // Insert new talla with 0 stock
        const { error: insertError } = await supabase.from('producto_tallas').insert({
           id_producto: producto.id,
           talla: tallaNombre,
           stock: 0
        });
        
        if (insertError) {
          throw new Error('Error al crear la nueva talla. Puede que ya exista.');
        }
        tallaParaActualizar = tallaNombre;
      }

      // Usar RPC para actualización atómica e historial
      const { error: rpcError } = await supabase.rpc('actualizar_stock', {
        _id_producto: producto.id,
        _cantidad: cantidad,
        _tipo_movimiento: operacion === 'agregar' ? 'ENTRADA' : 'SALIDA',
        _motivo: motivo || (operacion === 'agregar' ? 'Ingreso de stock' : 'Retiro de stock'),
        ...((tallas.length > 0 || esNuevaTalla) && tallaParaActualizar ? { _talla: tallaParaActualizar } : {}),
        _id_usuario: $authStore.profile?.id
      });

      if (rpcError) throw rpcError;

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

    if (esNuevaTalla && !nuevaTallaInput.trim()) {
      error = 'Debe ingresar el nombre de la nueva talla';
      return false;
    }

    if (!esNuevaTalla && tallas.length > 0 && !selectedTalla) {
      error = 'Debe seleccionar una talla';
      return false;
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
              <p class="text-sm text-gray-600">Stock global: <span class="font-semibold">{producto?.stock || 0}</span></p>
            </div>
          </div>
        </div>

        {#if stockSinAsignar > 0}
          <div class="flex border-b mb-6">
            <button 
              type="button"
              class="px-4 py-2 text-sm font-medium border-b-2 {modoAsignacion ? 'border-transparent text-gray-500 hover:text-gray-700' : 'border-primary-500 text-primary-600'}"
              on:click={() => modoAsignacion = false}
            >
              Operación Individual
            </button>
            <button 
              type="button"
              class="px-4 py-2 text-sm font-medium border-b-2 {modoAsignacion ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
              on:click={() => modoAsignacion = true}
            >
              Distribuir Stock ({stockSinAsignar} sin asignar)
            </button>
          </div>
        {/if}

        {#if modoAsignacion}
          <div class="mb-6">
            <p class="text-sm text-gray-600 mb-4">Tienes <strong>{stockSinAsignar}</strong> unidades físicas en tu inventario sin una talla específica asignada. Usa este panel para distribuirlas en las tallas correctas.</p>
            
            <div class="space-y-3 mb-4">
              {#each asignaciones as asignacion, i}
                <div class="flex items-center space-x-2">
                  <div class="flex-1">
                    <input type="text" bind:value={asignacion.talla} placeholder="Nombre de talla (ej. 38, M)" class="input" required />
                  </div>
                  <div class="w-32">
                    <input type="number" bind:value={asignacion.cantidad} min="1" class="input" required />
                  </div>
                  <button type="button" class="p-2 text-gray-400 hover:text-danger-600 transition-colors" on:click={() => removeAsignacionRow(i)}>
                    <X class="h-5 w-5" />
                  </button>
                </div>
              {/each}
            </div>
            
            <button type="button" class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center mb-6" on:click={addAsignacionRow}>
              <Plus class="h-4 w-4 mr-1" /> Agregar otra talla
            </button>

            <div class="bg-gray-50 p-4 rounded-lg mb-4 border {asignacionValida ? 'border-gray-200' : 'border-danger-300'}">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700">Total a distribuir:</span>
                <span class="font-bold {asignacionValida ? 'text-gray-900' : 'text-danger-600'}">{totalAsignado} / {stockSinAsignar}</span>
              </div>
              
              <label class="flex items-start space-x-3 mt-4 pt-4 border-t border-gray-200 cursor-pointer">
                <div class="flex items-center h-5">
                  <input type="checkbox" bind:checked={permitirAumento} class="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                </div>
                <div class="text-sm">
                  <span class="font-medium text-gray-900">Permitir aumentar stock global</span>
                  <p class="text-gray-500">Si distribuyes más de {stockSinAsignar} unidades, el sistema añadirá la diferencia a tu inventario general automáticamente.</p>
                </div>
              </label>
            </div>
          </div>
        {:else}
        {#if tallas.length > 0 || esNuevaTalla}
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">
              {esNuevaTalla ? 'Nueva Talla' : 'Seleccionar Talla'}
            </label>
            <button 
              type="button" 
              class="text-sm text-primary-600 hover:text-primary-700 font-medium" 
              on:click={() => {esNuevaTalla = !esNuevaTalla; error = '';}}
            >
              {esNuevaTalla ? 'Seleccionar existente' : '+ Nueva Talla'}
            </button>
          </div>
          
          {#if esNuevaTalla}
            <input 
              type="text" 
              bind:value={nuevaTallaInput} 
              placeholder="Ej: 42, L, XL" 
              class="input" 
              disabled={loading} 
              required={esNuevaTalla}
            />
            <p class="text-xs text-gray-500 mt-1">La talla iniciará con stock 0 y se le agregará/quitará la cantidad indicada.</p>
          {:else}
            <select bind:value={selectedTalla} class="input" disabled={loading}>
              {#each tallas as t}
                <option value={t.talla}>
                  {t.talla === 'SIN_TALLA' ? 'Sin talla asignada' : `Talla ${t.talla}`} (Stock actual: {t.stock})
                </option>
              {/each}
            </select>
          {/if}
        </div>
        {:else}
        <div class="mb-6">
           <button 
            type="button" 
            class="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors" 
            on:click={() => esNuevaTalla = true}
           >
              + Crear Talla
           </button>
           <p class="text-xs text-center text-gray-500 mt-2">Este producto no tiene tallas detalladas actualmente.</p>
        </div>
        {/if}

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
              disabled={loading || (esNuevaTalla)}
            >
              <Minus class="h-5 w-5 mx-auto mb-1" />
              <span class="text-sm font-medium">Quitar Stock</span>
            </button>
          </div>
          {#if operacion === 'quitar' && esNuevaTalla}
            <p class="text-xs text-danger-500 mt-2">No puede quitar stock de una talla nueva.</p>
          {/if}
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
            disabled={loading || (operacion === 'quitar' && esNuevaTalla)}
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
            <span class="text-sm text-blue-700">Stock {esNuevaTalla || tallas.length > 0 ? 'de la talla' : 'actual'}:</span>
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

        {/if} <!-- Fin de modoAsignacion -->

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
            disabled={loading || (modoAsignacion ? !asignacionValida : !stockFinalValido) || (!modoAsignacion && operacion === 'quitar' && esNuevaTalla)}
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Actualizando...
            {:else}
              {modoAsignacion ? 'Guardar Asignación' : (operacion === 'agregar' ? 'Agregar Stock' : 'Quitar Stock')}
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
