<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { posService } from '$lib/stores/pos';
  import { X, DollarSign, TrendingUp, Calculator } from 'lucide-svelte';

  export let show = false;
  export let cajaAbierta: any = null;
  export let usuario: any = null;

  const dispatch = createEventDispatcher();

  let montoFinalEfectivo = '';
  let gastosAdicionales = ''; // ✅ Nuevo campo
  let loading = false;
  let error = '';
  let calculando = false;
  let resultadoCierre: any = null;

  function close() {
    if (loading) return;
    dispatch('close');
    resetForm();
  }

  function resetForm() {
    montoFinalEfectivo = '';
    gastosAdicionales = ''; // ✅ Reset del nuevo campo
    error = '';
    resultadoCierre = null;
  }

  async function calcularCierre() {
    if (!montoFinalEfectivo || parseFloat(montoFinalEfectivo) < 0) {
      error = 'Ingrese un monto final válido';
      return;
    }

    if (!cajaAbierta?.id_cierre_caja) {
      error = 'No se encontró información de la caja abierta';
      return;
    }

    calculando = true;
    error = '';

    try {
      // Obtener datos reales del cierre desde la base de datos
      const datosResult = await posService.obtenerDatosCierre(cajaAbierta.id_cierre_caja);
      
      if (!datosResult.success) {
        error = datosResult.message || 'Error al obtener datos del cierre';
        return;
      }

      const datos = datosResult.data;
      const montoFinal = parseFloat(montoFinalEfectivo);
      
      const gastosAdicionalesValue = parseFloat(gastosAdicionales) || 0;
      const montoEsperadoConGastos = (datos?.monto_esperado || 0) - gastosAdicionalesValue;
      
      resultadoCierre = {
        monto_inicial: datos?.monto_inicial || 0,
        monto_final: montoFinal,
        monto_esperado: datos?.monto_esperado || 0,
        monto_esperado_con_gastos: montoEsperadoConGastos,
        diferencia: montoFinal - montoEsperadoConGastos,
        ventas_efectivo: datos?.ventas_efectivo || 0,
        ventas_qr: datos?.ventas_qr || 0,
        total_ventas: datos?.total_ventas || 0,
        ganancia_bruta: datos?.ganancia_bruta || 0,
        porcentaje_empresa: datos?.porcentaje_empresa || 0,
        porcentaje_cajero: datos?.porcentaje_cajero || 0,
        ganancia_empresa: datos?.ganancia_empresa || 0,
        ganancia_cajero: datos?.ganancia_cajero || 0,
        gastos_adicionales: gastosAdicionalesValue
      };
    } catch (err: any) {
      error = err.message || 'Error al calcular el cierre';
    } finally {
      calculando = false;
    }
  }

  async function confirmarCierre() {
    if (!resultadoCierre) return;

    loading = true;
    error = '';

    try {
      const gastos = parseFloat(gastosAdicionales) || 0;
      console.log('Iniciando cierre de caja...');
      const result = await posService.cerrarCajaSimple(parseFloat(montoFinalEfectivo), gastos);
      
      console.log('Resultado del cierre:', result);
      
      if (result.success) {
        // Verificar que efectivamente se cerró
        console.log('Verificando que la caja se cerró...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        await posService.checkCajaAbierta();
        
        dispatch('success');
        resetForm();
      } else {
        error = result.message || 'Error al cerrar la caja';
      }
    } catch (err: any) {
      console.error('Error en confirmarCierre:', err);
      error = err.message || 'Error al cerrar la caja';
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !loading) {
      close();
    }
  }

  // Focus management
  let montoInput: HTMLInputElement;
  $: if (show && montoInput) {
    setTimeout(() => montoInput.focus(), 100);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content max-w-2xl" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          <Calculator class="h-6 w-6 text-primary-600 mr-2" />
          <h2 class="text-xl font-semibold text-gray-900">Cierre de Caja</h2>
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
      <div class="p-6">
        {#if !resultadoCierre}
          <!-- Formulario inicial -->
          <div class="mb-6">
            <p class="text-gray-600 mb-4">
              Para cerrar la caja, ingrese el monto final en efectivo que tiene actualmente.
            </p>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Monto inicial:</span>
                <span class="font-medium">{(cajaAbierta?.monto_inicial || 0).toFixed(2)}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Caja:</span>
                <span class="font-medium">{cajaAbierta?.descripcion_caja || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <label for="montoFinal" class="block text-sm font-medium text-gray-700 mb-2">
                Monto Final en Efectivo *
              </label>
              <div class="relative">
                <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  bind:this={montoInput}
                  bind:value={montoFinalEfectivo}
                  type="number"
                  id="montoFinal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="input pl-10"
                  disabled={calculando}
                  required
                />
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Cuente todo el efectivo en la caja e ingrese el monto total
              </p>
            </div>

            <div>
              <label for="gastosAdicionales" class="block text-sm font-medium text-gray-700 mb-2">
                Otros Gastos (Opcional)
              </label>
              <div class="relative">
                <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  bind:value={gastosAdicionales}
                  type="number"
                  id="gastosAdicionales"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="input pl-10"
                  disabled={calculando}
                />
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Gastos adicionales realizados durante el día (combustible, compras, etc.)
              </p>
            </div>
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
              disabled={calculando}
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary flex-1"
              on:click={calcularCierre}
              disabled={calculando || !montoFinalEfectivo}
            >
              {#if calculando}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculando...
              {:else}
                Calcular Cierre
              {/if}
            </button>
          </div>
        {:else}
          <!-- Resumen del cierre -->
          <div class="space-y-6">
            <!-- Resumen de efectivo -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3 flex items-center">
                <DollarSign class="h-5 w-5 mr-2" />
                Resumen de Efectivo
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-600">Monto Inicial</p>
                  <p class="font-medium">{resultadoCierre.monto_inicial.toFixed(2)}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Monto Final</p>
                  <p class="font-medium">{resultadoCierre.monto_final.toFixed(2)}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Monto Esperado</p>
                  <p class="font-medium">{resultadoCierre.monto_esperado.toFixed(2)}</p>
                </div>
                {#if resultadoCierre.gastos_adicionales > 0}
                  <div>
                    <p class="text-sm text-gray-600">Gastos Adicionales</p>
                    <p class="font-medium text-danger-600">-{resultadoCierre.gastos_adicionales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Monto Esperado (con gastos)</p>
                    <p class="font-medium">{resultadoCierre.monto_esperado_con_gastos.toFixed(2)}</p>
                  </div>
                {/if}
                <div>
                  <p class="text-sm text-gray-600">Diferencia</p>
                  <p class="font-medium {resultadoCierre.diferencia >= 0 ? 'text-success-600' : 'text-danger-600'}">
                    {resultadoCierre.diferencia >= 0 ? '+' : ''}{resultadoCierre.diferencia.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <!-- Resumen de ventas -->
            <div class="bg-blue-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp class="h-5 w-5 mr-2" />
                Resumen de Ventas
              </h3>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-gray-600">Ventas Efectivo</p>
                  <p class="font-medium">{resultadoCierre.ventas_efectivo.toFixed(2)}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Ventas QR</p>
                  <p class="font-medium">{resultadoCierre.ventas_qr.toFixed(2)}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Total Ventas</p>
                  <p class="font-bold text-primary-600">{resultadoCierre.total_ventas.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <!-- Distribución de ganancias -->
            <div class="bg-success-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Distribución de Ganancias</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600">Ganancia Bruta:</span>
                  <span class="font-medium">{resultadoCierre.ganancia_bruta.toFixed(2)}</span>
                </div>
                <div class="border-t pt-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Empresa ({resultadoCierre.porcentaje_empresa}%):</span>
                    <span class="font-medium text-primary-600">{resultadoCierre.ganancia_empresa.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Cajero ({resultadoCierre.porcentaje_cajero}%):</span>
                    <span class="font-medium text-success-600">{resultadoCierre.ganancia_cajero.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {#if resultadoCierre.diferencia < 0}
              <div class="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <p class="text-sm text-warning-700">
                  <strong>Atención:</strong> Hay una diferencia negativa de {Math.abs(resultadoCierre.diferencia).toFixed(2)}. 
                  Verifique el conteo de efectivo antes de confirmar el cierre.
                </p>
              </div>
            {/if}
          </div>

          {#if error}
            <div class="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-md">
              <p class="text-sm text-danger-700">{error}</p>
            </div>
          {/if}

          <!-- Actions -->
          <div class="flex space-x-3 mt-6">
            <button
              type="button"
              class="btn-secondary"
              on:click={() => resultadoCierre = null}
              disabled={loading}
            >
              Volver
            </button>
            <button
              type="button"
              class="btn-danger flex-1"
              on:click={confirmarCierre}
              disabled={loading}
            >
              {#if loading}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Cerrando...
              {:else}
                Confirmar Cierre de Caja
              {/if}
            </button>
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

<!-- Después del campo de monto final, agregar: -->
<div class="mt-4">
  <label for="gastosAdicionales" class="block text-sm font-medium text-gray-700 mb-2">
    Otros Gastos (Opcional)
  </label>
  <div class="relative">
    <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      bind:value={gastosAdicionales}
      type="number"
      id="gastosAdicionales"
      step="0.01"
      min="0"
      placeholder="0.00"
      class="input pl-10"
      disabled={calculando}
    />
  </div>
  <p class="text-xs text-gray-500 mt-1">
    Gastos adicionales realizados durante el día (combustible, compras, etc.)
  </p>
</div>