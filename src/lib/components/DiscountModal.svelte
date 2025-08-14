<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, DollarSign, Percent, Calculator } from 'lucide-svelte';

  export let show = false;
  export let product: any = null;
  export let currentDiscount = 0;
  export let originalPrice = 0;

  const dispatch = createEventDispatcher();

  let discountAmount = currentDiscount || 0;
  let discountPercent = 0;
  let discountType = 'amount'; // 'amount' o 'percent'
  let error = '';

  // Calculamos el porcentaje inicial si hay descuento
  $: if (originalPrice > 0 && currentDiscount > 0) {
    discountPercent = Math.round((currentDiscount * 100) / originalPrice);
  }

  // Calculamos precio final (asegurándonos de que discountAmount sea un número)
  $: finalPrice = (originalPrice || 0) - (discountAmount || 0);

  // Validaciones reactivas
  $: {
    const discount = discountAmount || 0;
    const original = originalPrice || 0;
    
    if (discount < 0) {
      error = 'El descuento no puede ser negativo';
    } else if (discount > original) {
      error = 'El descuento no puede ser mayor al precio original';
    } else if (finalPrice < 0) {
      error = 'El precio final no puede ser negativo';
    } else {
      error = '';
    }
  }

  // Cuando cambia el tipo de descuento, recalculamos
  $: {
    if (discountType === 'percent') {
      const original = originalPrice || 0;
      const percent = discountPercent || 0;
      discountAmount = Math.round((original * percent) / 100 * 100) / 100;
    }
  }

  function handlePercentChange() {
    if (discountType === 'percent') {
      const original = originalPrice || 0;
      const percent = discountPercent || 0;
      discountAmount = Math.round((original * percent) / 100 * 100) / 100;
    }
  }

  function handleAmountChange() {
    if (discountType === 'amount' && originalPrice > 0) {
      const amount = discountAmount || 0;
      discountPercent = Math.round((amount * 100) / originalPrice);
    }
  }

  function applyDiscount() {
    if (error) return;

    const amount = discountAmount || 0;
    const original = originalPrice || 0;

    dispatch('apply', {
      productId: product.id,
      discountAmount: Math.max(0, Math.min(amount, original))
    });
    close();
  }

  function removeDiscount() {
    dispatch('apply', {
      productId: product.id,
      discountAmount: 0
    });
    close();
  }

  function close() {
    dispatch('close');
  }

  function resetForm() {
    discountAmount = currentDiscount || 0;
    const original = originalPrice || 0;
    const current = currentDiscount || 0;
    discountPercent = original > 0 && current > 0 ? 
      Math.round((current * 100) / original) : 0;
    discountType = 'amount';
    error = '';
  }

  // Reset form when modal opens
  $: if (show) {
    resetForm();
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content max-w-md" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-semibold text-gray-900">
          Aplicar Descuento
        </h2>
        <button 
          class="text-gray-400 hover:text-gray-600 transition-colors"
          on:click={close}
        >
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Información del producto -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-medium text-gray-900">{product?.nombre || 'Producto'}</h3>
          <div class="mt-2 text-sm text-gray-600">
            <p>Precio original: <span class="font-medium">{(originalPrice || 0).toFixed(2)}</span></p>
            {#if (currentDiscount || 0) > 0}
              <p>Descuento actual: <span class="font-medium text-red-600">-{(currentDiscount || 0).toFixed(2)}</span></p>
            {/if}
          </div>
        </div>

        <!-- Tipo de descuento -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de descuento
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="btn-secondary {discountType === 'amount' ? 'bg-primary-100 border-primary-300 text-primary-700' : ''}"
              on:click={() => discountType = 'amount'}
            >
              <DollarSign class="h-4 w-4 mr-1" />
              Monto
            </button>
            <button
              class="btn-secondary {discountType === 'percent' ? 'bg-primary-100 border-primary-300 text-primary-700' : ''}"
              on:click={() => discountType = 'percent'}
            >
              <Percent class="h-4 w-4 mr-1" />
              Porcentaje
            </button>
          </div>
        </div>

        <!-- Input de descuento -->
        <div class="mb-4">
          {#if discountType === 'amount'}
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Monto de descuento
            </label>
            <div class="relative">
              <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                max={originalPrice || 0}
                bind:value={discountAmount}
                on:input={handleAmountChange}
                class="input pl-10"
                placeholder="0.00"
              />
            </div>
          {:else}
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Porcentaje de descuento
            </label>
            <div class="relative">
              <Percent class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                max="100"
                bind:value={discountPercent}
                on:input={handlePercentChange}
                class="input pl-10"
                placeholder="0"
              />
            </div>
          {/if}
        </div>

        <!-- Vista previa del resultado -->
        <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center mb-2">
            <Calculator class="h-4 w-4 text-blue-600 mr-2" />
            <span class="text-sm font-medium text-blue-900">Vista previa</span>
          </div>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Precio original:</span>
              <span class="font-medium">{(originalPrice || 0).toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Descuento:</span>
              <span class="font-medium text-red-600">-{(discountAmount || 0).toFixed(2)}</span>
            </div>
            {#if (discountPercent || 0) > 0}
              <div class="flex justify-between">
                <span class="text-gray-600">Porcentaje:</span>
                <span class="font-medium text-red-600">{discountPercent || 0}%</span>
              </div>
            {/if}
            <hr class="border-blue-200">
            <div class="flex justify-between font-bold">
              <span class="text-blue-900">Precio final:</span>
              <span class="text-blue-900">{(finalPrice || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Error message -->
        {#if error}
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-t bg-gray-50 flex justify-between">
        <div>
          {#if currentDiscount > 0}
            <button
              class="btn-danger"
              on:click={removeDiscount}
            >
              Quitar Descuento
            </button>
          {/if}
        </div>
        
        <div class="flex space-x-3">
          <button class="btn-secondary" on:click={close}>
            Cancelar
          </button>
          <button 
            class="btn-primary" 
            on:click={applyDiscount}
            disabled={!!error || (discountAmount || 0) < 0}
          >
            Aplicar Descuento
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
