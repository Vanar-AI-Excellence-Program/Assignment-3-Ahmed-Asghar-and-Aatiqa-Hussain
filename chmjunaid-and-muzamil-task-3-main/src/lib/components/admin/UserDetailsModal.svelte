<script lang="ts">
  import { onMount } from 'svelte';
  
  export let userId: string;
  export let onClose: () => void;
  
  let activeTab = 'sessions';
  let loading = true;
  let error = '';
  
  let userDetails = {
    user: null,
    sessions: [],
    activities: [],
    stats: {
      totalChatMessages: 0,
      totalConversations: 0,
      lastActivityAt: null,
      lastLoginAt: null
    }
  };
  
  // Pagination for activities
  let activitiesPage = 1;
  let activitiesPerPage = 10;
  let totalActivities = 0;
  
  const tabs = [
    { id: 'sessions', label: 'Sessions', icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0' },
    { id: 'activities', label: 'Activities', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'chat-stats', label: 'Chat Stats', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
  ];
  
  onMount(async () => {
    await loadUserDetails();
  });
  
  async function loadUserDetails() {
    loading = true;
    try {
      const response = await fetch(`/admin/api/users/${userId}/details`);
      if (response.ok) {
        userDetails = await response.json();
        totalActivities = userDetails.activities.length;
      } else {
        error = 'Failed to load user details';
      }
    } catch (err) {
      error = 'Error loading user details';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }
  
  async function loadActivitiesPage(page: number) {
    try {
      const response = await fetch(`/admin/api/users/${userId}/activities?page=${page}&limit=${activitiesPerPage}`);
      if (response.ok) {
        const data = await response.json();
        userDetails.activities = data.activities;
        totalActivities = data.total;
        activitiesPage = page;
      }
    } catch (err) {
      console.error('Error loading activities:', err);
    }
  }
  
  function formatDate(dateString: string) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function shortenToken(token: string) {
    if (!token) return 'N/A';
    return `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;
  }
  
  function formatMetadata(metadata: any) {
    if (!metadata) return '';
    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return String(metadata);
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
  
  $: paginatedActivities = userDetails.activities.slice(
    (activitiesPage - 1) * activitiesPerPage,
    activitiesPage * activitiesPerPage
  );
  
  $: totalPages = Math.ceil(totalActivities / activitiesPerPage);
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Backdrop -->
<div 
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  on:click={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <!-- Modal Content -->
  <div class="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-700">
      <div class="flex items-center space-x-4">
        {#if userDetails.user}
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <span class="text-lg font-semibold text-white">
              {userDetails.user.name?.charAt(0)?.toUpperCase() || userDetails.user.email?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 id="modal-title" class="text-xl font-bold text-white">
              {userDetails.user.name || 'No Name'}
            </h2>
            <p class="text-gray-400">{userDetails.user.email}</p>
            <div class="flex items-center mt-1 space-x-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
                userDetails.user.role === 'admin' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-blue-500/20 text-blue-400'
              }">
                {userDetails.user.role || 'user'}
              </span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
                userDetails.user.emailVerified 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }">
                {userDetails.user.emailVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        {/if}
      </div>
      <button
        on:click={onClose}
        class="text-gray-400 hover:text-white transition-colors p-2"
        aria-label="Close modal"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Tab Navigation -->
    <div class="px-6 border-b border-gray-700">
      <nav class="flex space-x-8">
        {#each tabs as tab}
          <button
            class="flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors {
              activeTab === tab.id 
                ? 'border-orange-500 text-orange-400' 
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }"
            on:click={() => activeTab = tab.id}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon}></path>
            </svg>
            <span>{tab.label}</span>
          </button>
        {/each}
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-hidden">
      {#if loading}
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      {:else if error}
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <p class="text-red-400">{error}</p>
          </div>
        </div>
      {:else}
        <div class="modal-content overflow-y-auto h-full">
          {#if activeTab === 'sessions'}
            <!-- Sessions Tab -->
            <div class="p-6">
              <h3 class="text-lg font-semibold text-white mb-4">User Sessions</h3>
              {#if userDetails.sessions.length === 0}
                <div class="text-center py-8">
                  <svg class="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p class="text-gray-400">No sessions found</p>
                </div>
              {:else}
                <div class="space-y-4">
                  {#each userDetails.sessions as session}
                    <div class="bg-gray-700 rounded-lg p-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p class="text-sm font-medium text-gray-400">Session Token</p>
                          <p class="text-white font-mono text-sm">{shortenToken(session.sessionToken)}</p>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-400">Status</p>
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
                            session.isActive 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }">
                            {session.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-400">IP Address</p>
                          <p class="text-white">{session.ipAddress || 'Unknown'}</p>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-400">Login Time</p>
                          <p class="text-white">{formatDate(session.loginTime)}</p>
                        </div>
                        {#if session.logoutTime}
                          <div>
                            <p class="text-sm font-medium text-gray-400">Logout Time</p>
                            <p class="text-white">{formatDate(session.logoutTime)}</p>
                          </div>
                        {/if}
                        {#if session.userAgent}
                          <div class="md:col-span-2">
                            <p class="text-sm font-medium text-gray-400">User Agent</p>
                            <p class="text-white text-sm break-all">{session.userAgent}</p>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

          {:else if activeTab === 'activities'}
            <!-- Activities Tab -->
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white">User Activities</h3>
                <p class="text-sm text-gray-400">{totalActivities} total activities</p>
              </div>
              
              {#if userDetails.activities.length === 0}
                <div class="text-center py-8">
                  <svg class="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <p class="text-gray-400">No activities found</p>
                </div>
              {:else}
                <div class="space-y-3">
                  {#each paginatedActivities as activity}
                    <div class="bg-gray-700 rounded-lg p-4">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center space-x-3 mb-2">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                              {activity.activityType}
                            </span>
                            <span class="text-sm text-gray-400">{formatDate(activity.createdAt)}</span>
                          </div>
                          <p class="text-white mb-2">{activity.description}</p>
                          {#if activity.ipAddress}
                            <p class="text-sm text-gray-400">IP: {activity.ipAddress}</p>
                          {/if}
                        </div>
                      </div>
                      {#if activity.metadata}
                        <details class="mt-3">
                          <summary class="text-sm text-gray-400 cursor-pointer hover:text-white">View Metadata</summary>
                          <pre class="mt-2 text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-x-auto">{formatMetadata(activity.metadata)}</pre>
                        </details>
                      {/if}
                    </div>
                  {/each}
                </div>

                <!-- Pagination -->
                {#if totalPages > 1}
                  <div class="flex items-center justify-between mt-6">
                    <div class="text-sm text-gray-400">
                      Showing {(activitiesPage - 1) * activitiesPerPage + 1} to {Math.min(activitiesPage * activitiesPerPage, totalActivities)} of {totalActivities}
                    </div>
                    <div class="flex items-center space-x-2">
                      <button
                        on:click={() => loadActivitiesPage(activitiesPage - 1)}
                        disabled={activitiesPage === 1}
                        class="px-3 py-2 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      >
                        Previous
                      </button>
                      <span class="px-3 py-2 text-sm text-gray-400">
                        Page {activitiesPage} of {totalPages}
                      </span>
                      <button
                        on:click={() => loadActivitiesPage(activitiesPage + 1)}
                        disabled={activitiesPage === totalPages}
                        class="px-3 py-2 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                {/if}
              {/if}
            </div>

          {:else if activeTab === 'chat-stats'}
            <!-- Chat Stats Tab -->
            <div class="p-6">
              <h3 class="text-lg font-semibold text-white mb-6">Chat Statistics</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Stats Cards -->
                <div class="bg-gray-700 rounded-lg p-6">
                  <div class="flex items-center">
                    <div class="p-3 bg-blue-500/20 rounded-lg">
                      <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-400">Total Conversations</p>
                      <p class="text-2xl font-semibold text-white">{userDetails.stats.totalConversations}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-700 rounded-lg p-6">
                  <div class="flex items-center">
                    <div class="p-3 bg-green-500/20 rounded-lg">
                      <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                      </svg>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-400">Total Messages</p>
                      <p class="text-2xl font-semibold text-white">{userDetails.stats.totalChatMessages}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-700 rounded-lg p-6">
                  <div class="flex items-center">
                    <div class="p-3 bg-purple-500/20 rounded-lg">
                      <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-400">Last Activity</p>
                      <p class="text-lg font-semibold text-white">{formatDate(userDetails.stats.lastActivityAt)}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-700 rounded-lg p-6">
                  <div class="flex items-center">
                    <div class="p-3 bg-orange-500/20 rounded-lg">
                      <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                      </svg>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-400">Last Login</p>
                      <p class="text-lg font-semibold text-white">{formatDate(userDetails.stats.lastLoginAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Additional Stats -->
              {#if userDetails.stats.totalConversations > 0}
                <div class="mt-8 bg-gray-700 rounded-lg p-6">
                  <h4 class="text-lg font-semibold text-white mb-4">Usage Insights</h4>
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-400">Average messages per conversation</span>
                      <span class="text-white font-semibold">
                        {Math.round(userDetails.stats.totalChatMessages / userDetails.stats.totalConversations)}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-400">Account age</span>
                      <span class="text-white font-semibold">
                        {userDetails.user ? Math.floor((new Date().getTime() - new Date(userDetails.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0} days
                      </span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
