<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { X, Eye, EyeOff, User, Mail, Shield, Lock } from 'lucide-svelte';

  export let show = false;
  export let user: any = null;

  const dispatch = createEventDispatcher();

  let loading = false;
  let error = '';
  let showPassword = false;
  let roles: any[] = [];

  // Form data
  let formData = {
    nombres: '',
    email: '',
    password: '',
    rol_id: ''
  };

  $: if (show) {
    loadRoles();
    if (user) {
      // Editing existing user
      formData = {
        nombres: user.nombres || '',
        email: user.email || '',
        password: '',
        rol_id: user.rol_id || ''
      };
    } else {
      // Creating new user
      formData = {
        nombres: '',
        email: '',
        password: '',
        rol_id: ''
      };
    }
    error = '';
  }

  async function loadRoles() {
    try {
      const { data, error: dbError } = await supabase
        .from('roles')
        .select('*')
        .order('nombre');

      if (dbError) throw dbError;
      roles = data || [];
    } catch (err: any) {
      console.error('Error loading roles:', err);
    }
  }

  async function handleSubmit() {
    if (!formData.nombres.trim()) {
      error = 'El nombre es requerido';
      return;
    }

    if (!formData.email.trim()) {
      error = 'El email es requerido';
      return;
    }

    if (!user && !formData.password.trim()) {
      error = 'La contraseña es requerida para nuevos usuarios';
      return;
    }

    if (formData.password && formData.password.length < 6) {
      error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (!formData.rol_id) {
      error = 'Debe seleccionar un rol';
      return;
    }

    loading = true;
    error = '';

    try {
      if (user) {
        // Update existing user
        const updateData: any = {
          nombres: formData.nombres.trim(),
          email: formData.email.trim(),
          rol_id: formData.rol_id
        };

        const { error: dbError } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', user.id);

        if (dbError) throw dbError;

        // Update password if provided
        if (formData.password.trim()) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            user.auth_user_id,
            { password: formData.password }
          );
          if (authError) throw authError;
        }
      } else {
        // Create new user using the create_cajero_user function
        const { data, error: dbError } = await supabase
          .rpc('create_cajero_user', {
            nombres: formData.nombres.trim(),
            email: formData.email.trim(),
            password: formData.password,
            direccion: '',
            telefono: ''
          });

        if (dbError) throw dbError;
      }

      dispatch('saved');
    } catch (err: any) {
      error = err.message || 'Error al guardar usuario';
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    if (!loading) {
      dispatch('close');
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="modal-title">
          <User class="w-6 h-6" />
          {user ? 'Editar Usuario' : 'Crear Usuario'}
        </h2>
        <button 
          type="button" 
          class="modal-close" 
          on:click={handleClose}
          disabled={loading}
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        {#if error}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        {/if}

        <div>
          <label for="nombres" class="block text-sm font-medium text-gray-700 mb-1">
            <User class="w-4 h-4 inline mr-1" />
            Nombre Completo
          </label>
          <input
            id="nombres"
            type="text"
            bind:value={formData.nombres}
            class="input"
            placeholder="Ingrese el nombre completo"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            <Mail class="w-4 h-4 inline mr-1" />
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            class="input"
            placeholder="usuario@ejemplo.com"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            <Lock class="w-4 h-4 inline mr-1" />
            Contraseña {user ? '(dejar vacío para no cambiar)' : ''}
          </label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={formData.password}
              class="input pr-10"
              placeholder={user ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              disabled={loading}
              required={!user}
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={togglePasswordVisibility}
              disabled={loading}
            >
              {#if showPassword}
                <EyeOff class="w-4 h-4 text-gray-400" />
              {:else}
                <Eye class="w-4 h-4 text-gray-400" />
              {/if}
            </button>
          </div>
          {#if formData.password && formData.password.length < 6}
            <p class="text-sm text-red-600 mt-1">La contraseña debe tener al menos 6 caracteres</p>
          {/if}
        </div>

        <div>
          <label for="rol_id" class="block text-sm font-medium text-gray-700 mb-1">
            <Shield class="w-4 h-4 inline mr-1" />
            Rol
          </label>
          <select
            id="rol_id"
            bind:value={formData.rol_id}
            class="input"
            disabled={loading}
            required
          >
            <option value="">Seleccionar rol</option>
            {#each roles as rol}
              <option value={rol.id}>{rol.nombre}</option>
            {/each}
          </select>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            class="btn-secondary"
            on:click={handleClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary"
            disabled={loading}
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {/if}
            {user ? 'Actualizar' : 'Crear'} Usuario
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
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    margin: 1rem;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 0 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 1.5rem;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .modal-close {
    padding: 0.5rem;
    border-radius: 0.375rem;
    color: #6b7280;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .modal-content form {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }
</style>