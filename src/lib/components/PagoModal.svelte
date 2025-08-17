<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { posService } from '$lib/stores/pos';
  import { X, DollarSign, CreditCard, QrCode, Calculator } from 'lucide-svelte';

  export let show = false;
  export let cart: any[] = [];
  export let total = 0;
  export let cajaAbierta: any = null;
  export let usuario: any = null;

  const dispatch = createEventDispatcher();

  let metodoPago = ''; // Usuario debe seleccionar método
  let montoEfectivo = '';
  let montoQR = '';
  let loading = false;
  let error = '';
  let cambio = 0;

  // Reactive calculations
  $: {
    if (metodoPago === 'Efectivo') {
      const efectivo = parseFloat(montoEfectivo) || 0;
      cambio = Math.max(0, efectivo - total);
    } else {
      cambio = 0;
    }
  }

  $: {
    if (metodoPago === 'QR') {
      montoQR = total.toString();
      montoEfectivo = '';
    } else if (metodoPago === 'Efectivo') {
      montoQR = '';
    }
  }

  $: montoMixtoTotal = (parseFloat(montoEfectivo) || 0) + (parseFloat(montoQR) || 0);
  $: mixtoValido = metodoPago !== 'Mixto' || Math.abs(montoMixtoTotal - total) < 0.01;

  function close() {
    if (loading) return;
    dispatch('close');
  }

  function resetForm() {
    metodoPago = '';
    montoEfectivo = '';
    montoQR = '';
    error = '';
    cambio = 0;
  }

  async function handleSubmit() {
    if (!validarPago()) return;

    loading = true;
    error = '';

    try {
      const pagoData = {
        metodo_pago: metodoPago,
        monto_efectivo: metodoPago === 'Efectivo' || metodoPago === 'Mixto' ? parseFloat(montoEfectivo) || 0 : 0,
        monto_qr: metodoPago === 'QR' || metodoPago === 'Mixto' ? parseFloat(montoQR) || 0 : 0,
        cambio: cambio
      };

      const result = await posService.processSale(
        cajaAbierta.id_cierre_caja,
        usuario.id,
        total,
        pagoData.monto_efectivo,
        pagoData.monto_qr,
        cart
      );
      
      if (result.success) {
        dispatch('success');
        resetForm();
      } else {
        error = result.message || 'Error al procesar la venta';
      }
    } catch (err: any) {
      error = err.message || 'Error al procesar la venta';
    } finally {
      loading = false;
    }
  }

  function validarPago(): boolean {
    
    // Validar que se haya seleccionado un método de pago
    if (!metodoPago) {
      error = 'Debe seleccionar un método de pago';
      return false;
    }
    
    if (metodoPago === 'Efectivo') {
      const efectivo = parseFloat(montoEfectivo) || 0;
      if (efectivo <= 0) {
        error = 'Debe ingresar un monto en efectivo válido';
        return false;
      }
      if (efectivo < total) {
        error = 'El monto en efectivo debe ser mayor o igual al total';
        return false;
      }
    } else if (metodoPago === 'QR') {
      const qr = parseFloat(montoQR) || 0;
      if (Math.abs(qr - total) > 0.01) {
        error = 'El monto QR debe ser igual al total';
        return false;
      }
    } else if (metodoPago === 'Mixto') {
      const efectivoMixto = parseFloat(montoEfectivo) || 0;
      const qrMixto = parseFloat(montoQR) || 0;
      
      if (efectivoMixto <= 0 && qrMixto <= 0) {
        error = 'Debe ingresar al menos un monto para pago mixto';
        return false;
      }
      
      if (!mixtoValido) {
        error = 'La suma de efectivo y QR debe ser igual al total';
        return false;
      }
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

  function setMontoExacto() {
    if (metodoPago === 'Efectivo') {
      montoEfectivo = total.toString();
    }
  }

  // Reset form when modal opens
  $: if (show) {
    resetForm();
  }

  // Focus management
  let efectivoInput: HTMLInputElement;
  $: if (show && efectivoInput && metodoPago === 'Efectivo') {
    setTimeout(() => efectivoInput.focus(), 100);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content max-w-lg" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          <CreditCard class="h-6 w-6 text-primary-600 mr-2" />
          <h2 class="text-xl font-semibold text-gray-900">Procesar Pago</h2>
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
        <!-- Resumen de venta -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">Items:</span>
            <span class="font-medium">{cart.length}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold">Total:</span>
            <span class="text-2xl font-bold text-primary-600">{total.toFixed(2)}</span>
          </div>
        </div>

        <!-- Método de pago -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Método de Pago {metodoPago ? `(${metodoPago})` : '(Seleccione uno)'}
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button
              type="button"
              class="p-3 border rounded-lg text-center transition-colors {metodoPago === 'Efectivo' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 hover:border-gray-400'}"
              on:click={() => metodoPago = 'Efectivo'}
              disabled={loading}
            >
              <DollarSign class="h-6 w-6 mx-auto mb-1" />
              <span class="text-sm font-medium">Efectivo</span>
            </button>
            
            <button
              type="button"
              class="p-3 border rounded-lg text-center transition-colors {metodoPago === 'QR' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 hover:border-gray-400'}"
              on:click={() => metodoPago = 'QR'}
              disabled={loading}
            >
              <QrCode class="h-6 w-6 mx-auto mb-1" />
              <span class="text-sm font-medium">QR</span>
            </button>
            
            <button
              type="button"
              class="p-3 border rounded-lg text-center transition-colors {metodoPago === 'Mixto' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 hover:border-gray-400'}"
              on:click={() => metodoPago = 'Mixto'}
              disabled={loading}
            >
              <Calculator class="h-6 w-6 mx-auto mb-1" />
              <span class="text-sm font-medium">Mixto</span>
            </button>
          </div>
        </div>

        <!-- Campos de pago según método -->
        <div class="space-y-4 mb-6">
          {#if !metodoPago}
            <div class="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-sm text-yellow-700">Seleccione un método de pago para continuar</p>
            </div>
          {:else if metodoPago === 'Efectivo'}
            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="montoEfectivo" class="block text-sm font-medium text-gray-700">
                  Monto Recibido en Efectivo
                </label>
                <button
                  type="button"
                  class="text-xs text-primary-600 hover:text-primary-700"
                  on:click={setMontoExacto}
                  disabled={loading}
                >
                  Monto exacto
                </button>
              </div>
              <div class="relative">
                <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  bind:this={efectivoInput}
                  bind:value={montoEfectivo}
                  type="number"
                  id="montoEfectivo"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="input pl-10"
                  disabled={loading}
                />
              </div>
              {#if cambio > 0}
                <div class="mt-2 p-2 bg-success-50 border border-success-200 rounded">
                  <p class="text-sm text-success-700">
                    <strong>Cambio: {cambio.toFixed(2)}</strong>
                  </p>
                </div>
              {/if}
            </div>
          {:else if metodoPago === 'QR'}
            <div>
              <label for="montoQR" class="block text-sm font-medium text-gray-700 mb-2">
                Monto QR
              </label>
              <div class="relative">
                <QrCode class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  bind:value={montoQR}
                  type="number"
                  id="montoQR"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="input pl-10"
                  disabled={loading}
                  readonly
                />
              </div>
              <p class="text-xs text-gray-500 mt-1">
                El monto QR debe ser exacto al total
              </p>
            </div>
          {:else if metodoPago === 'Mixto'}
            <div class="space-y-3">
              <div>
                <label for="montoEfectivoMixto" class="block text-sm font-medium text-gray-700 mb-2">
                  Monto en Efectivo
                </label>
                <div class="relative">
                  <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    bind:value={montoEfectivo}
                    type="number"
                    id="montoEfectivoMixto"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="input pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label for="montoQRMixto" class="block text-sm font-medium text-gray-700 mb-2">
                  Monto QR
                </label>
                <div class="relative">
                  <QrCode class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    bind:value={montoQR}
                    type="number"
                    id="montoQRMixto"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="input pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div class="p-3 bg-gray-50 rounded border">
                <div class="flex justify-between text-sm">
                  <span>Total a pagar:</span>
                  <span class="font-medium">{total.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span>Total ingresado:</span>
                  <span class="font-medium {mixtoValido ? 'text-success-600' : 'text-danger-600'}">
                    {montoMixtoTotal.toFixed(2)}
                  </span>
                </div>
                {#if !mixtoValido}
                  <p class="text-xs text-danger-600 mt-1">
                    Los montos deben sumar exactamente {total.toFixed(2)}
                  </p>
                {/if}
              </div>
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
            type="button"
            class="btn-success flex-1"
            on:click={handleSubmit}
            disabled={loading || !metodoPago}
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Procesando...
            {:else}
              Confirmar Venta
            {/if}
          </button>
        </div>
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