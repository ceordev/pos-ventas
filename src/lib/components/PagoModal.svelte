<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { posService } from '$lib/stores/pos';
  import { X, DollarSign, CreditCard, QrCode, Calculator, Trash2 } from 'lucide-svelte';

  export let show = false;
  export let cart: any[] = [];
  export let total: number = 0; // Se usará como valor inicial, pero el real será calculado localmente
  export let cajaAbierta: any = null;
  export let usuario: any = null;

  const dispatch = createEventDispatcher();

  // Local copy of items for editing prices
  let localItems: any[] = [];
  
  // Payment states
  let metodoPago = '';
  let montoEfectivo = '';
  let montoQR = '';
  let loading = false;
  let error = '';

  // Reactive Mixed Amount
  $: montoMixtoTotal = (Number(montoEfectivo) || 0) + (Number(montoQR) || 0);

  // Validation logic
  let isPaymentValid = false;
  $: {
    const diff = 0.05; 
    const efec = Number(montoEfectivo) || 0;
    const qr = Number(montoQR) || 0;
    
    // Use currentTotal directly
    const totalToPay = currentTotal;

    if (!metodoPago) {
        isPaymentValid = false;
    } else if (metodoPago === 'Efectivo') {
        isPaymentValid = efec >= (totalToPay - diff);
    } else if (metodoPago === 'QR') {
        isPaymentValid = qr >= (totalToPay - diff);
    } else if (metodoPago === 'Mixto') {
        isPaymentValid = montoMixtoTotal >= (totalToPay - diff);
    } else {
        isPaymentValid = false;
    }
  }

  function validatePaymentAmount() {
    return isPaymentValid;
  }



  function close() {
    if (loading) return;
    dispatch('close');
  }

  function resetForm() {
    metodoPago = '';
    montoEfectivo = '';
    montoQR = '';
    error = '';
  }

  async function handleSubmit() {
    if (!isPaymentValid) {
        error = 'El monto ingresado no cubre el total de la venta.';
        return;
    }

    loading = true;
    error = '';

    try {
      // Logic for Implicit Discounts vs Price Updates
      const finalItems = localItems.map(item => {
        const originalRef = Number(item.referencePrice) || 0;
        const finalPrice = Number(item.customPrice) || 0;
        
        let pOriginalToSave = finalPrice;
        let discountToSave = 0;

        // If user lowered the price, treat as DISCOUNT
        if (finalPrice < originalRef) {
            pOriginalToSave = originalRef;
            discountToSave = originalRef - finalPrice;
        } 
        // If user increased price or kept same, treat as NEW PRICE (no discount)
        else {
            pOriginalToSave = finalPrice;
            discountToSave = 0;
        }

        const porcentaje = pOriginalToSave > 0 ? (discountToSave * 100 / pOriginalToSave) : 0;

        return {
            ...item,
            precio_original: pOriginalToSave,
            descuento_aplicado: discountToSave,
            porcentaje_descuento: porcentaje,
            subtotal: item.quantity * finalPrice
        };
      });

      const pagoData = {
        monto_efectivo: metodoPago === 'Efectivo' || metodoPago === 'Mixto' ? parseFloat(montoEfectivo) || 0 : 0,
        monto_qr: metodoPago === 'QR' || metodoPago === 'Mixto' ? parseFloat(montoQR) || 0 : 0,
      };

      const result = await posService.processSale(
        cajaAbierta.id_cierre_caja,
        usuario.id,
        currentTotal,
        pagoData.monto_efectivo,
        pagoData.monto_qr,
        finalItems 
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

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !loading) {
      close();
    }
  }

  function setMontoExacto() {
    if (metodoPago === 'Efectivo') {
      montoEfectivo = currentTotal.toFixed(2);
    } else if (metodoPago === 'QR') {
      montoQR = currentTotal.toFixed(2);
    }
  }

  // Init when showing


  // Force recalculation when localItems changes deep
  $: currentTotal = localItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    // Asegurar que customPrice existe, si no usar el del producto
    const price = item.customPrice !== undefined ? Number(item.customPrice) : (Number(item.product?.precio_venta) || 0);
    
    // console.log(`🧮 Item: ${item.product.nombre}, Qty: ${qty}, Price: ${price}`);
    return sum + (qty * (isNaN(price) ? 0 : price));
  }, 0);


  function initModal() {
    console.log('🔄 Inicializando Modal de Pago. Carrito recibido:', cart);
    
    if (cart && cart.length > 0) {
        localItems = cart.map(item => {
            const catalogPrice = Number(item.product.precio_venta) || 0;
            // Priorizar precio_original del item si existe (viene de una edición previa o del carrito)
            // Si es null o undefined, usar precio de catálogo
            const incomingOriginal = (item.precio_original !== undefined && item.precio_original !== null) 
                                     ? Number(item.precio_original) 
                                     : catalogPrice;
            
            const incomingDiscount = Number(item.descuento_aplicado) || 0;
            
            const effectivePrice = incomingOriginal - incomingDiscount;

            console.log(`📦 Mapeando item: ${item.product.nombre}`, {
                catalogPrice, incomingOriginal, incomingDiscount, effectivePrice
            });
            
            return {
                ...item,
                referencePrice: incomingOriginal,
                customPrice: effectivePrice
            };
        });
        console.log('✅ localItems inicializados:', localItems);
    } else {
        localItems = [];
        console.warn('⚠️ Carrito vacío en initModal');
    }
  }

  // Init when showing
  // Use a derived check to ensure we only init when opening
  let wasShown = false;
  $: if (show && !wasShown) {
    wasShown = true;
    initModal();
  } else if (!show && wasShown) {
    wasShown = false;
    localItems = []; // Limpiar al cerrar
  }
  let efectivoInput: HTMLInputElement;
  $: if (show && efectivoInput && metodoPago === 'Efectivo') {
    setTimeout(() => efectivoInput.focus(), 100);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="modal-overlay" role="dialog" aria-modal="true" on:click={close} on:keydown={(e) => e.key === 'Escape' && close()}>
    <div class="modal-content" style="width: 95vw; max-width: 900px;" role="document" on:click|stopPropagation on:keydown|stopPropagation> <!-- Responsive width -->
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          <CreditCard class="h-6 w-6 text-primary-600 mr-2" />
          <h2 class="text-xl font-semibold text-gray-900">Procesar Venta</h2>
        </div>
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors"
          on:click={close}
          disabled={loading}
        >
          <X class="h-6 w-6" />
        </button>
      </div>

      <div class="flex flex-col md:flex-row w-full items-stretch overflow-auto" style="max-height: 80vh;"> <!-- Responsive: stack on small, row on md+ -->
          
        <!-- Left: Editable Items List -->
        <div class="w-full md:w-2/3 md:border-r p-4 md:p-6 overflow-y-auto bg-gray-50 flex flex-col">
            <h3 class="text-sm font-medium text-gray-700 mb-4">Detalle de Productos</h3>
            
            <div class="space-y-3 flex-1">
                {#each localItems as item}
                    <div class="bg-white p-3 rounded-lg border shadow-sm flex items-center justify-between gap-3">
                        <div class="flex-1">
                            <p class="font-medium text-sm text-gray-900 line-clamp-1">{item.product.nombre}</p>
                            <div class="flex items-center space-x-2 text-xs text-gray-500">
                                <span>Cant: {item.quantity}</span>
                                {#if item.observacion}
                                    <span class="bg-yellow-100 text-yellow-800 px-1 rounded truncate max-w-[100px]">{item.observacion}</span>
                                {/if}
                            </div>
                        </div>
                        
                        <div class="flex flex-col items-end">
                            <label class="text-[10px] text-gray-500 uppercase">Precio Unit.</label>
                            <div class="relative w-24">
                                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <input 
                                    type="number" 
                                    bind:value={item.customPrice}
                                    on:input={() => localItems = localItems}
                                    min="0"
                                    step="0.01"
                                    class="w-full pl-5 pr-2 py-1 text-sm border rounded text-right font-medium focus:ring-1 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <div class="w-20 text-right">
                             <p class="text-[10px] text-gray-500 uppercase">Subtotal</p>
                             <p class="font-medium">{(item.quantity * item.customPrice).toFixed(2)}</p>
                        </div>
                    </div>
                {/each}
            </div>

            <div class="mt-4 pt-4 border-t flex justify-between items-center bg-gray-50 sticky bottom-0">
                <span class="text-lg font-bold text-gray-900">Total a Cobrar:</span>
                <span class="text-2xl font-bold text-primary-600">${currentTotal.toFixed(2)}</span>
            </div>
        </div>

        <!-- Right: Payment Methods -->
        <div class="w-full md:w-1/3 p-4 md:p-6 flex flex-col bg-white border-t md:border-t-0">

            <!-- Error Alert -->
            {#if error}
              <div class="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                <p class="text-sm text-danger-700">{error}</p>
              </div>
            {/if}

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Método de Pago
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="p-2 border rounded-lg text-center transition-colors {metodoPago === 'Efectivo' ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
                  on:click={() => { metodoPago = 'Efectivo'; setMontoExacto(); }}
                  disabled={loading}
                >
                  <DollarSign class="h-5 w-5 mx-auto mb-1" />
                  <span class="text-xs font-medium">Efectivo</span>
                </button>
                
                <button
                  type="button"
                  class="p-2 border rounded-lg text-center transition-colors {metodoPago === 'QR' ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
                  on:click={() => { metodoPago = 'QR'; setMontoExacto(); }}
                  disabled={loading}
                >
                  <QrCode class="h-5 w-5 mx-auto mb-1" />
                  <span class="text-xs font-medium">QR</span>
                </button>
                
                <button
                  type="button"
                  class="p-2 border rounded-lg text-center transition-colors {metodoPago === 'Mixto' ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
                  on:click={() => { metodoPago = 'Mixto'; }}
                  disabled={loading}
                >
                  <Calculator class="h-5 w-5 mx-auto mb-1" />
                  <span class="text-xs font-medium">Mixto</span>
                </button>
              </div>
            </div>

            <!-- Payment Inputs -->
            <div class="flex-1">
              {#if !metodoPago}
                <div class="h-full flex items-center justify-center text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p class="text-sm text-gray-500">Seleccione un método para ingresar los montos</p>
                </div>
              {:else}
                <div class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    
                  {#if metodoPago === 'Efectivo' || metodoPago === 'Mixto'}
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Monto Efectivo</label>
                      <div class="relative">
                        <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          bind:this={efectivoInput}
                          bind:value={montoEfectivo}
                          type="number"
                          step="0.01"
                          class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  {/if}

                  {#if metodoPago === 'QR' || metodoPago === 'Mixto'}
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Monto QR</label>
                      <div class="relative">
                        <QrCode class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          bind:value={montoQR}
                          type="number"
                          step="0.01"
                          class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  {/if}

                  <!-- Totals Summary -->
                  <div class="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <div class="flex justify-between mb-2">
                          <span class="text-sm text-gray-600">Total a Cubrir:</span>
                          <span class="font-bold">{currentTotal.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between items-center">
                          <span class="text-sm text-gray-600">Total Ingresado:</span>
                          <span class="font-bold text-lg {isPaymentValid ? 'text-success-600' : 'text-danger-600'}">
                              {(metodoPago === 'Efectivo' ? (parseFloat(montoEfectivo)||0) : 
                                metodoPago === 'QR' ? (parseFloat(montoQR)||0) : 
                                montoMixtoTotal).toFixed(2)}
                          </span>
                      </div>
                      {#if !isPaymentValid}
                          <p class="text-xs text-danger-500 mt-2 text-right">Falta cubrir el total</p>
                      {:else}
                           <p class="text-xs text-success-500 mt-2 text-right">Monto cubierto</p>
                      {/if}
                  </div>
                </div>
              {/if}
            </div>

            <!-- Footer Buttons -->
            <div class="mt-6 flex space-x-3">
              <button
                type="button"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                on:click={close}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                on:click={handleSubmit}
                disabled={loading || !isPaymentValid}
              >
                {#if loading}
                  <span class="inline-block animate-spin mr-2">⟳</span>
                {/if}
                Cobrar
              </button>
            </div>
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
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    /* width constraint removed to let Tailwind control it */
    margin: auto;
    overflow: hidden;
  }
</style>