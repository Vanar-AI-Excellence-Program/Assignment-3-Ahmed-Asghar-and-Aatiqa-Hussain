<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let sessions = [];
  let loading = true;
  let error = null;
  let pagination = { page: 1, limit: 20, total: 0, pages: 0 };
  let selectedUserId = '';
  let actionLoading = false;
  let message = '';

  // Fetch sessions data
  async function fetchSessions(pageNum = 1, userId = '') {
    loading = true;
    error = null;
    
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: pagination.limit.toString()
      });
      
      if (userId) {
        params.append('userId', userId);
      }
      
      const response = await fetch(`/admin/sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      sessions = data.sessions;
      pagination = data.pagination;
    } catch (err) {
      error = err.message;
      console.error('Error fetching sessions:', err);
    } finally {
      loading = false;
    }
  }

  // Delete specific session
  async function deleteSession(sessionToken) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    actionLoading = true;
    try {
      const response = await fetch('/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
      
      if (!response.ok) throw new Error('Failed to delete session');
      
      message = 'Session deleted successfully';
      await fetchSessions(pagination.page, selectedUserId);
    } catch (err) {
      error = err.message;
      console.error('Error deleting session:', err);
    } finally {
      actionLoading = false;
    }
  }

  // Delete all sessions for a user
  async function deleteUserSessions(userId) {
    if (!confirm('Are you sure you want to delete all sessions for this user?')) return;
    
    actionLoading = true;
    try {
      const response = await fetch('/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) throw new Error('Failed to delete user sessions');
      
      message = 'All user sessions deleted successfully';
      await fetchSessions(pagination.page, selectedUserId);
    } catch (err) {
      error = err.message;
      console.error('Error deleting user sessions:', err);
    } finally {
      actionLoading = false;
    }
  }

  // Clean up expired sessions
  async function cleanupExpiredSessions() {
    if (!confirm('Are you sure you want to clean up all expired sessions?')) return;
    
    actionLoading = true;
    try {
      const response = await fetch('/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      });
      
      if (!response.ok) throw new Error('Failed to cleanup expired sessions');
      
      const data = await response.json();
      message = `Cleanup completed. ${data.deletedCount} expired sessions deleted.`;
      await fetchSessions(pagination.page, selectedUserId);
    } catch (err) {
      error = err.message;
      console.error('Error cleaning up sessions:', err);
    } finally {
      actionLoading = false;
    }
  }

  // Filter by user ID
  function filterByUser() {
    fetchSessions(1, selectedUserId);
  }

  // Clear filter
  function clearFilter() {
    selectedUserId = '';
    fetchSessions(1, '');
  }

  // Format date
  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  // Check if session is expired
  function isExpired(expires) {
    return new Date() > new Date(expires);
  }

  // Get time until expiry
  function getTimeUntilExpiry(expires) {
    const now = new Date();
    const expiry = new Date(expires);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  onMount(() => {
    fetchSessions();
  });
</script>

<svelte:head>
  <title>Session Management - Admin Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Session Management</h1>
    <p class="text-gray-600">Manage user sessions and monitor active connections</p>
  </div>

  <!-- Controls -->
  <Card class="mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-4 items-center">
        <div>
          <label for="userId" class="block text-sm font-medium text-gray-700 mb-1">
            Filter by User ID
          </label>
          <Input
            id="userId"
            type="number"
            bind:value={selectedUserId}
            placeholder="Enter user ID"
            class="w-32"
          />
        </div>
        <Button onClick={filterByUser} disabled={actionLoading}>
          Filter
        </Button>
        <Button variant="outline" onClick={clearFilter} disabled={actionLoading}>
          Clear
        </Button>
      </div>
      
      <Button 
        onClick={cleanupExpiredSessions} 
        disabled={actionLoading}
        variant="destructive"
      >
        {actionLoading ? 'Cleaning...' : 'Cleanup Expired Sessions'}
      </Button>
    </div>
  </Card>

  <!-- Message Display -->
  {#if message}
    <div class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
      {message}
    </div>
  {/if}

  <!-- Error Display -->
  {#if error}
    <div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      {error}
    </div>
  {/if}

  <!-- Sessions Table -->
  <Card>
    {#if loading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Loading sessions...</p>
      </div>
    {:else if sessions.length === 0}
      <div class="p-8 text-center">
        <p class="text-gray-600">No sessions found</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session Token
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each sessions as { session, user }}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                    <div class="text-sm text-gray-500">{user.email}</div>
                    <div class="text-xs text-gray-400">ID: {user.id} | Role: {user.role}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 font-mono">
                    {session.sessionToken.substring(0, 20)}...
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {formatDate(session.expires)}
                  </div>
                  <div class="text-xs text-gray-500">
                    {getTimeUntilExpiry(session.expires)}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if isExpired(session.expires)}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Expired
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSession(session.sessionToken)}
                      disabled={actionLoading}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUserSessions(user.id)}
                      disabled={actionLoading}
                    >
                      Delete All User
                    </Button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if pagination.pages > 1}
        <div class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div class="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fetchSessions(pagination.page - 1, selectedUserId)}
                disabled={pagination.page <= 1 || actionLoading}
              >
                Previous
              </Button>
              <span class="px-3 py-2 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchSessions(pagination.page + 1, selectedUserId)}
                disabled={pagination.page >= pagination.pages || actionLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </Card>
</div>
