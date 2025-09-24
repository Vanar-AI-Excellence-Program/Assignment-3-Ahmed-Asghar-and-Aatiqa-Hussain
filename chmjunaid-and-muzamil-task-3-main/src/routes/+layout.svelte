<script>
  import { signOut } from '@auth/sveltekit/client';
  import { goto } from '$app/navigation';
  import { invalidate } from '$app/navigation';
  
  /** @type {import('./$types').LayoutData} */
  export let data;
  
  $: user = data.user;

  async function handleLogout() {
    try {
      await signOut({ callbackUrl: '/login', redirect: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
</script>

<!-- Professional Dark Navigation -->
<nav class="bg-gray-900 border-b border-gray-700 shadow-professional">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo/Brand -->
      <div class="flex items-center">
        <a href="/" class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <span class="text-xl font-bold text-white">Authenra</span>
        </a>
      </div>

      <!-- Navigation Links -->
      <div class="hidden md:block">
        <div class="ml-10 flex items-baseline space-x-4">
          <a href="/" class="nav-link">Home</a>
          
          {#if user}
            {#if user.role === 'admin'}
              <a href="/admin" class="nav-link">Admin Panel</a>
            {/if}
                         <a href="/chat" class="nav-link">AI Chat</a>
             <a href="/dashboard" class="nav-link">Dashboard</a>
          {:else}
            <a href="/login" class="nav-link">Login</a>
            <a href="/register" class="nav-link">Register</a>
            <a href="/register/admin" class="nav-link">Admin Register</a>
          {/if}
        </div>
      </div>

      <!-- User Menu -->
      <div class="flex items-center space-x-4">
        {#if user}
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span class="text-sm font-semibold text-white">
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span class="text-sm text-gray-300 hidden sm:block">{user.name || user.email}</span>
              <span class="text-xs text-orange-400 font-semibold capitalize">({user.role || 'user'})</span>
            </div>
            <button 
              on:click={handleLogout}
              class="btn-primary text-sm px-4 py-2"
            >
              Logout
            </button>
          </div>
        {:else}
          <a href="/login" class="btn-primary text-sm px-4 py-2">
            Get Started
          </a>
        {/if}
      </div>
    </div>
  </div>
</nav>

<!-- Main Content -->
<main class="min-h-screen bg-gray-900">
  <slot />
</main>
