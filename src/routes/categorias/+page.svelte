<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Tag, 
    Palette,
    X
  } from 'lucide-svelte';

  let loading = true;
  let categorias: any[] = [];
  let filteredCategorias: any[] = [];
  let searchTerm = '';
  let showModal = false;
  let editingCategoria: any = null;
  let error = '';

  // Form data
  let form = {
    nombre: '',
    color: '#3B82F6'
  };

  // Reactive filtering
  $: {
    filteredCategorias = categorias.filter(categoria => {
      return categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  onMount(async () => {
    await loadCategorias();
    loading = false;
  });

  async function loadCategorias() {
    try {
      const { data, error: dbError } = await supabase.rpc('get_categorias_empresa');

      if (dbError) throw dbError;
      categorias = data || [];
    } catch (err: any) {
      error = err.message || 'Error al cargar categorías';
      console.error('Error loading categorias:', err);
    }
  }

  function openCreateModal() {
    editingCategoria = null;
    form = {
      nombre: '',
      color: '#3B82F6'
    };
    showModal = true;
  }

  function openEditModal(categoria: any) {
    editingCategoria = categoria;
    form = {
      nombre: categoria.nombre,
      color: categoria.color || '#3B82F6'
    };
    showModal = true;
  }

  async function handleCategoriaSaved() {
    showModal = false;
    editingCategoria = null;
    await loadCategorias();
  }

  async function deleteCategoria(categoria: any) {
    if (!confirm(`¿Está seguro de eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    try {
      const { data, error: dbError } = await supabase.rpc('eliminar_categoria', {
        p_id: categoria.id
      });

      if (dbError) throw dbError;
      
      if (data && data.length > 0) {
        const result = data[0];
        if (!result.exito) {
          throw new Error(result.mensaje);
        }
      }
      
      await loadCategorias();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar categoría');
    }
  }

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchTerm = target.value;
  }
</script>

<svelte:head>
  <title>Gestión de Categorías</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <Tag class="h-8 w-8 mr-3" />
            Gestión de Categorías
          </h1>
          <p class="text-gray-600 mt-1">Organiza tus productos por categorías</p>
        </div>
        
        <button class="btn-primary" on:click={openCreateModal}>
          <Plus class="h-5 w-5 mr-2" />
          Nueva Categoría
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

    <!-- Búsqueda -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1 relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            class="input pl-10"
            value={searchTerm}
            on:input={handleSearch}
          />
        </div>
      </div>
      
      <div class="mt-4 flex items-center text-sm text-gray-600">
        <Tag class="h-4 w-4 mr-2" />
        Mostrando {filteredCategorias.length} de {categorias.length} categorías
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    {:else if filteredCategorias.length === 0}
      <div class="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Tag class="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {categorias.length === 0 ? 'No hay categorías' : 'No se encontraron categorías'}
        </h3>
        <p class="text-gray-600 mb-6">
          {categorias.length === 0 
            ? 'Comienza agregando tu primera categoría para organizar tus productos' 
            : 'Intenta ajustar el término de búsqueda'}
        </p>
        {#if categorias.length === 0}
          <button class="btn-primary" on:click={openCreateModal}>
            <Plus class="h-5 w-5 mr-2" />
            Agregar Primera Categoría
          </button>
        {/if}
      </div>
    {:else}
      <!-- Grid de categorías -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredCategorias as categoria}
          <div class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div 
                  class="w-4 h-4 rounded-full mr-3"
                  style="background-color: {categoria.color || '#3B82F6'}"
                ></div>
                <h3 class="text-lg font-semibold text-gray-900">{categoria.nombre}</h3>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  class="text-primary-600 hover:text-primary-900 p-1"
                  on:click={() => openEditModal(categoria)}
                  title="Editar categoría"
                >
                  <Edit class="h-4 w-4" />
                </button>
                <button
                  class="text-danger-600 hover:text-danger-900 p-1"
                  on:click={() => deleteCategoria(categoria)}
                  title="Eliminar categoría"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-600">
              <span>ID: {categoria.id}</span>
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                {categoria.color || '#3B82F6'}
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>

<!-- Modal de categoría -->
{#if showModal}
  <div class="modal-overlay" on:click={() => showModal = false}>
    <div class="modal-content max-w-md" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          <Tag class="h-6 w-6 text-primary-600 mr-2" />
          <h2 class="text-xl font-semibold text-gray-900">
            {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
        </div>
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors"
          on:click={() => showModal = false}
        >
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Content -->
      <form on:submit|preventDefault={async () => {
        try {
          if (editingCategoria) {
            const { data, error } = await supabase.rpc('actualizar_categoria', {
              p_id: editingCategoria.id,
              p_nombre: form.nombre.trim(),
              p_color: form.color
            });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              const result = data[0];
              if (!result.exito) {
                throw new Error(result.mensaje);
              }
            }
          } else {
            const { data, error } = await supabase.rpc('crear_categoria', {
              p_nombre: form.nombre.trim(),
              p_color: form.color
            });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              const result = data[0];
              if (!result.categoria_id) {
                throw new Error(result.mensaje);
              }
            }
          }
          await handleCategoriaSaved();
        } catch (err: any) {
          alert(err.message || 'Error al guardar categoría');
        }
      }} class="p-6">
        <div class="space-y-4">
          <div>
            <label for="nombre" class="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Categoría *
            </label>
            <input
              bind:value={form.nombre}
              type="text"
              id="nombre"
              placeholder="Ej: Bebidas, Snacks, etc."
              class="input"
              required
            />
          </div>

          <div>
            <label for="color" class="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div class="flex items-center space-x-3">
              <input
                bind:value={form.color}
                type="color"
                id="color"
                class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                bind:value={form.color}
                type="text"
                placeholder="#3B82F6"
                class="input flex-1"
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">Color para identificar la categoría</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex space-x-3 mt-8">
          <button
            type="button"
            class="btn-secondary flex-1"
            on:click={() => showModal = false}
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary flex-1"
          >
            {editingCategoria ? 'Actualizar' : 'Crear'} Categoría
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
