<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let users: any[] = [];
  let isAdmin = true; // Fetch this dynamically from session/user info
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const res = await fetch('/admin/data');
      if (res.ok) {
        const data = await res.json();
        users = data.users || [];
      } else {
        error = 'Failed to load users';
      }
    } catch (err) {
      error = 'Failed to load users';
    } finally {
      loading = false;
    }
  });

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        users = users.filter(user => user.id !== userId);
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Failed to delete user');
    }
  }
</script>

<div class="p-6">
  <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Admin Dashboard</h1>

  {#if isAdmin}
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">All Users ({users.length})</h2>
      
      {#if loading}
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      {:else if error}
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-600 dark:text-red-400">{error}</p>
        </div>
      {:else}
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <table class="w-full border-collapse">
            <thead>
              <tr class="text-left bg-gray-50 dark:bg-gray-700">
                <th class="p-4 font-medium text-gray-700 dark:text-gray-300">Name</th>
                <th class="p-4 font-medium text-gray-700 dark:text-gray-300">Email</th>
                <th class="p-4 font-medium text-gray-700 dark:text-gray-300">Role</th>
                <th class="p-4 font-medium text-gray-700 dark:text-gray-300">Verified</th>
                <th class="p-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="p-4 text-gray-900 dark:text-white">{user.name || 'N/A'}</td>
                  <td class="p-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td class="p-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      {user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }">
                      {user.role}
                    </span>
                  </td>
                  <td class="p-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      {user.emailVerified 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }">
                      {user.emailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td class="p-4">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      on:click={() => deleteUser(user.id)}
                      disabled={user.role === 'admin'}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {:else}
    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
      <h3 class="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">Access Denied</h3>
      <p class="text-yellow-700 dark:text-yellow-300">You do not have permission to access the admin dashboard.</p>
    </div>
  {/if}
</div>
