<script lang="ts">
  import { onMount } from 'svelte';
  import UserDetailsModal from '$lib/components/admin/UserDetailsModal.svelte';
  import RecentActivitiesTab from '$lib/components/admin/RecentActivitiesTab.svelte';
  import UserManagementTab from '$lib/components/admin/UserManagementTab.svelte';
  import OverviewTab from '$lib/components/admin/OverviewTab.svelte';
  
  /** @type {import('./$types').PageData} */
  export let data;
  
  $: user = data.user;
  $: users = data.users || [];
  
  let activeTab = 'overview';
  let showUserDetailsModal = false;
  let selectedUserId = null;
  
  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'user-management', label: 'User Management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { id: 'recent-activities', label: 'Recent Activities', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }
  ];

  function openUserDetails(userId: string) {
    selectedUserId = userId;
    showUserDetailsModal = true;
  }

  function closeUserDetails() {
    showUserDetailsModal = false;
    selectedUserId = null;
  }
</script>

{#if user?.role === 'admin'}
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700">
      <div class="px-6 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p class="text-gray-400">Complete system oversight and user management</p>
          </div>
          <div class="flex items-center space-x-3">
            <div class="text-right">
              <p class="text-sm text-gray-400">Logged in as</p>
              <p class="text-white font-semibold">{user.name || user.email}</p>
            </div>
            <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <span class="text-sm font-semibold text-white">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="px-6">
        <nav class="flex space-x-8">
          {#each tabs as tab}
            <button
              class="flex items-center space-x-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors {
                activeTab === tab.id 
                  ? 'border-orange-500 text-orange-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }"
              on:click={() => activeTab = tab.id}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon}></path>
              </svg>
              <span>{tab.label}</span>
            </button>
          {/each}
        </nav>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="px-6 py-8">
      {#if activeTab === 'overview'}
        <OverviewTab {users} />
      {:else if activeTab === 'user-management'}
        <UserManagementTab {users} {openUserDetails} />
      {:else if activeTab === 'recent-activities'}
        <RecentActivitiesTab />
      {/if}
    </div>

    <!-- User Details Modal -->
    {#if showUserDetailsModal && selectedUserId}
      <UserDetailsModal userId={selectedUserId} onClose={closeUserDetails} />
    {/if}
  </div>
{:else}
  <div class="min-h-screen bg-gray-900 flex items-center justify-center">
    <div class="text-center">
      <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-white mb-4">Access Denied</h1>
      <p class="text-gray-400 mb-6">This page is only available to administrators.</p>
      <a href="/" class="btn-primary">
        Go Home
      </a>
    </div>
  </div>
{/if}

<style>
  /* Custom scrollbar for modal content */
  :global(.modal-content) {
    scrollbar-width: thin;
    scrollbar-color: #4B5563 #1F2937;
  }
  
  :global(.modal-content::-webkit-scrollbar) {
    width: 8px;
  }
  
  :global(.modal-content::-webkit-scrollbar-track) {
    background: #1F2937;
  }
  
  :global(.modal-content::-webkit-scrollbar-thumb) {
    background: #4B5563;
    border-radius: 4px;
  }
  
  :global(.modal-content::-webkit-scrollbar-thumb:hover) {
    background: #6B7280;
  }
</style>