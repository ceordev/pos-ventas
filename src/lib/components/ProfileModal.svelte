<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore, authService } from '$lib/stores/auth';
  import { X, User, Lock, Mail, Save, AlertTriangle, Eye, EyeOff } from 'lucide-svelte';

  export let show = false;

  const dispatch = createEventDispatcher();
  
  let activeTab: 'general' | 'security' = 'general';
  let loading = false;
  let error = '';
  let success = '';

  // Form fields
  let newEmail = '';
  let newPassword = '';
  let confirmPassword = '';
  
  // Visibility toggles
  let showPassword = false;
  let showConfirmPassword = false;


  
  let previousShow = false;

  $: if (show && !previousShow && $authStore.user) {
    // Run only when modal opens
    resetForm();
  }
  
  $: previousShow = show;

  function resetForm() {
    newEmail = $authStore.user?.email || '';
    newPassword = '';
    confirmPassword = '';
    error = '';
    success = '';
    activeTab = 'general';
    loading = false;
  }

  function close() {
    dispatch('close');
  }

  async function handleUpdateProfile() {
    error = '';
    success = '';
    loading = true;

    try {
      const updates: { email?: string; password?: string } = {};
      let hasChanges = false;

      // Check email change
      if (newEmail && newEmail !== $authStore.user?.email) {
        updates.email = newEmail;
        hasChanges = true;
      }

      // Check password change
      if (newPassword) {
        if (newPassword.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        updates.password = newPassword;
        hasChanges = true;
      }

      if (!hasChanges) {
        loading = false;
        return;
      }

      console.log('Sending update to Supabase:', updates);
      await authService.updateUser(updates);
      console.log('Update successful, preparing success message.');
      
      let message = 'Perfil actualizado correctamente.';
      if (updates.email) {
        message += ' IMPORTANTE: Se ha enviado un correo de confirmación a tu nueva dirección. El cambio no se aplicará hasta que hagas clic en el enlace del correo.';
      }
      
      success = message;
      
      // Clear password fields logic
      newPassword = '';
      confirmPassword = '';
      
      // Don't close immediately so user sees message
    } catch (err: any) {
      console.error('Error updating profile:', err);
      error = err.message || 'Error al actualizar el perfil';
    } finally {
      console.log('Setting loading to false');
      loading = false;
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <h3 class="text-lg font-medium text-gray-900">Configuración de Perfil</h3>
        <button on:click={close} class="text-gray-400 hover:text-gray-500">
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b">
        <button
          class="flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors {activeTab === 'general' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'general'}
        >
          General
        </button>
        <button
          class="flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors {activeTab === 'security' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'security'}
        >
          Seguridad
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        {#if error}
          <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative text-sm">
            <span class="block sm:inline">{error}</span>
          </div>
        {/if}

        {#if success}
          <div class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative text-sm">
            <span class="block sm:inline">{success}</span>
          </div>
        {/if}

        {#if activeTab === 'general'}
          <div class="space-y-4">
             <div class="flex justify-center mb-6">
                <div class="h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center">
                    <User class="h-12 w-12 text-primary-600" />
                </div>
             </div>

             <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                    <label class="text-xs text-gray-500 uppercase font-semibold">Nombre Completo</label>
                    <p class="text-sm font-medium text-gray-900">{$authStore.profile?.nombres || 'No disponible'}</p>
                </div>
                <div>
                    <label class="text-xs text-gray-500 uppercase font-semibold">Rol</label>
                    <p class="text-sm font-medium text-gray-900 capitalize">{$authStore.profile?.role || 'Usuario'}</p>
                </div>
                <div>
                    <label class="text-xs text-gray-500 uppercase font-semibold">Estado</label>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Activo
                    </span>
                </div>
             </div>
             
             <p class="text-xs text-center text-gray-500 mt-4">
                Para cambiar información personal, contacta al administrador.
             </p>
          </div>
        {:else}
          <div class="space-y-4">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail class="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  bind:value={newEmail}
                  class="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="nuevo@correo.com"
                />
              </div>
            </div>

            <div class="border-t my-4"></div>

            <h4 class="text-sm font-medium text-gray-900">Cambiar Contraseña</h4>
            
            <!-- New Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock class="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  bind:value={newPassword}
                  class="block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  on:click={() => showPassword = !showPassword}
                >
                  {#if showPassword}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </button>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock class="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  bind:value={confirmPassword}
                  class="block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  on:click={() => showConfirmPassword = !showConfirmPassword}
                >
                  {#if showConfirmPassword}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </button>
              </div>
            </div>
            
            {#if newPassword && newPassword !== confirmPassword}
              <p class="text-xs text-red-600 flex items-center">
                 Las contraseñas no coinciden
              </p>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
        <button
          type="button"
          class="btn-secondary"
          on:click={close}
          disabled={loading}
        >
          Cancelar
        </button>
        {#if activeTab === 'security'}
            <button
            type="button"
            class="btn-primary"
            on:click={handleUpdateProfile}
            disabled={loading || (activeTab === 'security' && !newPassword && newEmail === $authStore.user?.email)}
            >
            {#if loading}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
            {:else}
                <Save class="h-4 w-4 mr-2" />
                Guardar Cambios
            {/if}
            </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
