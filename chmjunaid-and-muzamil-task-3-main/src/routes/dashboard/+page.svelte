<script lang="ts">
  import UnifiedDashboard from '$lib/components/dashboard/UnifiedDashboard.svelte';
  
  /** @type {import('./$types').PageData} */
  export let data;
  
  $: user = data.user;
  $: isAdmin = user?.role === 'admin';
</script>

{#if user}
  <UnifiedDashboard {user} {isAdmin} />
{:else}
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-white mb-4">Not Logged In</h1>
      <p class="text-gray-400 mb-6">Please sign in to access your dashboard.</p>
      <a href="/login" class="btn-primary">
        Sign In
      </a>
    </div>
  </div>
{/if}
