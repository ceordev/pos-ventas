<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { X, Package, DollarSign, Hash, Image, Tag, Upload, Camera } from 'lucide-svelte';

  export let show = false;
  export let producto: any = null;
  export let categorias: any[] = [];

  const dispatch = createEventDispatcher();

  let form = {
    nombre: '',
    codigo_barras: '', // This now holds the description
    precio_compra: '',
    precio_venta: '',
    categoria_id: '',
    imagen_url: '',
    stock_inicial: ''
  };
  
  let loading = false;
  let error = '';
  let isEditing = false;
  let uploadingImage = false;
  let selectedFile: File | null = null;
  let imagePreview: string | null = null;

  // Reactive form initialization
  $: {
    if (producto) {
      isEditing = true;
      form = {
        nombre: producto.nombre || '',
        codigo_barras: producto.codigo_barras || '', // This now holds the description
        precio_compra: producto.precio_compra?.toString() || '',
        precio_venta: producto.precio_venta?.toString() || '',
        categoria_id: producto.categoria_id?.toString() || '',
        imagen_url: producto.imagen_url || '',
        stock_inicial: producto.stock?.toString() || '0'
      };
    } else {
      isEditing = false;
      form = {
        nombre: '',
        codigo_barras: '', // This now holds the description
        precio_compra: '',
        precio_venta: '',
        categoria_id: '',
        imagen_url: '',
        stock_inicial: '0'
      };
    }
  }

  function close() {
    if (loading) return;
    dispatch('close');
    resetForm();
  }

  function resetForm() {
    form = {
      nombre: '',
      codigo_barras: '', // This now holds the description
      precio_compra: '',
      precio_venta: '',
      categoria_id: '',
      imagen_url: '',
      stock_inicial: '0'
    };
    error = '';
    selectedFile = null;
    imagePreview = null;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    loading = true;
    error = '';

    try {
      if (isEditing) {
        await updateProduct();
      } else {
        await createProduct();
      }
      
      dispatch('saved');
      resetForm();
    } catch (err: any) {
      error = err.message || 'Error al guardar producto';
    } finally {
      loading = false;
    }
  }

  function validateForm(): boolean {
    if (!form.nombre.trim()) {
      error = 'El nombre del producto es requerido';
      return false;
    }
    
    if (!form.precio_venta || parseFloat(form.precio_venta) <= 0) {
      error = 'El precio de venta debe ser mayor a 0';
      return false;
    }
    
    if (form.precio_compra && parseFloat(form.precio_compra) < 0) {
      error = 'El precio de compra no puede ser negativo';
      return false;
    }
    
    if (!form.categoria_id) {
      error = 'Debe seleccionar una categoría';
      return false;
    }
    
    if (!isEditing && (!form.stock_inicial || parseFloat(form.stock_inicial) < 0)) {
      error = 'El stock inicial no puede ser negativo';
      return false;
    }
    
    return true;
  }

  async function createProduct() {
    let imagenUrl = form.imagen_url.trim() || null;
    
    // Si hay una imagen seleccionada, subirla primero
    if (selectedFile) {
      imagenUrl = await uploadImage(selectedFile);
    }

    const productData = {
      nombre: form.nombre.trim(),
      codigo_barras: form.codigo_barras.trim() || null, // This is now the description
      precio_compra: form.precio_compra ? parseFloat(form.precio_compra) : null,
      precio_venta: parseFloat(form.precio_venta),
      categoria_id: parseInt(form.categoria_id),
      imagen_url: imagenUrl
    };

    const stockInicial = parseFloat(form.stock_inicial) || 0;

    // Usar la función de base de datos para crear producto con stock inicial
    const { data, error: dbError } = await supabase.rpc('registrar_producto_con_stock_inicial', {
      p_nombre: productData.nombre,
      p_codigo_barras: productData.codigo_barras, // Pass description to p_codigo_barras
      p_precio_compra: productData.precio_compra,
      p_precio_venta: productData.precio_venta,
      p_categoria_id: productData.categoria_id,
      p_imagen_url: productData.imagen_url,
      p_stock_inicial: stockInicial
    });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(dbError.message || 'Error en la base de datos');
    }

    // Verificar si la función retornó un resultado exitoso
    if (!data || data.length === 0) {
      throw new Error('No se recibió respuesta de la base de datos');
    }

    const result = data[0];
    if (!result.producto_id) {
      throw new Error(result.mensaje || 'Error al crear el producto');
    }
  }

  async function updateProduct() {
    let imagenUrl = form.imagen_url.trim() || null;
    
    // Si hay una imagen seleccionada, subirla primero
    if (selectedFile) {
      imagenUrl = await uploadImage(selectedFile);
    }

    const productData = {
      nombre: form.nombre.trim(),
      codigo_barras: form.codigo_barras.trim() || null, // This is now the description
      precio_compra: form.precio_compra ? parseFloat(form.precio_compra) : null,
      precio_venta: parseFloat(form.precio_venta),
      categoria_id: parseInt(form.categoria_id),
      imagen_url: imagenUrl
    };

    const { error: dbError } = await supabase
      .from('productos')
      .update(productData)
      .eq('id', producto.id);

    if (dbError) throw dbError;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !loading) {
      close();
    }
  }

  // Funciones para manejo de imágenes
  async function uploadImage(file: File): Promise<string> {
    uploadingImage = true;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `productos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('Error al subir la imagen');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } finally {
      uploadingImage = false;
    }
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      selectedFile = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  function removeSelectedImage() {
    selectedFile = null;
    imagePreview = null;
    form.imagen_url = '';
  }

  // Focus management
  let nombreInput: HTMLInputElement;
  $: if (show && nombreInput) {
    setTimeout(() => nombreInput.focus(), 100);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content max-w-2xl" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div class="flex items-center">
          <Package class="h-6 w-6 text-primary-600 mr-2" />
          <h2 class="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Información básica -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
            
            <div>
              <label for="nombre" class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <div class="relative">
                <Package class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  bind:this={nombreInput}
                  bind:value={form.nombre}
                  type="text"
                  id="nombre"
                  placeholder="Zapatilla Adidas 13"
                  class="input pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label for="codigo_barras" class="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                bind:value={form.codigo_barras}
                id="codigo_barras"
                rows="3"
                placeholder="Descripción opcional del producto"
                class="input"
                disabled={loading}
              ></textarea>
            </div>

            <div>
              <label for="categoria" class="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <div class="relative">
                <Tag class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  bind:value={form.categoria_id}
                  id="categoria"
                  class="input pl-10"
                  disabled={loading}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {#each categorias as categoria}
                    <option value={categoria.id}>{categoria.nombre}</option>
                  {/each}
                </select>
              </div>
            </div>
          </div>

          <!-- Precios y stock -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Precios y Stock</h3>
            
            <div>
              <label for="precio_compra" class="block text-sm font-medium text-gray-700 mb-2">
                Precio de Compra
              </label>
              <div class="relative">
                <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  bind:value={form.precio_compra}
                  type="number"
                  id="precio_compra"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="input pl-10"
                  disabled={loading}
                />
              </div>
              <p class="text-xs text-gray-500 mt-1">Precio al que compras el producto</p>
            </div>

            <div>
              <label for="precio_venta" class="block text-sm font-medium text-gray-700 mb-2">
                Precio de Venta *
              </label>
              <div class="relative">
                <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  bind:value={form.precio_venta}
                  type="number"
                  id="precio_venta"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  class="input pl-10"
                  disabled={loading}
                  required
                />
              </div>
              <p class="text-xs text-gray-500 mt-1">Precio al que vendes el producto</p>
            </div>

            {#if !isEditing}
              <div>
                <label for="stock_inicial" class="block text-sm font-medium text-gray-700 mb-2">
                  Stock Inicial
                </label>
                <input
                  bind:value={form.stock_inicial}
                  type="number"
                  id="stock_inicial"
                  min="0"
                  step="1"
                  placeholder="0"
                  class="input"
                  disabled={loading}
                />
                <p class="text-xs text-gray-500 mt-1">Cantidad inicial en inventario</p>
              </div>
            {/if}

            <div>
              <label for="imagen" class="block text-sm font-medium text-gray-700 mb-2">
                Imagen del Producto
              </label>
              
              <!-- Opción 1: Subir archivo -->
              <div class="space-y-3">
                <div>
                  <label for="file-upload" class="cursor-pointer">
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                      <Upload class="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p class="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : 'Haz clic para subir una imagen'}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB</p>
                    </div>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    on:change={handleFileSelect}
                    disabled={loading || uploadingImage}
                  />
                </div>

                <!-- Opción 2: URL de imagen -->
                <div class="relative">
                  <Image class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    bind:value={form.imagen_url}
                    type="url"
                    placeholder="O ingresa una URL de imagen"
                    class="input pl-10"
                    disabled={loading || uploadingImage}
                  />
                </div>
              </div>

              <!-- Preview de imagen -->
              {#if imagePreview || form.imagen_url}
                <div class="mt-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-medium text-gray-700">Vista previa:</p>
                    <button
                      type="button"
                      class="text-danger-600 hover:text-danger-700 text-sm"
                      on:click={removeSelectedImage}
                      disabled={loading || uploadingImage}
                    >
                      Eliminar
                    </button>
                  </div>
                  <div class="w-24 h-24 border rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview || form.imagen_url} 
                      alt="Preview" 
                      class="w-full h-full object-cover"
                      on:error={() => {
                        if (imagePreview) {
                          removeSelectedImage();
                        } else {
                          form.imagen_url = '';
                        }
                      }}
                    />
                  </div>
                </div>
              {/if}

              {#if uploadingImage}
                <div class="mt-2 flex items-center text-sm text-primary-600">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Subiendo imagen...
                </div>
              {/if}
            </div>
          </div>
        </div>

        {#if error}
          <div class="mt-6 p-3 bg-danger-50 border border-danger-200 rounded-md">
            <p class="text-sm text-danger-700">{error}</p>
          </div>
        {/if}

        <!-- Actions -->
        <div class="flex space-x-3 mt-8">
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
            disabled={loading}
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? 'Actualizando...' : 'Creando...'}
            {:else}
              {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
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