<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { 
    TrendingUp, 
    DollarSign, 
    ShoppingCart, 
    Users, 
    Package, 
    Calendar,
    BarChart3,
    Eye,
    Plus
  } from 'lucide-svelte';

  let loading = true;
  let dashboardData: any = null;
  let error = '';
  let selectedPeriod = '7'; // días

  onMount(async () => {
    await loadDashboardData();
    loading = false;
  });

  async function loadDashboardData() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedPeriod));

      const { data, error: dbError } = await supabase.rpc('get_dashboard_stats', {
        _fecha_inicio: startDate.toISOString().split('T')[0],
        _fecha_fin: endDate.toISOString().split('T')[0]
      });

      if (dbError) throw dbError;
      
      console.log('Dashboard data:', data);
      
      dashboardData = Array.isArray(data) ? data[0] : data;
    } catch (err: any) {
      error = err.message || 'Error al cargar datos del inicio';
      console.error('Error loading inicio:', err);
    }
  }

  async function handlePeriodChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedPeriod = target.value;
    loading = true;
    await loadDashboardData();
    loading = false;
  }

  function navigateToProducts() {
    goto('/productos');
  }

  function navigateToReports() {
    goto('/reportes');
  }

  function navigateToPOS() {
    goto('/pos');
  }

  function navigateToUsers() {
    goto('/usuarios');
  }

  // Formatear números
  function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toFixed(2);
  }

  function formatNumber(num: number): string {
    return num.toLocaleString();
  }
</script>

<svelte:head>
  <title>Inicio - {$authStore.profile?.empresa?.nombre || 'POS'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Inicio</h1>
          <p class="text-gray-600 mt-1">{$authStore.profile?.empresa?.nombre}</p>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Selector de período -->
          <div class="flex items-center space-x-2">
            <Calendar class="h-5 w-5 text-gray-400" />
            <select 
              class="input text-sm"
              value={selectedPeriod}
              on:change={handlePeriodChange}
              disabled={loading}
            >
              <option value="1">Último día</option>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
          </div>
          
          <button class="btn-primary" on:click={navigateToPOS}>
            <ShoppingCart class="h-5 w-5 mr-2" />
            Ir al POS
          </button>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    {:else if error}
      <div class="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
        <p class="text-danger-700">{error}</p>
      </div>
    {:else if dashboardData}
      <!-- Métricas principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Ventas -->
        <div class="card p-6">
          <div class="flex items-center">
            <div class="p-2 bg-primary-100 rounded-lg">
              <DollarSign class="h-6 w-6 text-primary-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Ventas</p>
              <p class="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.total_ventas || 0)}
              </p>
            </div>
          </div>
        </div>

        <!-- Ganancia Bruta -->
        <div class="card p-6">
          <div class="flex items-center">
            <div class="p-2 bg-success-100 rounded-lg">
              <TrendingUp class="h-6 w-6 text-success-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Ganancia Bruta</p>
              <p class="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.ganancia_bruta || 0)}
              </p>
            </div>
          </div>
        </div>

        <!-- Número de Ventas -->
        <div class="card p-6">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart class="h-6 w-6 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Número de Ventas</p>
              <p class="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.total_ventas || 0)}
              </p>
            </div>
          </div>
        </div>

        <!-- Productos en Stock -->
        <div class="card p-6">
          <div class="flex items-center">
            <div class="p-2 bg-orange-100 rounded-lg">
              <Package class="h-6 w-6 text-orange-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Unidades en Stock</p>
              <p class="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.inventario?.unidades || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Ventas por Cajero -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <Users class="h-5 w-5 mr-2" />
              Ventas por Cajero
            </h3>
          </div>
          
          {#if dashboardData.ventas_por_cajero && dashboardData.ventas_por_cajero.length > 0}
            <div class="space-y-3">
              {#each dashboardData.ventas_por_cajero as cajero}
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium text-gray-900">{cajero.cajero}</p>
                    <p class="text-sm text-gray-600">{cajero.ventas_count} ventas</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-primary-600">{formatCurrency(cajero.total_ventas || 0)}</p>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-gray-500 text-center py-4">No hay datos de ventas por cajero</p>
          {/if}
        </div>

        <!-- Estado de Caja -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign class="h-5 w-5 mr-2" />
              Estado de Caja Actual
            </h3>
          </div>
          
          {#if dashboardData.caja_hoy && dashboardData.caja_hoy.abierta !== false}
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Estado:</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  Abierta
                </span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Caja:</span>
                <span class="font-medium">{dashboardData.caja_hoy.descripcion_caja || 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Ventas Efectivo:</span>
                <span class="font-medium">{formatCurrency(dashboardData.caja_hoy?.ventas_efectivo_hoy || 0)}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Ventas QR:</span>
                <span class="font-medium text-primary-600">{formatCurrency(dashboardData.caja_hoy?.ventas_qr_hoy || 0)}</span>
              </div>
            </div>
          {:else}
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Estado:</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Cerrada
                </span>
              </div>
              <p class="text-gray-500 text-sm">No hay caja abierta actualmente</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="mt-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button class="card p-4 hover:shadow-md transition-shadow text-left" on:click={navigateToProducts}>
            <Package class="h-8 w-8 text-primary-600 mb-2" />
            <h4 class="font-medium text-gray-900">Gestionar Productos</h4>
            <p class="text-sm text-gray-600">Agregar, editar y gestionar inventario</p>
          </button>
          
          <button class="card p-4 hover:shadow-md transition-shadow text-left" on:click={navigateToReports}>
            <BarChart3 class="h-8 w-8 text-success-600 mb-2" />
            <h4 class="font-medium text-gray-900">Ver Reportes</h4>
            <p class="text-sm text-gray-600">Análisis detallado de ventas</p>
          </button>
          
          <button class="card p-4 hover:shadow-md transition-shadow text-left" on:click={navigateToUsers}>
            <Users class="h-8 w-8 text-blue-600 mb-2" />
            <h4 class="font-medium text-gray-900">Gestionar Usuarios</h4>
            <p class="text-sm text-gray-600">Administrar cajeros y permisos</p>
          </button>
          
          <button class="card p-4 hover:shadow-md transition-shadow text-left" on:click={navigateToPOS}>
            <ShoppingCart class="h-8 w-8 text-orange-600 mb-2" />
            <h4 class="font-medium text-gray-900">Punto de Venta</h4>
            <p class="text-sm text-gray-600">Realizar ventas directamente</p>
          </button>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-500">No hay datos disponibles</p>
      </div>
    {/if}
  </main>
</div>