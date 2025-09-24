<script lang="ts">
  import { onMount } from 'svelte';

  import ActivityTooltip from './ActivityTooltip.svelte';
  
  let activities = [];
  let loading = true;
  let error = '';
  let hoveredActivity = null;
  let tooltipPosition = { x: 0, y: 0 };
  let tooltipElement;
  
  // Filters
  let selectedActivityType = 'all';
  let selectedTimeRange = '7d';
  let searchTerm = '';
  let sortBy = 'newest'; // Default sort
  
  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalActivities = 0;
  
  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'login', label: 'User Logins' },
    { value: 'logout', label: 'User Logouts' },
    { value: 'chat', label: 'Chat Messages' },
    { value: 'profile_update', label: 'Profile Updates' },
    { value: 'password_change', label: 'Password Changes' },
    { value: 'admin_action', label: 'Admin Actions' }
  ];
  
  const timeRanges = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'activity-type', label: 'Activity Type' },
    { value: 'user-name', label: 'User Name' },
    { value: 'ip-address', label: 'IP Address' }
  ];
  
  onMount(async () => {
    // Load saved sort preference from localStorage
    const savedSort = localStorage.getItem('admin-activities-sort');
    if (savedSort && sortOptions.some(option => option.value === savedSort)) {
      sortBy = savedSort;
    }
    
    await loadActivities();
  });

  // Save sort preference to localStorage when it changes
  $: {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-activities-sort', sortBy);
    }
  }
  
  async function loadActivities() {
    loading = true;
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        type: selectedActivityType,
        timeRange: selectedTimeRange,
        search: searchTerm
      });
      
      const response = await fetch(`/admin/api/activities?${params}`);
      if (response.ok) {
        const data = await response.json();
        activities = data.activities;
        totalActivities = data.total;
      } else {
        error = 'Failed to load activities';
      }
    } catch (err) {
      error = 'Error loading activities';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }
  
  function handleActivityHover(event, activity) {
    hoveredActivity = activity;
    tooltipPosition = {
      x: event.clientX,
      y: event.clientY
    };
  }
  
  function handleActivityLeave() {
    hoveredActivity = null;
  }

  function applySorting(activitiesList) {
    const sorted = [...activitiesList];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      case 'activity-type':
        return sorted.sort((a, b) => {
          const typeA = a.activityType.toLowerCase();
          const typeB = b.activityType.toLowerCase();
          if (typeA < typeB) return -1;
          if (typeA > typeB) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Secondary sort by newest
        });
      
      case 'user-name':
        return sorted.sort((a, b) => {
          const nameA = (a.userName || 'Unknown User').toLowerCase();
          const nameB = (b.userName || 'Unknown User').toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Secondary sort by newest
        });
      
      case 'ip-address':
        return sorted.sort((a, b) => {
          const ipA = a.ipAddress || '';
          const ipB = b.ipAddress || '';
          if (ipA < ipB) return -1;
          if (ipA > ipB) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Secondary sort by newest
        });
      
      default:
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }
  
  function formatActivityTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getActivityIcon(activityType) {
    const icons = {
      login: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
      logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      profile_update: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      password_change: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
      admin_action: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      default: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[activityType] || icons.default;
  }
  
  function getActivityColor(activityType) {
    const colors = {
      login: 'text-green-400',
      logout: 'text-red-400',
      chat: 'text-blue-400',
      profile_update: 'text-purple-400',
      password_change: 'text-yellow-400',
      admin_action: 'text-orange-400',
      default: 'text-gray-400'
    };
    return colors[activityType] || colors.default;
  }
  
  // Reactive statements for filtering and pagination
  $: {
    if (selectedActivityType || selectedTimeRange || searchTerm) {
      currentPage = 1;
      loadActivities();
    }
  }

  // Apply client-side sorting when sortBy changes or activities are loaded
  $: sortedActivities = applySorting(activities);
  
  $: totalPages = Math.ceil(totalActivities / itemsPerPage);
  
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      loadActivities();
    }
  }
</script>

<div class="space-y-8">
  <!-- Page Title -->
  <div>
    <h2 class="text-2xl font-bold text-white mb-2">Recent Activities</h2>
    <p class="text-gray-400">Monitor user activities and system analytics in real-time</p>
  </div>

  <!-- Activities Section -->
  <div class="space-y-6">
    <!-- Activities List -->
    <div class="card">
      <div class="px-6 py-4 border-b border-gray-700">
        <div class="space-y-4">
          <!-- Header Row -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 class="text-lg font-semibold text-white">Activity Feed</h3>
            <div class="text-sm text-gray-400 whitespace-nowrap">
              {totalActivities.toLocaleString()} total activities
            </div>
          </div>
          
          <!-- Filters Row -->
          <div class="flex flex-col sm:flex-row gap-2">
            <!-- Search Box -->
            <div class="w-full sm:w-40">
              <label for="search-activities" class="block text-xs font-medium text-gray-400 mb-1">Search</label>
              <input
                id="search-activities"
                type="text"
                placeholder="Search..."
                bind:value={searchTerm}
                class="input-field w-full text-xs py-1 px-2"
              />
            </div>
            
            <!-- Activity Type Filter -->
            <div class="w-full sm:w-32">
              <label for="activity-type-filter" class="block text-xs font-medium text-gray-400 mb-1">Type</label>
              <select id="activity-type-filter" bind:value={selectedActivityType} class="input-field w-full text-xs py-1 px-2">
                {#each activityTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </div>
            
            <!-- Time Range Filter -->
            <div class="w-full sm:w-28">
              <label for="time-range-filter" class="block text-xs font-medium text-gray-400 mb-1">Range</label>
              <select id="time-range-filter" bind:value={selectedTimeRange} class="input-field w-full text-xs py-1 px-2">
                {#each timeRanges as range}
                  <option value={range.value}>{range.label}</option>
                {/each}
              </select>
            </div>
            
            <!-- Sort By Dropdown -->
            <div class="w-full sm:w-28">
              <label for="sort-by-filter" class="block text-xs font-medium text-gray-400 mb-1">Sort</label>
              <select 
                id="sort-by-filter" 
                bind:value={sortBy} 
                class="input-field w-full text-xs py-1 px-2"
              >
                {#each sortOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      </div>

      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      {:else if error}
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <p class="text-red-400">{error}</p>
          </div>
        </div>
      {:else if sortedActivities.length === 0}
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <svg class="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-400 mb-2">No activities found</h3>
            <p class="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        </div>
      {:else}
        <div class="divide-y divide-gray-700">
          {#each sortedActivities as activity}
            <div 
              class="px-6 py-4 hover:bg-gray-750 transition-colors cursor-pointer relative"
              on:mouseenter={(e) => handleActivityHover(e, activity)}
              on:mouseleave={handleActivityLeave}
              role="listitem"
            >
              <div class="flex items-start space-x-4">
                <!-- Activity Icon -->
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg class="w-4 h-4 {getActivityColor(activity.activityType)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getActivityIcon(activity.activityType)}></path>
                  </svg>
                </div>
                
                <!-- Activity Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="text-white text-sm">
                      <span class="font-medium">{activity.userName || 'Unknown User'}</span>
                      <span class="text-gray-400 ml-1">{activity.description}</span>
                    </p>
                    <time class="text-xs text-gray-500 flex-shrink-0">
                      {formatActivityTime(activity.createdAt)}
                    </time>
                  </div>
                  
                  {#if activity.ipAddress}
                    <p class="text-xs text-gray-500 mt-1">
                      from {activity.ipAddress}
                    </p>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="px-6 py-4 border-t border-gray-700">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalActivities)} of {totalActivities.toLocaleString()} activities
              </div>
              
              <div class="flex items-center space-x-2">
                <button
                  on:click={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  class="px-3 py-2 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                  Previous
                </button>
                
                <!-- Page Numbers -->
                        {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
          const start = Math.max(1, currentPage - 2);
          return start + i;
        }).filter(page => page <= totalPages) as page}
                  <button
                    on:click={() => goToPage(page)}
                    class="px-3 py-2 text-sm border rounded transition-colors {
                      page === currentPage 
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400' 
                        : 'border-gray-600 hover:bg-gray-700 text-white'
                    }"
                  >
                    {page}
                  </button>
                {/each}
                
                <button
                  on:click={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="px-3 py-2 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Activity Tooltip -->
{#if hoveredActivity}
  <ActivityTooltip 
    activity={hoveredActivity} 
    position={tooltipPosition}
    bind:element={tooltipElement}
  />
{/if}

<style>
  /* Enhanced sort dropdown styling */
  :global(.sort-dropdown) {
    @apply rounded-lg shadow-sm border border-gray-600 bg-gray-800 text-white;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.7rem center;
    background-size: 1.2em;
    padding-right: 2.5rem;
  }

  :global(.sort-dropdown:focus) {
    @apply ring-2 ring-orange-500 ring-opacity-50 border-orange-500;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }

  :global(.sort-dropdown:hover) {
    @apply border-gray-500;
  }

  /* Mobile responsive adjustments */
  @media (max-width: 768px) {
    :global(.sort-dropdown) {
      @apply text-sm;
    }
  }
</style>
