<script lang="ts">
  import { authService } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { Mail, Lock, Eye, EyeOff, User } from 'lucide-svelte';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let showPassword = false;
  let showConfirmPassword = false;
  let loading = false;
  let error = '';

  async function handleRegister() {
    if (!email || !password || !confirmPassword) {
      error = 'Por favor, completa todos los campos';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Las contraseñas no coinciden';
      return;
    }

    if (password.length < 6) {
      error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    loading = true;
    error = '';

    try {
      await authService.signUp(email, password);
      goto('/onboarding');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al crear la cuenta';
    } finally {
      loading = false;
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function toggleConfirmPasswordVisibility() {
    showConfirmPassword = !showConfirmPassword;
  }
</script>

<svelte:head>
  <title>Registro - SIAL pro</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
        <User class="h-8 w-8 text-white" />
      </div>
      <h2 class="mt-6 text-3xl font-bold text-gray-900">Crear Cuenta</h2>
      <p class="mt-2 text-sm text-gray-600">
        Registra tu negocio y comienza a vender
      </p>
    </div>

    <form class="mt-8 space-y-6" on:submit|preventDefault={handleRegister}>
      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              bind:value={email}
              required
              class="input pl-10"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              required
              class="input pl-10 pr-10"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={togglePasswordVisibility}
              disabled={loading}
            >
              {#if showPassword}
                <EyeOff class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              {:else}
                <Eye class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              {/if}
            </button>
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Contraseña
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              bind:value={confirmPassword}
              required
              class="input pl-10 pr-10"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={toggleConfirmPasswordVisibility}
              disabled={loading}
            >
              {#if showConfirmPassword}
                <EyeOff class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              {:else}
                <Eye class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              {/if}
            </button>
          </div>
        </div>
      </div>

      {#if error}
        <div class="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
          <p class="text-sm">{error}</p>
        </div>
      {/if}

      <div>
        <button
          type="submit"
          class="btn-primary w-full py-3 text-base font-medium"
          disabled={loading}
        >
          {#if loading}
            <div class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creando cuenta...
            </div>
          {:else}
            Crear Cuenta
          {/if}
        </button>
      </div>

      <div class="text-center">
        <p class="text-sm text-gray-600">
          ¿Ya tienes una cuenta?
          <a href="/login" class="font-medium text-primary-600 hover:text-primary-500">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </form>
  </div>
</div>