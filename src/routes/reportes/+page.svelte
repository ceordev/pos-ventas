<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { 
    BarChart3, 
    Calendar, 
    Download, 
    Filter, 
    TrendingUp, 
    DollarSign,
    ShoppingCart,
    User,
    Eye,
    X,
    Package
  } from 'lucide-svelte';
  import { 
    formatDate as formatBoliviaDate, 
    getStartOfDay, 
    getEndOfDay, 
    getCurrentBoliviaTime,
    isToday 
  } from '$lib/utils/dateUtils';

  let loading = true;
  let ventasData: any[] = [];
  let filteredVentas: any[] = [];
  let totalesData: any = null;
  let error = '';
  
  // Filtros
  let fechaInicio = '';
  let fechaFin = '';
  let cajeroFiltro = '';
  let metodoPagoFiltro = '';
  
  // Datos para filtros
  let cajeros: any[] = [];
  let metodosPago = ['Efectivo', 'QR', 'Mixto'];
  
  // Paginación
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalItems = 0;
  
  // Meses del año para filtro rápido
  const anioActual = new Date().getFullYear();
  const mesActualNum = new Date().getMonth() + 1;
  const mesesAnio = [
    { num: 1, label: 'Enero' }, { num: 2, label: 'Febrero' }, { num: 3, label: 'Marzo' },
    { num: 4, label: 'Abril' }, { num: 5, label: 'Mayo' }, { num: 6, label: 'Junio' },
    { num: 7, label: 'Julio' }, { num: 8, label: 'Agosto' }, { num: 9, label: 'Septiembre' },
    { num: 10, label: 'Octubre' }, { num: 11, label: 'Noviembre' }, { num: 12, label: 'Diciembre' }
  ];
  let mesesDisponibles = mesesAnio.slice(0, mesActualNum);

  async function selectMonth(mesNum: number) {
    const yyyy = anioActual;
    const mm = String(mesNum).padStart(2, '0');
    // Último día del mes
    const endOfMonth = new Date(yyyy, mesNum, 0); 
    const endDd = String(endOfMonth.getDate()).padStart(2, '0');
    
    fechaInicio = `${yyyy}-${mm}-01`;
    fechaFin = `${yyyy}-${mm}-${endDd}`;
    
    await handleFilterChange();
  }

  $: activeMonthNum = (() => {
     if (!fechaInicio || !fechaFin) return null;
     const [yI, mI, dI] = fechaInicio.split('-');
     const [yF, mF, dF] = fechaFin.split('-');
     
     if (yI === yF && mI === mF && dI === '01') {
         const nMes = parseInt(mI, 10);
         const endObj = new Date(parseInt(yI, 10), nMes, 0);
         if (parseInt(dF, 10) === endObj.getDate()) {
             return nMes;
         }
     }
     return null;
  })();

  // Modal de detalle
  let showDetailModal = false;
  let selectedVenta: any = null;

  // Reactive computed values
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  $: paginatedVentas = filteredVentas.slice(startIndex, endIndex);

  onMount(async () => {
    // Establecer fechas por defecto (mes actual completo)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const endOfMonth = new Date(yyyy, today.getMonth() + 1, 0);
    const endDd = String(endOfMonth.getDate()).padStart(2, '0');
    
    fechaInicio = `${yyyy}-${mm}-01`;
    fechaFin = `${yyyy}-${mm}-${endDd}`;
    
    await Promise.all([
      loadCajeros(),
      loadReportData()
    ]);
    loading = false;
  });

  async function loadCajeros() {
    try {
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .select('id, nombres')
        .eq('id_rol', 2) // Cajeros
        .eq('estado', 'ACTIVO'); // Only active users

      if (dbError) throw dbError;
      cajeros = data || [];
    } catch (err: any) {
      console.error('Error loading cajeros:', err);
    }
  }

  async function loadReportData() {
    try {
      console.log('🔄 Cargando datos de reportes...');
      console.log('🔍 Filtros aplicados:', { fechaInicio, fechaFin, cajeroFiltro, metodoPagoFiltro });
      
      // Ajustar las fechas para compensar el desfase de zona horaria
      let fechaInicioAjustada = fechaInicio;
      let fechaFinAjustada = fechaFin;
      
      if (fechaInicio && fechaFin) {
        // Parsear manualmente para evitar problemas de timezone "YYYY-MM-DD"
        const [yearIni, monthIni, dayIni] = fechaInicio.split('-').map(Number);
        const [yearFin, monthFin, dayFin] = fechaFin.split('-').map(Number);

        // Ajustar para compensar el desfase de zona horaria (Bolivia UTC-4)
        // 00:00 Bolivia = 04:00 UTC
        const inicioUTC = new Date(Date.UTC(
          yearIni,
          monthIni - 1, // Meses 0-11
          dayIni, 
          4, 0, 0, 0
        ));
        
        // 23:59:59 Bolivia = 03:59:59 UTC (día siguiente) -> usamos 27:59:59 del mismo día para que overflow
        const finUTC = new Date(Date.UTC(
          yearFin,
          monthFin - 1,
          dayFin,
          27, 59, 59, 999
        ));
        
        fechaInicioAjustada = inicioUTC.toISOString();
        fechaFinAjustada = finUTC.toISOString();
        
        console.log('🔍 Fechas ajustadas para BD:', {
          original: { fechaInicio, fechaFin },
          ajustada: { fechaInicioAjustada, fechaFinAjustada }
        });
      }
      
      // Cargar historial de ventas
      const { data: ventasResult, error: ventasError } = await supabase.rpc('get_sales_history', {
        _fecha_inicio: fechaInicioAjustada,
        _fecha_fin: fechaFinAjustada
      });

      if (ventasError) throw ventasError;
      
      // Cargar totales
      const { data: totalesResult, error: totalesError } = await supabase.rpc('get_sales_history_totals', {
        _fecha_inicio: fechaInicioAjustada,
        _fecha_fin: fechaFinAjustada
      });

      if (totalesError) throw totalesError;
      
      console.log('📊 Datos cargados:', {
        ventas: ventasResult?.length || 0,
        totales_crudos: totalesResult
      });
      
      ventasData = ventasResult || [];
      // Ya no usamos la suma cruda del backend, calcularemos en client-side
      totalItems = ventasData.length;
      
      // Aplicar filtros (esto también calculará los totales)
      applyFilters();
    } catch (err: any) {
      error = err.message || 'Error al cargar datos de reportes';
      console.error('Error loading report data:', err);
    }
  }

  function applyFilters() {
    let filtered = [...ventasData];
    
    if (cajeroFiltro) {
      filtered = filtered.filter(venta => venta.cajero === cajeroFiltro);
    }
    
    if (metodoPagoFiltro) {
      filtered = filtered.filter(venta => venta.tipo_pago === metodoPagoFiltro);
    }
    
    filteredVentas = filtered;
    totalItems = filtered.length;
    currentPage = 1; // Reset to first page when filtering
    
    calculateTotals(filtered);
  }

  function calculateTotals(dataTarget: any[]) {
    let tVendido = 0;
    let tGanancia = 0;
    let tPares = 0;

    dataTarget.forEach(venta => {
      tVendido += Number(venta.monto_total) || 0;
      tGanancia += calcularGananciaVenta(venta);
      
      if (venta.detalles && Array.isArray(venta.detalles)) {
         venta.detalles.forEach((d: any) => {
             tPares += Number(d.cantidad) || 0;
         });
      }
    });

    totalesData = {
      total_vendido: tVendido,
      total_ganancia: tGanancia,
      ventas_count: dataTarget.length,
      total_pares: tPares
    };
  }

  async function handleFilterChange() {
    loading = true;
    await loadReportData();
    loading = false;
  }

  function clearFilters() {
    cajeroFiltro = '';
    metodoPagoFiltro = '';
    applyFilters();
  }

  function showVentaDetail(venta: any) {
    selectedVenta = venta;
    showDetailModal = true;
  }

  function closeDetailModal() {
    showDetailModal = false;
    selectedVenta = null;
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function exportToCSV() {
    // Implementar exportación a CSV
    const csvContent = generateCSV();
    downloadCSV(csvContent, `ventas_${fechaInicio}_${fechaFin}.csv`);
  }

  function generateCSV(): string {
    const headers = ['Fecha', 'Hora', 'Cajero', 'Total', 'Método de Pago', 'Items'];
    const rows = ventasData.map(venta => [
      formatBoliviaDate(venta.fecha_venta, false), // Solo fecha
      formatBoliviaDate(venta.fecha_venta, true).split(', ')[1], // Solo hora
      venta.cajero_nombre,
      venta.total.toFixed(2),
      venta.metodo_pago,
      venta.items?.length || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatCurrency(amount: number | null | undefined): string {
    if (amount == null || isNaN(amount)) {
      return '0.00';
    }
    return amount.toFixed(2);
  }

  function formatDateTime(dateString: string): { date: string, time: string } {
    // Usar la función de fecha de Bolivia
    const formatted = formatBoliviaDate(dateString, true);
    const [date, time] = formatted.split(', ');
    return { date, time };
  }

  function calcularGananciaVenta(venta: any): number {
    if (!venta.detalles || !Array.isArray(venta.detalles)) {
      return 0;
    }
    
    return venta.detalles.reduce((sum: number, detalle: any) => {
      const total = parseFloat(detalle.total) || 0;
      const cantidad = parseFloat(detalle.cantidad) || 0;
      const precioCompra = parseFloat(detalle.precio_compra_unitario) || 0;
      
      if (precioCompra > 0) {
        return sum + (total - (cantidad * precioCompra));
      } else {
         // Si no tiene precio de compra por alguna razón, usar margen del 30% como fallback
         const costoEstimado = total * 0.7; 
         return sum + (total - costoEstimado);
      }
    }, 0);
  }
</script>

<svelte:head>
  <title>Reportes de Ventas</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 class="h-8 w-8 mr-3" />
            Reportes de Ventas
          </h1>
          <p class="text-gray-600 mt-1">Análisis detallado de tus ventas</p>
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

    <!-- Filtros -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Fecha inicio -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha Inicio
          </label>
          <div class="relative">
            <Calendar class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              bind:value={fechaInicio}
              class="input pl-10"
              disabled={loading}
            />
          </div>
        </div>
        
        <!-- Fecha fin -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha Fin
          </label>
          <div class="relative">
            <Calendar class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              bind:value={fechaFin}
              class="input pl-10"
              disabled={loading}
            />
          </div>
        </div>
        
        <!-- Cajero -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Cajero
          </label>
          <select bind:value={cajeroFiltro} class="input" disabled={loading}>
            <option value="">Todos los cajeros</option>
            {#each cajeros as cajero}
              <option value={cajero.nombres}>{cajero.nombres}</option>
            {/each}
          </select>
        </div>
        
        <!-- Método de pago -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Método de Pago
          </label>
          <select bind:value={metodoPagoFiltro} class="input" disabled={loading}>
            <option value="">Todos los métodos</option>
            {#each metodosPago as metodo}
              <option value={metodo}>{metodo}</option>
            {/each}
          </select>
        </div>
        
        <!-- Acciones -->
        <div class="flex items-end space-x-2">
          <button class="btn-primary" on:click={handleFilterChange} disabled={loading}>
            <Filter class="h-4 w-4 mr-2" />
            Filtrar
          </button>
          {#if cajeroFiltro || metodoPagoFiltro}
            <button class="btn-secondary" on:click={clearFilters}>
              <X class="h-4 w-4" />
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Tags de meses del año actual -->
      <div class="mt-5 pt-5 border-t border-gray-100">
        <p class="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider flex items-center">
           <Calendar class="h-3 w-3 mr-1" /> Filtros Rápidos ({anioActual})
        </p>
        <div class="flex flex-wrap gap-2">
          {#each mesesDisponibles as mes}
            <button
              class="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 border cursor-pointer {activeMonthNum === mes.num ? 'bg-primary-600 text-white border-primary-600 shadow-sm transform scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}"
              on:click={() => selectMonth(mes.num)}
              disabled={loading}
            >
              {mes.label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    {:else}
      <!-- Resumen de totales -->
      {#if totalesData}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-2 bg-primary-100 rounded-lg">
                <DollarSign class="h-6 w-6 text-primary-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total Ventas</p>
                <p class="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalesData.total_vendido || 0)}
                </p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-2 bg-success-100 rounded-lg">
                <TrendingUp class="h-6 w-6 text-success-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Ganancia Total</p>
                <p class="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalesData.total_ganancia || 0)}
                </p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart class="h-6 w-6 text-blue-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total Transacciones</p>
                <p class="text-2xl font-bold text-gray-900">
                  {totalesData.ventas_count || 0}
                </p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <Package class="h-6 w-6 text-purple-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Pares / Items Vendidos</p>
                <p class="text-2xl font-bold text-gray-900">
                  {totalesData.total_pares || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Lista de ventas estilo historial del cajero -->
      {#if paginatedVentas.length === 0}
        <div class="bg-white rounded-lg shadow-sm border p-12 text-center">
          <BarChart3 class="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay ventas</h3>
          <p class="text-gray-600">No se encontraron ventas en el período seleccionado</p>
        </div>
      {:else}
        <!-- Header con información de paginación -->
        <div class="mb-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">
              Historial de Ventas ({totalItems} registros)
            </h3>
            <p class="text-sm text-gray-600">
              Mostrando {startIndex + 1}-{endIndex} de {totalItems}
            </p>
          </div>
        </div>

        <!-- Lista de ventas en formato card -->
        <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Detalle de Ventas</h2>
          </div>
          
          <div class="divide-y divide-gray-200">
            {#each paginatedVentas as venta}
              {@const dateTime = formatDateTime(venta.fecha)}
              <div class="p-6 hover:bg-gray-50">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <div class="flex items-center space-x-4 mb-3">
                      <div class="flex items-center space-x-2">
                        <Calendar class="h-4 w-4 text-gray-400" />
                        <span class="text-sm text-gray-600">{dateTime.date} - {dateTime.time}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <User class="h-4 w-4 text-gray-400" />
                        <span class="text-sm text-gray-600">{venta.cajero}</span>
                      </div>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        {venta.tipo_pago === 'Efectivo' ? 'bg-green-100 text-green-800' : 
                         venta.tipo_pago === 'QR' ? 'bg-blue-100 text-blue-800' : 
                         'bg-purple-100 text-purple-800'}">
                        {venta.tipo_pago}
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p class="text-sm text-gray-600">Total Venta</p>
                        <p class="font-semibold text-lg text-gray-900">{formatCurrency(venta.monto_total || 0)}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-600">Efectivo</p>
                        <p class="font-medium text-gray-900">{formatCurrency(venta.monto_efectivo || 0)}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-600">QR</p>
                        <p class="font-medium text-gray-900">{formatCurrency(venta.monto_qr || 0)}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-600">Ganancia</p>
                        <p class="font-medium text-success-600">{formatCurrency(calcularGananciaVenta(venta))}</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Botón de ver detalle -->
                  <button
                    class="ml-4 p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
                    on:click={() => showVentaDetail(venta)}
                    title="Ver detalle completo"
                  >
                    <Eye class="h-5 w-5" />
                  </button>
                </div>

                <!-- Detalles de productos -->
                {#if venta.detalles && venta.detalles.length > 0}
                  <div class="mt-4">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">
                      Productos vendidos ({venta.detalles.length}):
                    </h4>
                    <div class="bg-gray-50 rounded-lg p-3">
                      <div class="space-y-2">
                        {#each venta.detalles as detalle}
                          <div class="flex justify-between items-start text-sm">
                            <div class="flex-1">
                              <div class="flex items-center space-x-2">
                                <Package class="h-3 w-3 text-gray-400" />
                                <span class="font-medium">{detalle.nombre || 'Producto'}</span>
                                <span class="text-gray-500">x{detalle.cantidad || 0}</span>
                                {#if detalle.descuento_aplicado > 0}
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    -{detalle.porcentaje_descuento.toFixed(0)}%
                                  </span>
                                {/if}
                              </div>
                              {#if detalle.observacion}
                                <p class="text-xs text-gray-600 italic mt-1 ml-5">"{detalle.observacion}"</p>
                              {/if}
                            </div>
                            <div class="text-right ml-4">
                              {#if detalle.descuento_aplicado > 0}
                                <div class="text-xs text-gray-400 line-through">{formatCurrency(detalle.precio_original || detalle.precio_venta_unitario)}</div>
                              {/if}
                              <span class="text-gray-600">{formatCurrency(detalle.precio_venta_unitario || 0)} c/u</span>
                              <span class="font-medium ml-2">{formatCurrency(detalle.total || 0)}</span>
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
          
          <!-- Paginación -->
          {#if totalPages > 1}
            <div class="px-6 py-4 border-t bg-gray-50">
              <div class="flex items-center justify-between">
                <div class="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </div>
                <div class="flex space-x-2">
                  <button
                    class="btn-secondary text-sm"
                    on:click={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <button
                    class="btn-secondary text-sm"
                    on:click={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </main>
</div>

<!-- Modal de detalle de venta -->
{#if showDetailModal && selectedVenta}
  <div class="modal-overlay" on:click={closeDetailModal}>
    <div class="modal-content max-w-2xl" on:click|stopPropagation>
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-semibold text-gray-900">Detalle de Venta</h2>
        <button class="text-gray-400 hover:text-gray-600" on:click={closeDetailModal}>
          <X class="h-6 w-6" />
        </button>
      </div>
      
      <div class="p-6">
        <!-- Información de la venta -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p class="text-sm text-gray-600">Fecha y Hora</p>
            <p class="font-medium">{formatDateTime(selectedVenta.fecha).date} {formatDateTime(selectedVenta.fecha).time}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Cajero</p>
            <p class="font-medium">{selectedVenta.cajero}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Método de Pago</p>
            <p class="font-medium">{selectedVenta.tipo_pago}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total</p>
            <p class="font-bold text-primary-600">{formatCurrency(selectedVenta?.monto_total || 0)}</p>
          </div>
        </div>
        
        <!-- Items de la venta -->
        {#if selectedVenta.detalles && selectedVenta.detalles.length > 0}
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Detalle de Venta - Productos Vendidos</h3>
            <div class="space-y-3">
              {#each selectedVenta.detalles as item}
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <Package class="h-4 w-4 text-gray-400" />
                    <div>
                      <div class="flex items-center space-x-2">
                        <p class="font-medium">{item.nombre}</p>
                        {#if item.descuento_aplicado > 0}
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            -{item.porcentaje_descuento.toFixed(0)}%
                          </span>
                        {/if}
                      </div>
                      <div class="text-sm text-gray-600">
                        {#if item.descuento_aplicado > 0}
                          <p class="line-through">{formatCurrency(item.precio_original || item.precio_venta_unitario)} x {item.cantidad}</p>
                          <p class="text-red-600">{formatCurrency(item.precio_venta_unitario || 0)} x {item.cantidad} (con descuento)</p>
                        {:else}
                          <p>{formatCurrency(item.precio_venta_unitario || 0)} x {item.cantidad}</p>
                        {/if}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    {#if item.descuento_aplicado > 0}
                      <p class="text-xs text-gray-400 line-through">{formatCurrency((item.precio_original || item.precio_venta_unitario) * item.cantidad)}</p>
                    {/if}
                    <p class="font-medium">{formatCurrency(item.total || 0)}</p>
                  </div>
                </div>
              {/each}
            </div>
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
    z-index: 50;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }
</style>