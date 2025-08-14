<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Package, 
    AlertTriangle,
    Filter,
    X
  } from 'lucide-svelte';
  import ProductoModal from '$lib/components/ProductoModal.svelte';

  let loading = true;
  let productos: any[] = [];
  let categorias: any[] = [];
  let filteredProductos: any[] = [];
  let searchTerm = '';
  let selectedCategory: number | null = null;
  let showModal = false;
  let editingProduct: any = null;
  let error = '';

  // Reactive filtering
  $: {
    filteredProductos = productos.filter(producto => {
      const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           producto.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === null || producto.categoria_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  onMount(async () => {
    await Promise.all([
      loadProductos(),
      loadCategorias()
    ]);
    loading = false;
  });

  async function loadProductos() {
    try {
      const { data, error: dbError } = await supabase
        .from('productos')
        .select(`
          *,
          categorias(nombre),
          stock(cantidad)
        `)
        .order('nombre');

      if (dbError) throw dbError;
      
      productos = data.map(producto => ({
        ...producto,
        categoria_nombre: producto.categorias?.nombre || 'Sin categoría',
        stock: producto.stock?.[0]?.cantidad || 0
      }));
    } catch (err: any) {
      error = err.message || 'Error al cargar productos';
      console.error('Error loading productos:', err);
    }
  }

  async function loadCategorias() {
    try {
      const { data, error: dbError } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (dbError) throw dbError;
      categorias = data || [];
    } catch (err: any) {
      console.error('Error loading categorias:', err);
    }
  }

  function openCreateModal() {
    editingProduct = null;
    showModal = true;
  }

  function openEditModal(producto: any) {
    editingProduct = producto;
    showModal = true;
  }

  async function handleProductSaved() {
    showModal = false;
    editingProduct = null;
    await loadProductos();
  }

  async function deleteProduct(producto: any) {
    if (!confirm(`¿Está seguro de eliminar el producto "${producto.nombre}"?`)) {
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('productos')
        .delete()
        .eq('id', producto.id);

      if (dbError) throw dbError;
      
      await loadProductos();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto');
    }
  }

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchTerm = target.value;
  }

  function handleCategoryFilter(categoryId: number | null) {
    selectedCategory = categoryId;
  }

  function clearFilters() {
    searchTerm = '';
    selectedCategory = null;
  }

  function getStockStatus(stock: number) {
    if (stock <= 0) return { class: 'text-danger-600 bg-danger-50', text: 'Sin stock' };
    if (stock <= 5) return { class: 'text-warning-600 bg-warning-50', text: 'Stock bajo' };
    return { class: 'text-success-600 bg-success-50', text: 'En stock' };
  }
</script>

<svelte:head>
  <title>Gestión de Productos</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <Package class="h-8 w-8 mr-3" />
            Gestión de Productos
          </h1>
          <p class="text-gray-600 mt-1">Administra tu inventario y productos</p>
        </div>
        
        <button class="btn-primary" on:click={openCreateModal}>
          <Plus class="h-5 w-5 mr-2" />
          Nuevo Producto
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if error}
      <div class="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
        <p class="text-danger-700">{error}</p>
      </div>
    {/if}

    <!-- Filtros y búsqueda -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Búsqueda -->
        <div class="flex-1 relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            class="input pl-10"
            value={searchTerm}
            on:input={handleSearch}
          />
        </div>
        
        <!-- Filtro por categoría -->
        <div class="sm:w-64">
          <select 
            class="input"
            value={selectedCategory || ''}
            on:change={(e) => handleCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Todas las categorías</option>
            {#each categorias as categoria}
              <option value={categoria.id}>{categoria.nombre}</option>
            {/each}
          </select>
        </div>
        
        <!-- Limpiar filtros -->
        {#if searchTerm || selectedCategory !== null}
          <button class="btn-secondary" on:click={clearFilters}>
            <X class="h-4 w-4 mr-2" />
            Limpiar
          </button>
        {/if}
      </div>
      
      <div class="mt-4 flex items-center text-sm text-gray-600">
        <Filter class="h-4 w-4 mr-2" />
        Mostrando {filteredProductos.length} de {productos.length} productos
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    {:else if filteredProductos.length === 0}
      <div class="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Package class="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {productos.length === 0 ? 'No hay productos' : 'No se encontraron productos'}
        </h3>
        <p class="text-gray-600 mb-6">
          {productos.length === 0 
            ? 'Comienza agregando tu primer producto al inventario' 
            : 'Intenta ajustar los filtros de búsqueda'}
        </p>
        {#if productos.length === 0}
          <button class="btn-primary" on:click={openCreateModal}>
            <Plus class="h-5 w-5 mr-2" />
            Agregar Primer Producto
          </button>
        {/if}
      </div>
    {:else}
      <!-- Tabla de productos -->
      <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredProductos as producto}
                {@const stockStatus = getStockStatus(producto.stock)}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-12 w-12">
                        {#if producto.imagen_url}
                          <img class="h-12 w-12 rounded-lg object-cover" src={producto.imagen_url} alt={producto.nombre} />
                        {:else}
                          <div class="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package class="h-6 w-6 text-gray-400" />
                          </div>
                        {/if}
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{producto.nombre}</div>
                        {#if producto.codigo_barras}
                          <div class="text-sm text-gray-500">Código: {producto.codigo_barras}</div>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {producto.categoria_nombre}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      <div class="font-medium">{producto.precio_venta.toFixed(2)}</div>
                      {#if producto.precio_compra}
                        <div class="text-xs text-gray-500">Costo: {producto.precio_compra.toFixed(2)}</div>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{producto.stock}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {stockStatus.class}">
                      {#if producto.stock <= 0}
                        <AlertTriangle class="h-3 w-3 mr-1" />
                      {/if}
                      {stockStatus.text}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        class="text-primary-600 hover:text-primary-900 p-1"
                        on:click={() => openEditModal(producto)}
                        title="Editar producto"
                      >
                        <Edit class="h-4 w-4" />
                      </button>
                      <button
                        class="text-danger-600 hover:text-danger-900 p-1"
                        on:click={() => deleteProduct(producto)}
                        title="Eliminar producto"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </main>
</div>

<!-- Modal de producto -->
{#if showModal}
  <ProductoModal
    show={showModal}
    producto={editingProduct}
    categorias={categorias}
    on:close={() => showModal = false}
    on:saved={handleProductSaved}
  />
{/if}