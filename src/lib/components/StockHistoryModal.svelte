<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { X, Calendar, Search, Filter, History } from 'lucide-svelte';
  import { formatDate } from '$lib/utils/dateUtils';

  export let show = false;
  export let producto: any = null;

  const dispatch = createEventDispatcher();

  let loading = false;
  let movimientos: any[] = [];
  let error = '';
  
  // Filtros
  let fechaFiltro = '';

  $: if (show && producto) {
    loadMovimientos();
  }

  function close() {
    dispatch('close');
  }

  async function loadMovimientos() {
    if (!producto) return;
    loading = true;
    error = '';
    
    try {
      let query = supabase
        .from('movimientos_inventario')
        .select(`
          *,
          usuarios(nombres)
        `)
        .eq('id_producto', producto.id)
        .order('fecha', { ascending: false });

      if (fechaFiltro) {
        // Parsear manualmente la fecha del input (YYYY-MM-DD) para evitar problemas de timezone
        const [year, month, day] = fechaFiltro.split('-').map(Number);
        
        // 00:00 Bolivia = 04:00 UTC
        const inicioUTC = new Date(Date.UTC(year, month - 1, day, 4, 0, 0, 0));
        
        // 23:59:59 Bolivia = 03:59:59 UTC (día siguiente)
        const finUTC = new Date(Date.UTC(year, month - 1, day, 27, 59, 59, 999));
        
        query = query
          .gte('fecha', inicioUTC.toISOString())
          .lte('fecha', finUTC.toISOString());
      }
      
      const { data, error: dbError } = await query;
      
      if (dbError) throw dbError;
      movimientos = data || [];
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      error = err.message || 'Error al cargar el historial';
    } finally {
      loading = false;
    }
  }

  function handleFilterChange() {
    loadMovimientos();
  }
  
  function clearFilter() {
    fechaFiltro = '';
    loadMovimientos();
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          <History class="h-6 w-6 text-primary-600 mr-2" />
          <h2 class="text-xl font-semibold text-gray-900">Historial de Stock</h2>
        </div>
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors"
          on:click={close}
        >
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="mb-6 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div>
            <h3 class="font-medium text-gray-900">{producto?.nombre}</h3>
            <p class="text-sm text-gray-600">Stock Actual: <span class="font-bold">{producto?.stock}</span></p>
          </div>
          
          <!-- Filtro de fecha -->
          <div class="flex items-center space-x-2">
            <div class="relative">
              <Calendar class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="date" 
                bind:value={fechaFiltro}
                on:change={handleFilterChange}
                class="pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {#if fechaFiltro}
              <button 
                on:click={clearFilter}
                class="p-2 text-gray-500 hover:text-red-500"
                title="Limpiar filtro"
              >
                <X class="h-4 w-4" />
              </button>
            {/if}
          </div>
        </div>

        {#if loading}
          <div class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        {:else if error}
          <div class="bg-red-50 text-red-700 p-4 rounded-lg text-center">
            {error}
          </div>
        {:else if movimientos.length === 0}
          <div class="text-center py-12 text-gray-500">
            <History class="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No hay movimientos registrados {#if fechaFiltro}para esta fecha{/if}</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each movimientos as mov}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(mov.fecha)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {mov.tipo_movimiento === 'ENTRADA' ? 'bg-green-100 text-green-800' : 
                         mov.tipo_movimiento === 'SALIDA' ? 'bg-red-100 text-red-800' : 
                         mov.tipo_movimiento === 'VENTA' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                        {mov.tipo_movimiento}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={mov.motivo}>
                      {mov.motivo || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium {mov.stock_nuevo > mov.stock_anterior ? 'text-green-600' : 'text-red-600'}">
                      {mov.stock_nuevo > mov.stock_anterior ? '+' : ''}{mov.cantidad}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                      {mov.stock_nuevo}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mov.usuarios?.nombres || 'Sistema'}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
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
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
  }
</style>
