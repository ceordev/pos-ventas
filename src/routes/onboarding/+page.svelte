<script lang="ts">
  import { authService } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { Store, MapPin, DollarSign } from 'lucide-svelte';

  let nombre = '';
  let direccion_fiscal = '';
  let simbolo_moneda = 'Bs.';
  let loading = false;
  let error = '';

  const monedas = [
    { value: 'Bs.', label: 'Bolivianos (Bs.)' },
    { value: '$', label: 'Dólares ($)' },
    { value: '€', label: 'Euros (€)' },
    { value: '₡', label: 'Colones (₡)' },
    { value: 'S/', label: 'Soles (S/)' },
    { value: '$', label: 'Pesos ($)' }
  ];

  async function handleSubmit() {
    if (!nombre.trim()) {
      error = 'El nombre del negocio es requerido';
      return;
    }

    loading = true;
    error = '';

    try {
      await authService.createCompany({
        nombre: nombre.trim(),
        direccion_fiscal: direccion_fiscal.trim() || '-',
        simbolo_moneda
      });
      
      // Redirigir al dashboard después de crear la empresa
      goto('/dashboard');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al configurar el negocio';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Configurar Negocio - POS Ventas</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-lg w-full space-y-8">
    <div class="text-center">
      <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
        <Store class="h-8 w-8 text-white" />
      </div>
      <h2 class="mt-6 text-3xl font-bold text-gray-900">Configura tu Negocio</h2>
      <p class="mt-2 text-sm text-gray-600">
        Completa la información básica de tu empresa para comenzar
      </p>
    </div>

    <div class="card p-8">
      <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
        <div>
          <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Negocio *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Store class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="nombre"
              type="text"
              bind:value={nombre}
              required
              class="input pl-10"
              placeholder="Mi Tienda"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label for="direccion" class="block text-sm font-medium text-gray-700 mb-1">
            Dirección Fiscal
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="direccion"
              type="text"
              bind:value={direccion_fiscal}
              class="input pl-10"
              placeholder="Calle Principal #123, Ciudad"
              disabled={loading}
            />
          </div>
          <p class="mt-1 text-xs text-gray-500">Opcional - Puedes configurarlo después</p>
        </div>

        <div>
          <label for="moneda" class="block text-sm font-medium text-gray-700 mb-1">
            Moneda
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign class="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="moneda"
              bind:value={simbolo_moneda}
              class="input pl-10"
              disabled={loading}
            >
              {#each monedas as moneda}
                <option value={moneda.value}>{moneda.label}</option>
              {/each}
            </select>
          </div>
        </div>

        {#if error}
          <div class="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
            <p class="text-sm">{error}</p>
          </div>
        {/if}

        <div class="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-lg">
          <p class="text-sm">
            <strong>¡Perfecto!</strong> Al crear tu negocio se configurará automáticamente:
          </p>
          <ul class="text-sm mt-2 space-y-1">
            <li>• Una sucursal principal</li>
            <li>• Una caja de ventas</li>
            <li>• Un almacén de inventario</li>
            <li>• Una categoría y producto de ejemplo</li>
          </ul>
        </div>

        <button
          type="submit"
          class="btn-primary w-full py-3 text-base font-medium"
          disabled={loading}
        >
          {#if loading}
            <div class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Configurando negocio...
            </div>
          {:else}
            Crear Mi Negocio
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>