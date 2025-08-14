<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { posService } from '$lib/stores/pos';
  import { X, DollarSign } from 'lucide-svelte';

  export let show = false;

  const dispatch = createEventDispatcher();

  let montoInicial = '';
  let loading = false;
  let error = '';

  function close() {
    if (loading) return;
    dispatch('close');
  }

  async function handleSubmit() {
    if (!montoInicial || parseFloat(montoInicial) < 0) {
      error = 'Ingrese un monto inicial válido';
      return;
    }

    loading = true;
    error = '';

    try {
      const result = await posService.abrirCaja(parseFloat(montoInicial));
      
      if (result.success) {
        dispatch('success');
        // Reset form
        montoInicial = '';
      } else {
        error = result.message || 'Error al abrir la caja';
      }
    } catch (err: any) {
      error = err.message || 'Error al abrir la caja';
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !loading) {
      close();
    }
    if (event.key === 'Enter' && !loading) {
      handleSubmit();
    }
  }

  // Focus on mount
  let montoInput: HTMLInputElement;
  $: if (show && montoInput) {
    setTimeout(() => montoInput.focus(), 100);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content max-w-md" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          <DollarSign class="h-6 w-6 text-primary-600 mr-2" />
          <h2 class="text-xl font-semibold text-gray-900">Apertura de Caja</h2>
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
        <div class="mb-6">
          <p class="text-gray-600 mb-4">
            Para comenzar a trabajar, debe abrir la caja registradora e ingresar el monto inicial en efectivo.
          </p>
          
          <div class="space-y-4">
            <div>
              <label for="montoInicial" class="block text-sm font-medium text-gray-700 mb-2">
                Monto Inicial en Efectivo *
              </label>
              <div class="relative">
                <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  bind:this={montoInput}
                  bind:value={montoInicial}
                  type="number"
                  id="montoInicial"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="input pl-10"
                  disabled={loading}
                  required
                />
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Ingrese el monto en efectivo con el que inicia la caja
              </p>
            </div>
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
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary flex-1"
            disabled={loading || !montoInicial}
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Abriendo...
            {:else}
              Abrir Caja
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