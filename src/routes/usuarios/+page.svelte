<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { 
    Users, 
    Plus, 
    Edit, 
    Trash2, 
    Mail, 
    User, 
    Shield,
    Search,
    X
  } from 'lucide-svelte';
  import UsuarioModal from '$lib/components/UsuarioModal.svelte';

  let loading = true;
  let usuarios: any[] = [];
  let filteredUsuarios: any[] = [];
  let searchTerm = '';
  let showModal = false;
  let editingUser: any = null;
  let error = '';

  // Reactive filtering
  $: {
    filteredUsuarios = usuarios.filter(usuario => 
      usuario.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  onMount(async () => {
    await loadUsuarios();
    loading = false;
  });

  async function loadUsuarios() {
    try {
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .select(`
          *,
          roles(nombre)
        `)
        .order('nombres');

      if (dbError) throw dbError;
      
      usuarios = data.map(usuario => ({
        ...usuario,
        rol_nombre: usuario.roles?.nombre || 'Sin rol'
      }));
    } catch (err: any) {
      error = err.message || 'Error al cargar usuarios';
      console.error('Error loading usuarios:', err);
    }
  }

  function openCreateModal() {
    editingUser = null;
    showModal = true;
  }

  function openEditModal(usuario: any) {
    editingUser = usuario;
    showModal = true;
  }

  async function handleUserSaved() {
    showModal = false;
    editingUser = null;
    await loadUsuarios();
  }

  async function deleteUser(usuario: any) {
    if (usuario.rol_nombre === 'superadmin') {
      alert('No se puede eliminar un superadmin');
      return;
    }

    if (!confirm(`¿Está seguro de eliminar al usuario "${usuario.nombres}"?`)) {
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuario.id);

      if (dbError) throw dbError;
      
      await loadUsuarios();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    }
  }

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchTerm = target.value;
  }

  function clearSearch() {
    searchTerm = '';
  }

  function getRoleBadgeClass(roleName: string): string {
    switch (roleName) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800';
      case 'cajero':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Gestión de Usuarios</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <Users class="h-8 w-8 mr-3" />
            Gestión de Usuarios
          </h1>
          <p class="text-gray-600 mt-1">Administra cajeros y permisos del sistema</p>
        </div>
        
        <button class="btn-primary" on:click={openCreateModal}>
          <Plus class="h-5 w-5 mr-2" />
          Nuevo Usuario
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
      <div class="flex items-center space-x-4">
        <div class="flex-1 relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            class="input pl-10"
            value={searchTerm}
            on:input={handleSearch}
          />
        </div>
        
        {#if searchTerm}
          <button class="btn-secondary" on:click={clearSearch}>
            <X class="h-4 w-4 mr-2" />
            Limpiar
          </button>
        {/if}
      </div>
      
      <div class="mt-4 flex items-center text-sm text-gray-600">
        <Users class="h-4 w-4 mr-2" />
        Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    {:else if filteredUsuarios.length === 0}
      <div class="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Users class="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {usuarios.length === 0 ? 'No hay usuarios' : 'No se encontraron usuarios'}
        </h3>
        <p class="text-gray-600 mb-6">
          {usuarios.length === 0 
            ? 'Comienza agregando cajeros para tu negocio' 
            : 'Intenta ajustar el término de búsqueda'}
        </p>
        {#if usuarios.length === 0}
          <button class="btn-primary" on:click={openCreateModal}>
            <Plus class="h-5 w-5 mr-2" />
            Agregar Primer Usuario
          </button>
        {/if}
      </div>
    {:else}
      <!-- Lista de usuarios -->
      <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredUsuarios as usuario}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User class="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{usuario.nombres}</div>
                        {#if usuario.apellidos}
                          <div class="text-sm text-gray-500">{usuario.apellidos}</div>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <Mail class="h-4 w-4 text-gray-400 mr-2" />
                      <span class="text-sm text-gray-900">{usuario.email}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getRoleBadgeClass(usuario.rol_nombre)}">
                      <Shield class="h-3 w-3 mr-1" />
                      {usuario.rol_nombre}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(usuario.created_at)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        class="text-primary-600 hover:text-primary-900 p-1"
                        on:click={() => openEditModal(usuario)}
                        title="Editar usuario"
                      >
                        <Edit class="h-4 w-4" />
                      </button>
                      {#if usuario.rol_nombre !== 'superadmin'}
                        <button
                          class="text-danger-600 hover:text-danger-900 p-1"
                          on:click={() => deleteUser(usuario)}
                          title="Eliminar usuario"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      {/if}
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

<!-- Modal de usuario -->
{#if showModal}
  <UsuarioModal
    show={showModal}
    usuario={editingUser}
    on:close={() => showModal = false}
    on:saved={handleUserSaved}
  />
{/if}