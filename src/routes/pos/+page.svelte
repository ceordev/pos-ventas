<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { posService, products, categories, cart, filteredProducts, cartTotal, cartItemCount, cajaAbierta, selectedCategory, searchTerm } from '$lib/stores/pos';
  import { Search, ShoppingCart, DollarSign, QrCode, X, Plus, Minus, CreditCard, History, Tag } from 'lucide-svelte';
  import AperturaCajaModal from '$lib/components/AperturaCajaModal.svelte';
  import PagoModal from '$lib/components/PagoModal.svelte';
  import CierreCajaModal from '$lib/components/CierreCajaModal.svelte';
  import DiscountModal from '$lib/components/DiscountModal.svelte';

  let showAperturaModal = false;
  let showPagoModal = false;
  let showCierreModal = false;
  let showDiscountModal = false;
  let selectedItemForDiscount: any = null;
  let loading = true;

  onMount(async () => {
    await loadData();
    loading = false;
  });

  async function loadData() {
    await Promise.all([
      posService.loadProducts(),
      posService.loadCategories(),
      posService.checkCajaAbierta()
    ]);
  }

  function handleProductClick(product: any) {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible');
      return;
    }
    posService.addToCart(product);
  }

  function updateQuantity(productId: number, quantity: number) {
    posService.updateCartItemQuantity(productId, quantity);
  }

  function removeFromCart(productId: number) {
    posService.removeFromCart(productId);
  }

  function handleCategoryFilter(categoryId: number | null) {
    selectedCategory.set(categoryId);
  }

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchTerm.set(target.value);
  }

  function openPagoModal() {
    if ($cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    
    // Si no hay caja abierta, mostrar modal de apertura primero
    if (!$cajaAbierta) {
      showAperturaModal = true;
      return;
    }
    
    showPagoModal = true;
  }

  function handleVentaCompleta() {
    showPagoModal = false;
    // El carrito se limpia automáticamente en el servicio
  }

  function handleAperturaCompleta() {
    showAperturaModal = false;
    posService.checkCajaAbierta();
    // Después de abrir caja, automáticamente abrir modal de pago si hay items en carrito
    if ($cart.length > 0) {
      setTimeout(() => {
        showPagoModal = true;
      }, 100);
    }
  }

  function handleCierreCompleta() {
    showCierreModal = false;
    posService.checkCajaAbierta();
  }

  function openDiscountModal(item: any) {
    selectedItemForDiscount = item;
    showDiscountModal = true;
  }

  function handleDiscountApply(event: any) {
    const { productId, discountAmount } = event.detail;
    posService.applyDiscount(productId, discountAmount);
    showDiscountModal = false;
    selectedItemForDiscount = null;
  }

  function closeDiscountModal() {
    showDiscountModal = false;
    selectedItemForDiscount = null;
  }
</script>

<svelte:head>
  <title>POS - Punto de Venta</title>
</svelte:head>

{#if loading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Cargando POS...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-gray-900">Punto de Venta</h1>
            {#if $cajaAbierta}
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Caja Abierta - {$cajaAbierta.descripcion_caja}
              </span>
            {:else}
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                Caja Cerrada
              </span>
            {/if}
          </div>
          
          <div class="flex items-center space-x-3">
            {#if $cajaAbierta}
              <button
                class="btn-warning"
                on:click={() => showCierreModal = true}
              >
                Cerrar Caja
              </button>
            {/if}
            
            <button
              class="btn-secondary"
              on:click={() => goto('/pos/historial')}
            >
              <History class="h-4 w-4 mr-2" />
              Mi Historial
            </button>
            
            <div class="text-right">
              <p class="text-sm text-gray-600">Cajero</p>
              <p class="font-medium">{$authStore.profile?.nombres}</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="flex h-[calc(100vh-80px)]">
      <!-- Panel Izquierdo - Productos -->
      <div class="flex-1 flex flex-col">
        <!-- Barra de búsqueda y filtros -->
        <div class="bg-white p-4 border-b">
          <div class="flex space-x-4 mb-3">
            <div class="flex-1 relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                class="input pl-10"
                value={$searchTerm}
                on:input={handleSearch}
              />
            </div>
          </div>
          
          <!-- Filtros de categoría -->
          <div class="max-h-16 overflow-y-auto border-t pt-2 relative">
            <div class="flex flex-wrap gap-1.5 pb-1">
              <button
                class="btn-secondary whitespace-nowrap text-xs px-2 py-1 {$selectedCategory === null ? 'bg-primary-100 text-primary-700' : ''}"
                on:click={() => handleCategoryFilter(null)}
              >
                Todas
              </button>
              {#each $categories as category}
                <button
                  class="btn-secondary whitespace-nowrap text-xs px-2 py-1 {$selectedCategory === category.id ? 'bg-primary-100 text-primary-700' : ''}"
                  on:click={() => handleCategoryFilter(category.id)}
                >
                  {category.nombre}
                </button>
              {/each}
            </div>
            <!-- Indicador de scroll -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50 pointer-events-none"></div>
          </div>
        </div>

        <!-- Grid de productos -->
        <div class="flex-1 p-4 overflow-y-auto">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {#each $filteredProducts as product}
              <button
                class="card p-4 hover:shadow-md transition-shadow text-left {product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}"
                on:click={() => handleProductClick(product)}
                disabled={product.stock <= 0}
              >
                <div class="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  {#if product.imagen_url}
                    <img src={product.imagen_url} alt={product.nombre} class="w-full h-full object-cover rounded-lg" />
                  {:else}
                    <div class="text-gray-400 text-2xl">📦</div>
                  {/if}
                </div>
                <h3 class="font-medium text-sm text-gray-900 mb-1 line-clamp-2">{product.nombre}</h3>
                <p class="text-lg font-bold text-primary-600 mb-1">{product.precio_venta.toFixed(2)}</p>
                <p class="text-xs text-gray-500">Stock: {product.stock || 0}</p>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Panel Derecho - Carrito -->
      <div class="w-80 lg:w-96 bg-white border-l flex flex-col">
        <!-- Header del carrito -->
        <div class="p-4 border-b">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <ShoppingCart class="h-5 w-5 mr-2" />
              Carrito ({$cartItemCount})
            </h2>
            {#if $cart.length > 0}
              <button
                class="text-sm text-danger-600 hover:text-danger-700"
                on:click={() => posService.clearCart()}
              >
                Limpiar
              </button>
            {/if}
          </div>
        </div>

        <!-- Items del carrito -->
        <div class="flex-1 overflow-y-auto">
          {#if $cart.length === 0}
            <div class="p-8 text-center text-gray-500">
              <ShoppingCart class="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Carrito vacío</p>
              <p class="text-sm">Selecciona productos para agregar</p>
            </div>
          {:else}
            <div class="p-4 space-y-3">
              {#each $cart as item}
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <h4 class="font-medium text-sm">{item.product.nombre}</h4>
                      <div class="text-xs text-gray-600 mt-1">
                        {#if item.descuento_aplicado > 0}
                          <p class="line-through text-gray-400">Precio: {item.precio_original.toFixed(2)}</p>
                          <p class="text-red-600">Con descuento: {(item.precio_original - item.descuento_aplicado).toFixed(2)} (-{item.descuento_aplicado.toFixed(2)})</p>
                        {:else}
                          <p>Precio: {item.precio_original.toFixed(2)} c/u</p>
                        {/if}
                      </div>
                    </div>
                    
                    <button
                      class="text-danger-600 hover:text-danger-700 ml-2"
                      on:click={() => removeFromCart(item.product.id)}
                    >
                      <X class="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <button
                        class="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        on:click={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus class="h-3 w-3" />
                      </button>
                      
                      <span class="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      
                      <button
                        class="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        on:click={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= (item.product.stock || 0)}
                      >
                        <Plus class="h-3 w-3" />
                      </button>
                      
                      <button
                        class="ml-2 p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded"
                        on:click={() => openDiscountModal(item)}
                        title="Aplicar descuento"
                      >
                        <Tag class="h-4 w-4" />
                      </button>
                    </div>
                    
                    <!-- Campo de observación -->
                    <div class="mt-2">
                      <input
                        type="text"
                        placeholder="Observación (ej: talla 6, color azul)"
                        value={item.observacion || ''}
                        on:input={(e) => posService.updateCartItemObservation(item.product.id, e.target.value)}
                        class="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        maxlength="100"
                      />
                    </div>
                    
                    <div class="text-right">
                      <p class="font-bold text-sm">{item.subtotal.toFixed(2)}</p>
                      {#if item.descuento_aplicado > 0}
                        <p class="text-xs text-green-600">Ahorras: {(item.descuento_aplicado * item.quantity).toFixed(2)}</p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Footer del carrito -->
        {#if $cart.length > 0}
          <div class="p-4 border-t bg-gray-50">
            <div class="flex justify-between items-center mb-4">
              <span class="text-lg font-semibold">Total:</span>
              <span class="text-2xl font-bold text-primary-600">{$cartTotal.toFixed(2)}</span>
            </div>
            
            <button
              class="btn-success w-full py-3 text-lg font-medium"
              on:click={openPagoModal}
            >
              <CreditCard class="h-5 w-5 mr-2" />
              {#if !$cajaAbierta}
                Abrir Caja y Cobrar
              {:else}
                Cobrar
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Modales -->
  {#if showAperturaModal}
    <AperturaCajaModal
      show={showAperturaModal}
      on:close={() => showAperturaModal = false}
      on:success={handleAperturaCompleta}
    />
  {/if}

  {#if showPagoModal}
    <PagoModal
      show={showPagoModal}
      cart={$cart}
      total={$cartTotal}
      cajaAbierta={$cajaAbierta}
      usuario={$authStore.profile}
      on:close={() => showPagoModal = false}
      on:success={handleVentaCompleta}
    />
  {/if}

  {#if showCierreModal}
    <CierreCajaModal
      show={showCierreModal}
      cajaAbierta={$cajaAbierta}
      usuario={$authStore.profile}
      on:close={() => showCierreModal = false}
      on:success={handleCierreCompleta}
    />
  {/if}

  <DiscountModal
    bind:show={showDiscountModal}
    product={selectedItemForDiscount?.product}
    currentDiscount={selectedItemForDiscount?.descuento_aplicado || 0}
    originalPrice={selectedItemForDiscount?.precio_original || 0}
    on:apply={handleDiscountApply}
    on:close={closeDiscountModal}
  />
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>