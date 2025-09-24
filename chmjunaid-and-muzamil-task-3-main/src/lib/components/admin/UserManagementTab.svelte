<script lang="ts">
  export let users: any[] = [];
  export let openUserDetails: (userId: string) => void;
  
  let searchTerm = '';
  let selectedRole = 'all';
  let selectedStatus = 'all';
  let sortBy = 'createdAt';
  let sortOrder = 'desc';
  let error = '';
  
  // Filter users based on search and filters
  $: filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'verified' && user.emailVerified) ||
                           (selectedStatus === 'unverified' && !user.emailVerified);
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Handle dates
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      // Handle strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  
  async function updateUserRole(userId: string, newRole: string) {
    try {
      const response = await fetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        // Update the user in the local array
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          users[userIndex].role = newRole;
          users = [...users]; // Trigger reactivity
        }
      } else {
        error = 'Failed to update user role';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Error updating user role';
      setTimeout(() => error = '', 3000);
    }
  }
  
  async function deleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove user from local array
        users = users.filter(u => u.id !== userId);
      } else {
        error = 'Failed to delete user';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Error deleting user';
      setTimeout(() => error = '', 3000);
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function toggleSort(field: string) {
    if (sortBy === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortOrder = 'asc';
    }
  }
</script>

<div class="space-y-6">
  <!-- Page Title -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-white mb-2">User Management</h2>
      <p class="text-gray-400">Manage user accounts, roles, and permissions</p>
    </div>
    <div class="text-sm text-gray-400">
      Showing {filteredUsers.length} of {users.length} users
    </div>
  </div>

  <!-- Users Table -->
  <div class="card overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-700">
      <div class="space-y-4">
        <!-- Header Row -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 class="text-lg font-semibold text-white">User List</h3>
          <div class="text-sm text-gray-400 whitespace-nowrap">
            {filteredUsers.length} of {users.length} users
          </div>
        </div>
        
        <!-- Filters Row -->
        <div class="flex flex-col sm:flex-row gap-2">
          <!-- Search Box -->
          <div class="w-full sm:w-40">
            <label for="search-users" class="block text-xs font-medium text-gray-400 mb-1">Search</label>
            <input
              id="search-users"
              type="text"
              placeholder="Search..."
              bind:value={searchTerm}
              class="input-field w-full text-xs py-1 px-2"
            />
          </div>
          
          <!-- Role Filter -->
          <div class="w-full sm:w-28">
            <label for="role-filter" class="block text-xs font-medium text-gray-400 mb-1">Role</label>
            <select id="role-filter" bind:value={selectedRole} class="input-field w-full text-xs py-1 px-2">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          
          <!-- Status Filter -->
          <div class="w-full sm:w-28">
            <label for="status-filter" class="block text-xs font-medium text-gray-400 mb-1">Status</label>
            <select id="status-filter" bind:value={selectedStatus} class="input-field w-full text-xs py-1 px-2">
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          
          <!-- Sort Filter -->
          <div class="w-full sm:w-28">
            <label for="sort-filter" class="block text-xs font-medium text-gray-400 mb-1">Sort</label>
            <select id="sort-filter" bind:value={sortBy} class="input-field w-full text-xs py-1 px-2">
              <option value="createdAt">Join Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left">
              <button 
                class="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                on:click={() => toggleSort('name')}
              >
                User
                {#if sortBy === 'name'}
                  <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d={sortOrder === 'asc' ? 'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' : 'M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'}></path>
                  </svg>
                {/if}
              </button>
            </th>
            <th class="px-6 py-3 text-left">
              <button 
                class="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                on:click={() => toggleSort('role')}
              >
                Role
                {#if sortBy === 'role'}
                  <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d={sortOrder === 'asc' ? 'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' : 'M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'}></path>
                  </svg>
                {/if}
              </button>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left">
              <button 
                class="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                on:click={() => toggleSort('createdAt')}
              >
                Joined
                {#if sortBy === 'createdAt'}
                  <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d={sortOrder === 'asc' ? 'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' : 'M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'}></path>
                  </svg>
                {/if}
              </button>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-gray-800 divide-y divide-gray-700">
          {#each filteredUsers as user}
            <tr class="hover:bg-gray-750 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <span class="text-sm font-medium text-white">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-white">{user.name || 'No Name'}</div>
                    <div class="text-sm text-gray-400">{user.email}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role || 'user'}
                  on:change={(e) => updateUserRole(user.id, (e.target as HTMLSelectElement).value)}
                  class="px-3 py-1 text-sm border border-gray-600 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-700 text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                  user.emailVerified 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }">
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {formatDate(user.createdAt)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-3">
                  <button
                    on:click={() => openUserDetails(user.id)}
                    class="text-orange-400 hover:text-orange-300 transition-colors"
                    title="View user details"
                  >
                    Details
                  </button>
                  <button
                    on:click={() => deleteUser(user.id, user.name || user.email)}
                    class="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete user"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if filteredUsers.length === 0}
      <div class="px-6 py-12 text-center">
        <svg class="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-400 mb-2">No users found</h3>
        <p class="text-gray-500">Try adjusting your search criteria or filters.</p>
      </div>
    {/if}
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="card p-4 bg-red-500/10 border border-red-500/20">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <p class="text-red-400 text-sm">{error}</p>
      </div>
    </div>
  {/if}
</div>
