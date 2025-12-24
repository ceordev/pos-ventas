<script>
  import '../app.css';
  import { authStore, authService } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Home, ShoppingCart, Package, Users, BarChart3, LogOut, Menu, X, Tag } from 'lucide-svelte';
  import ProfileModal from '$lib/components/ProfileModal.svelte';
  
  let { children } = $props();
  let sidebarOpen = $state(false);
  let showProfileModal = $state(false);
  
  // Verificar si es una página de autenticación usando $derived
  let isAuthPage = $derived($page.url.pathname === '/login' || $page.url.pathname === '/registro' || $page.url.pathname === '/onboarding');
  
  // Verificar si mostrar el sidebar
  let showSidebar = $derived($authStore.user && $authStore.profile && !isAuthPage);
  
  // Elementos de navegación basados en el rol
  let navigationItems = $derived(() => {
    if (!$authStore.profile) return [];
    
    if ($authStore.profile.role === 'superadmin') {
      return [
        { href: '/dashboard', icon: Home, label: 'Inicio' },
        { href: '/pos', icon: ShoppingCart, label: 'Punto de Venta' },
        { href: '/productos', icon: Package, label: 'Productos' },
        { href: '/categorias', icon: Tag, label: 'Categorías' },
        { href: '/usuarios', icon: Users, label: 'Usuarios' },
        { href: '/reportes', icon: BarChart3, label: 'Reportes' }
      ];
    } else {
      return [
        { href: '/pos', icon: ShoppingCart, label: 'Punto de Venta' }
      ];
    }
  });
  
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
  
  function closeSidebar() {
    sidebarOpen = false;
  }
  
  async function handleLogout() {
    await authService.signOut();
    goto('/login');
  }

  function openProfile() {
    showProfileModal = true;
    closeSidebar();
  }
  
  // Manejar redirecciones con efecto
  $effect(() => {
    if (typeof window !== 'undefined' && !$authStore.loading) {
      const currentIsAuthPage = $page.url.pathname === '/login' || $page.url.pathname === '/registro' || $page.url.pathname === '/onboarding';
      
      if (!$authStore.user && !currentIsAuthPage) {
        goto('/login');
      } else if ($authStore.user && $authStore.profile && currentIsAuthPage) {
        if ($authStore.profile.role === 'superadmin') {
          goto('/dashboard');
        } else {
          goto('/pos');
        }
      } else if ($authStore.user && !$authStore.profile && !currentIsAuthPage && $page.url.pathname !== '/onboarding') {
        goto('/onboarding');
      }
    }
  });
</script>

{#if $authStore.loading}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Cargando...</p>
    </div>
  </div>
{:else if showSidebar}
  <div class="min-h-screen bg-gray-50">
    <!-- Overlay para móvil -->
     {#if sidebarOpen}
       <button class="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75" onclick={closeSidebar} aria-label="Cerrar menú">
       </button>
     {/if}
    
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0">
      <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900">SIAL pro</h1>
        <button class="lg:hidden" onclick={closeSidebar}>
          <X class="h-6 w-6 text-gray-500" />
        </button>
      </div>
      
      <nav class="mt-8">
        <div class="px-4 space-y-2">
          {#each navigationItems() as item}
              {@const IconComponent = item.icon}
              <a 
                href={item.href} 
                class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors"
                onclick={closeSidebar}
              >
                <IconComponent class="h-5 w-5 mr-3" />
                {item.label}
              </a>
            {/each}
        </div>
        
        <!-- Usuario y logout -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div class="flex items-center mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onclick={openProfile}>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{$authStore.profile?.nombres}</p>
              <p class="text-xs text-gray-500 capitalize">{$authStore.profile?.role}</p>
              <p class="text-xs text-primary-600 mt-1">Configurar Perfil</p>
            </div>
          </div>
          <button 
            class="flex items-center w-full px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            onclick={handleLogout}
          >
            <LogOut class="h-4 w-4 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </div>
    
    <!-- Contenido principal -->
    <div class="lg:pl-64">
      <!-- Header móvil -->
      <div class="lg:hidden">
        <div class="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button onclick={toggleSidebar}>
            <Menu class="h-6 w-6 text-gray-500" />
          </button>
          <h1 class="text-lg font-semibold text-gray-900">SiAl pro</h1>
          <button 
            class="flex items-center text-red-600 hover:text-red-700"
            onclick={handleLogout}
          >
            <LogOut class="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <!-- Contenido de la página -->
      <main class="flex-1">
        {#key $page.url.pathname}
          {#if children}
            {@render children()}
          {/if}
        {/key}
      </main>
    </div>
  </div>
{:else}
  {#key $page.url.pathname}
    {#if children}
      {@render children()}
    {/if}
  {/key}
{/if}

<ProfileModal bind:show={showProfileModal} on:close={() => showProfileModal = false} />
