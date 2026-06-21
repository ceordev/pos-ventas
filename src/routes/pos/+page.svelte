<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { 
    posService, 
    products, 
    categories, 
    cart, 
    filteredProducts, 
    cartTotal, 
    cartItemCount, 
    cajaAbierta, 
    selectedCategory, 
    searchTerm,
    currentPage,
    totalProducts,
    isLoadingProducts 
  } from '$lib/stores/pos';
  import { Search, ShoppingCart, DollarSign, QrCode, X, Plus, Minus, CreditCard, History, Tag, ChevronLeft, ChevronRight, Loader2 } from 'lucide-svelte';
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
  let searchTimeout: any;
  let showSizeModal = false;
  let selectedProductForSize: any = null;
  let availableSizes: any[] = [];
  let showCartMobile = false;

  // Infinite Scroll Observer
  let observer: IntersectionObserver;
  let sentinel: HTMLElement;

  async function loadMore() {
    if ($isLoadingProducts || $products.length >= $totalProducts) return;
    
    const nextPage = $currentPage + 1;
    await posService.searchProducts($searchTerm, $selectedCategory, nextPage, true);
  }

  onMount(async () => {
    loading = true;
    await loadData();
    loading = false;
    
    // Setup Intersection Observer
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { rootMargin: '100px' });

    if (sentinel) observer.observe(sentinel);
  });
  
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (observer) observer.disconnect();
  });

  async function loadData() {
    await Promise.all([
      posService.loadProducts(), // Now calls searchProducts internally
      posService.loadCategories(),
      posService.checkCajaAbierta()
    ]);
  }

  async function handleProductClick(product: any) {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible');
      return;
    }

    const { data: tallas } = await supabase.from('producto_tallas').select('*').eq('id_producto', product.id);

    if (tallas && tallas.length > 0) {
      const tallasConStock = tallas.filter(t => t.stock > 0);
      if (tallasConStock.length === 0) {
        alert('Este producto tiene tallas pero ninguna tiene stock disponible');
        return;
      }
      selectedProductForSize = product;
      availableSizes = tallasConStock;
      showSizeModal = true;
    } else {
      posService.addToCart(product);
    }
  }

  function handleSizeSelected(talla: any) {
    posService.addToCart(selectedProductForSize, 1, talla.talla);
    showSizeModal = false;
    selectedProductForSize = null;
    availableSizes = [];
  }

  function updateQuantity(productId: number, quantity: number) {
    posService.updateCartItemQuantity(productId, quantity);
  }

  function removeFromCart(productId: number) {
    posService.removeFromCart(productId);
  }

  function handleCategoryFilter(categoryId: number | null) {
    selectedCategory.set(categoryId);
    // Reset to page 1 when changing category
    posService.searchProducts($searchTerm, categoryId, 1);
  }

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      const value = target.value;
      searchTerm.set(value);
      
      // Debounce search
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        posService.searchProducts(value, $selectedCategory, 1);
      }, 500);
    }
  }
  
  function changePage(delta: number) {
    const newPage = $currentPage + delta;
    if (newPage >= 1) {
      posService.searchProducts($searchTerm, $selectedCategory, newPage);
    }
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

  function openAperturaModal() {
    showAperturaModal = true;
  }

  function handleVentaCompleta() {
    showPagoModal = false;
    showCartMobile = false;
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

  function handleAperturaCancelada() {
    showAperturaModal = false;
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
  <title>SIAL pro - Punto de Venta</title>
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
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Punto de Venta</h1>
            <div>
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
          </div>
          
          <div class="flex flex-wrap items-center gap-3 lg:justify-end">
            {#if $cajaAbierta}
              <button
                class="btn-warning"
                on:click={() => showCierreModal = true}
              >
                Cerrar Caja
              </button>
            {:else}
              <button
                class="btn-primary"
                on:click={openAperturaModal}
              >
                Abrir Caja
              </button>
            {/if}
            
            <button
              class="btn-secondary"
              on:click={() => goto('/pos/historial')}
            >
              <History class="h-4 w-4 mr-2" />
              Mi Historial
            </button>
            
            <div class="text-right hidden sm:block">
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
          </div>
        </div>

        <!-- Grid de productos -->
        <div class="flex-1 p-4 overflow-y-auto relative">
          {#if $isLoadingProducts && $products.length === 0}
             <div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <Loader2 class="h-10 w-10 text-primary-600 animate-spin" />
             </div>
          {/if}

          {#if $filteredProducts.length === 0 && !$isLoadingProducts}
             <div class="h-full flex flex-col items-center justify-center text-gray-500">
               <div class="text-4xl mb-2">📦</div>
               <p>No se encontraron productos</p>
             </div>
          {:else}
             <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
               {#each $filteredProducts as product}
                 <button
                   class="card p-4 hover:shadow-md transition-shadow text-left {(product.stock || 0) <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}"
                   on:click={() => handleProductClick(product)}
                   disabled={(product.stock || 0) <= 0}
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
          {/if}
        </div>
        
        <!-- Paginación -->
        <div class="bg-white p-3 border-t flex items-center justify-between">
           <div class="text-sm text-gray-500">
              Total: {$totalProducts} productos
           </div>
           <div class="flex items-center space-x-2">
              <button 
                 class="p-2 rounded-md border enabled:hover:bg-gray-50 disabled:opacity-50"
                 disabled={$currentPage === 1 || $isLoadingProducts}
                 on:click={() => changePage(-1)}
              >
                 <ChevronLeft class="h-5 w-5" />
              </button>
              <span class="text-sm font-medium">Página {$currentPage}</span>
              <button 
                 class="p-2 rounded-md border enabled:hover:bg-gray-50 disabled:opacity-50"
                 disabled={$filteredProducts.length < 20 && ($totalProducts <= $currentPage * 20)} 
                 on:click={() => changePage(1)}
              >
                 <ChevronRight class="h-5 w-5" />
              </button>
           </div>
        </div>
      </div>


      <!-- Panel Derecho - Carrito -->
      <div class="{showCartMobile ? 'fixed inset-0 z-50' : 'hidden md:flex w-80 lg:w-96'} bg-white md:border-l flex flex-col">
        <!-- Header del carrito -->
        <div class="p-4 border-b">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <ShoppingCart class="h-5 w-5 mr-2" />
              Carrito ({$cartItemCount})
            </h2>
            <div class="flex items-center space-x-3">
              {#if $cart.length > 0}
                <button
                  class="text-sm text-danger-600 hover:text-danger-700"
                  on:click={() => posService.clearCart()}
                >
                  Limpiar
                </button>
              {/if}
              <button 
                class="md:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700"
                on:click={() => showCartMobile = false}
              >
                <X class="h-6 w-6" />
              </button>
            </div>
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
                      <h4 class="font-medium text-sm">{item.product.nombre} {#if item.talla}<span class="text-xs bg-gray-200 px-2 py-0.5 rounded ml-1">Talla: {item.talla}</span>{/if}</h4>
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
                      on:click={() => removeFromCart(item.cartItemId)}
                    >
                      <X class="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div class="flex flex-col space-y-3 mt-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <button
                          class="w-7 h-7 rounded-full flex-shrink-0 bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          on:click={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        >
                          <Minus class="h-3 w-3" />
                        </button>
                        
                        <input 
                          type="number"
                          min="1"
                          max={item.product.stock || 1}
                          value={item.quantity}
                          on:change={(e) => {
                             const target = e.target as HTMLInputElement;
                             let newQty = parseInt(target.value);
                             if (isNaN(newQty) || newQty < 1) newQty = 1;
                             const maxStock = item.product.stock || 1;
                             if (newQty > maxStock) newQty = maxStock;
                             target.value = newQty.toString();
                             updateQuantity(item.cartItemId, newQty);
                          }}
                          class="w-12 text-center text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 py-1"
                        />
                        
                        <button
                          class="w-7 h-7 rounded-full flex-shrink-0 bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          on:click={() => updateQuantity(item.cartItemId, item.quantity + 1)}
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
                      
                      <div class="text-right">
                        <p class="font-bold text-sm">{item.subtotal.toFixed(2)}</p>
                        {#if item.descuento_aplicado > 0}
                          <p class="text-xs text-green-600">Ahorras: {(item.descuento_aplicado * item.quantity).toFixed(2)}</p>
                        {/if}
                      </div>
                    </div>
                    
                    <!-- Campo de observación abajo para más espacio en móviles -->
                    <div class="w-full">
                      <input
                        type="text"
                        placeholder="Observación (ej: talla 6, color azul)"
                        value={item.observacion || ''}
                        on:input={(e) => {
                          const target = e.target as HTMLInputElement;
                          if (target) {
                            posService.updateCartItemObservation(item.cartItemId, target.value);
                          }
                        }}
                        class="w-full text-xs px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder-gray-400"
                        maxlength="100"
                      />
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

  <!-- Floating Cart Button for Mobile -->
  <button 
    class="md:hidden fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 z-40 flex items-center justify-center transition-transform hover:scale-105"
    on:click={() => showCartMobile = true}
  >
    <div class="relative">
      <ShoppingCart class="h-6 w-6" />
      {#if $cartItemCount > 0}
        <span class="absolute -top-3 -right-3 bg-danger-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-primary-600">
          {$cartItemCount}
        </span>
      {/if}
    </div>
  </button>

  <!-- Modales -->
  {#if showAperturaModal}
    <AperturaCajaModal
      show={showAperturaModal}
      on:close={handleAperturaCancelada}
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

  {#if showSizeModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-medium">Seleccionar Talla</h3>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => showSizeModal = false}>
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="p-4">
          <p class="mb-4 text-sm text-gray-600">Selecciona la talla para <strong>{selectedProductForSize?.nombre}</strong>:</p>
          <div class="grid grid-cols-2 gap-3">
            {#each availableSizes as talla}
              <button
                class="border rounded-lg p-3 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
                on:click={() => handleSizeSelected(talla)}
              >
                <div class="font-bold text-lg">{talla.talla}</div>
                <div class="text-xs text-gray-500">Stock: {talla.stock}</div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
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