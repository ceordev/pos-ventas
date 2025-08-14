<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { authStore } from '$lib/stores/auth';
  import { 
    Calendar, 
    DollarSign, 
    ShoppingCart, 
    Clock, 
    Package,
    ArrowLeft
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let loading = true;
  let ventas: any[] = [];
  let totalVentas = 0;
  let totalGanancia = 0;
  let error = '';

  onMount(async () => {
    await loadHistorialVentas();
    loading = false;
  });

  async function loadHistorialVentas() {
    try {
      // Obtener ventas de los últimos 3 días para el usuario actual
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 3);
      
      const { data, error: dbError } = await supabase
        .from('ventas')
        .select(`
          *,
          detalle_venta(
            id_producto,
            cantidad,
            precio_venta_unitario,
            precio_compra_unitario,
            total,
            productos(nombre)
          )
        `)
        .eq('id_usuario', $authStore.profile?.id)
        .gte('fecha', fechaInicio.toISOString())
        .order('fecha', { ascending: false });

      if (dbError) throw dbError;

      ventas = data || [];
      
      // Calcular totales
      totalVentas = ventas.reduce((sum, venta) => sum + venta.monto_total, 0);
      totalGanancia = ventas.reduce((sum, venta) => {
        const gananciaVenta = venta.detalle_venta?.reduce((sumDetalle: number, detalle: any) => {
          return sumDetalle + (detalle.total - (detalle.cantidad * detalle.precio_compra_unitario));
        }, 0) || 0;
        return sum + gananciaVenta;
      }, 0);

    } catch (err: any) {
      error = err.message || 'Error al cargar historial de ventas';
      console.error('Error loading ventas:', err);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  function goBack() {
    goto('/pos');
  }
</script>

<svelte:head>
  <title>Historial de Ventas</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between py-6">
        <div class="flex items-center">
          <button 
            class="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            on:click={goBack}
          >
            <ArrowLeft class="h-5 w-5" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart class="h-8 w-8 mr-3" />
              Mi Historial de Ventas
            </h1>
            <p class="text-gray-600 mt-1">Últimos 3 días - {$authStore.profile?.nombres}</p>
          </div>
        </div>
        
        <div class="text-right">
          <p class="text-sm text-gray-600">Cajero</p>
          <p class="font-medium">{$authStore.profile?.nombres}</p>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if error}
      <div class="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
        <p class="text-danger-700">{error}</p>
      </div>
    {/if}

    <!-- Resumen de estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center">
          <div class="p-2 bg-primary-100 rounded-lg">
            <ShoppingCart class="h-6 w-6 text-primary-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Ventas</p>
            <p class="text-2xl font-bold text-gray-900">{ventas.length}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center">
          <div class="p-2 bg-success-100 rounded-lg">
            <DollarSign class="h-6 w-6 text-success-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Vendido</p>
            <p class="text-2xl font-bold text-gray-900">{totalVentas.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center">
          <div class="p-2 bg-warning-100 rounded-lg">
            <Package class="h-6 w-6 text-warning-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Ganancia Generada</p>
            <p class="text-2xl font-bold text-gray-900">{totalGanancia.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    {:else if ventas.length === 0}
      <div class="bg-white rounded-lg shadow-sm border p-12 text-center">
        <ShoppingCart class="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No hay ventas registradas</h3>
        <p class="text-gray-600">
          No se encontraron ventas en los últimos 3 días.
        </p>
      </div>
    {:else}
      <!-- Lista de ventas -->
      <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Detalle de Ventas</h2>
        </div>
        
        <div class="divide-y divide-gray-200">
          {#each ventas as venta}
            <div class="p-6 hover:bg-gray-50">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                      <Clock class="h-4 w-4 text-gray-400" />
                      <span class="text-sm text-gray-600">{formatDate(venta.fecha)}</span>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {getTipoPago(venta)}
                    </span>
                  </div>
                  
                  <div class="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p class="text-sm text-gray-600">Total Venta</p>
                      <p class="font-semibold text-lg text-gray-900">{venta.monto_total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Efectivo</p>
                      <p class="font-medium text-gray-900">{venta.monto_pagado_efectivo.toFixed(2)}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">QR</p>
                      <p class="font-medium text-gray-900">{venta.monto_pagado_qr.toFixed(2)}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Ganancia</p>
                      <p class="font-medium text-success-600">{calcularGananciaVenta(venta).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detalles de productos -->
              {#if venta.detalle_venta && venta.detalle_venta.length > 0}
                <div class="mt-4">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Productos vendidos:</h4>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div class="space-y-2">
                      {#each venta.detalle_venta as detalle}
                        <div class="flex justify-between items-center text-sm">
                          <div class="flex items-center space-x-2">
                            <span class="font-medium">{detalle.productos?.nombre || 'Producto'}</span>
                            <span class="text-gray-500">x{detalle.cantidad}</span>
                            {#if detalle.descuento_aplicado > 0}
                              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                -{detalle.porcentaje_descuento.toFixed(0)}%
                              </span>
                            {/if}
                          </div>
                          <div class="text-right">
                            {#if detalle.descuento_aplicado > 0}
                              <div class="text-xs text-gray-400 line-through">{(detalle.precio_original || detalle.precio_venta_unitario).toFixed(2)}</div>
                            {/if}
                            <span class="text-gray-600">{detalle.precio_venta_unitario.toFixed(2)} c/u</span>
                            <span class="font-medium ml-2">{detalle.total.toFixed(2)}</span>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </main>
</div>
