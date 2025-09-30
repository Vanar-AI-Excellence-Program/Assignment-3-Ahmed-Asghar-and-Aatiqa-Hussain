<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Redirect if not admin
	$: if (!$page.data.user || $page.data.user.role !== 'admin') {
		goto('/');
	}

	let users = $page.data.users;
	let userCounts = $page.data.userCounts;
	let filters = $page.data.filters;

	// Search and filter state
	let searchTerm = filters.search;
	let selectedRole = filters.role;

	// Format date for display
	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// ✅ Search input (just update state, no auto refresh)
	function handleSearchInput(e: Event) {
		searchTerm = (e.target as HTMLInputElement).value;
	}

	// ✅ Enter key → apply immediately
	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			applyFilters();
		}
	}

	// ✅ Apply filters with page refresh
	function applyFilters() {
		const params = new URLSearchParams();
		if (searchTerm) params.set('search', searchTerm);
		if (selectedRole) params.set('role', selectedRole);

		const queryString = params.toString();
		window.location.href = `/admin/users${queryString ? `?${queryString}` : ''}`;
	}

	// ✅ Clear filters with page refresh
	function clearFilters() {
		searchTerm = '';
		selectedRole = '';
		window.location.href = '/admin/users';
	}

	// Delete user account
	async function deleteUser(userId: string, userName: string) {
		const confirmed = confirm(`Are you sure you want to permanently delete the account for "${userName}"? This action cannot be undone and will remove all user data including sessions, OAuth accounts, and verification tokens.`);
		if (!confirmed) return;

		try {
			const response = await fetch(`/api/admin/users/${userId}/delete`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});

			if (response.ok) {
				window.location.reload();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to delete user');
			}
		} catch (error) {
			console.error('Error deleting user:', error);
			alert('Error deleting user');
		}
	}

	// Change user role
	async function changeUserRole(userId: string, newRole: string) {
		try {
			const response = await fetch(`/api/admin/users/${userId}/change-role`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: newRole }),
			});

			if (response.ok) {
				window.location.reload();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to update user role');
			}
		} catch (error) {
			console.error('Error updating user role:', error);
			alert('Error updating user role');
		}
	}
</script>

<svelte:head>
	<title>User Management - Admin Dashboard</title>
	<meta name="description" content="Manage all users in the system" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Spacer -->
	<div class="h-10"></div>
	<div class="h-10"></div>
	
	<!-- Header -->
    <div class="mb-8">
        <div class="relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 rounded-2xl shadow-2xl border border-gray-700/50 p-8 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-white">User Management</h1>
                    <p class="text-gray-400 mt-1">Manage all registered users in the system</p>
				</div>
				<div class="flex items-center space-x-4">
					<a
						href="/admin"
						on:click={() => { if ($page.url.pathname === '/admin') { window.location.reload(); } }}
                        class="group relative px-4 py-2 border border-gray-600 rounded-xl text-sm font-semibold text-gray-300 bg-gray-800/50 hover:bg-gray-700 hover:border-gray-400 hover:text-white transition-all duration-200 transform hover:scale-105"
					>
						<svg class="w-4 h-4 inline-block mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Back to Admin Dashboard
					</a>
				</div>
			</div>
        </div>
	</div>

	<!-- User Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		{#each userCounts as count}
            <div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 rounded-2xl shadow-xl border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5"></div>
				<div class="flex items-center">
					<div class="flex-shrink-0">
                        <div class="w-12 h-12 {count.role === 'admin' ? 'bg-purple-500/20' : 'bg-blue-500/20'} rounded-xl flex items-center justify-center border {count.role === 'admin' ? 'border-purple-500/30' : 'border-blue-500/30'}">
                            <svg class="w-6 h-6 {count.role === 'admin' ? 'text-purple-400' : 'text-blue-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
							</svg>
						</div>
					</div>
					<div class="ml-4">
                        <p class="text-sm font-medium text-gray-400">{count.role === 'admin' ? 'Admin' : 'Regular'} Users</p>
						<p class="text-2xl font-semibold text-white">{count.count}</p>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Filters -->
    <div class="bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-8">
		<h2 class="text-lg font-semibold text-white mb-4">Filters</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Search -->
			<div>
                <label for="search" class="block text-sm font-semibold text-gray-300 mb-2">Search</label>
				<input
					id="search"
					type="text"
					bind:value={searchTerm}
					on:input={handleSearchInput}
					on:keydown={handleSearchKeydown}
					placeholder="Search by name or email..."
                    class="w-full px-3 py-2 border border-gray-600 rounded-xl shadow-sm placeholder-gray-400 bg-gray-800/50 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
					autocomplete="off"
				/>
			</div>

			<!-- Role Filter -->
			<div>
                <label for="role" class="block text-sm font-semibold text-gray-300 mb-2">Role</label>
				<select
					id="role"
					bind:value={selectedRole}
					class="w-full px-3 py-2 border border-gray-600 rounded-xl shadow-sm bg-gray-800/50 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
				>
					<option value="">All Roles</option>
					<option value="user">User</option>
					<option value="admin">Admin</option>
				</select>
			</div>

			<!-- Filter Actions -->
            <div class="flex items-end space-x-2">
				<button
					on:click={applyFilters}
                    class="group px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25"
				>
					<svg class="w-4 h-4 inline-block mr-2 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					Apply Filters
				</button>
				<button
					on:click={clearFilters}
                    class="group px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 hover:text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
				>
					<svg class="w-4 h-4 inline-block mr-2 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					Clear
				</button>
			</div>
		</div>
	</div>

	<!-- Users Table -->
    <div class="bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 rounded-2xl shadow-xl border border-gray-700/50 p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-white">All Users ({users.length})</h2>
		</div>

		<div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-700">
				<thead>
					<tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Updated</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
					</tr>
				</thead>
                <tbody class="divide-y divide-gray-700">
					{#each users as user}
						<tr class="hover:bg-slate-700/50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div class="flex-shrink-0 h-8 w-8">
										<div class="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
											{user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
										</div>
									</div>
									<div class="ml-4">
										<div class="text-sm font-medium text-white">
											{user.name || 'No name'}
										</div>
                                <div class="text-sm text-gray-400">{user.email}</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<select
									value={user.role}
									on:change={(e) => changeUserRole(user.id, (e.target as HTMLSelectElement)?.value || 'user')}
                                    class="text-xs font-semibold rounded-full px-2 py-1 border-0 {user.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-gray-700 text-gray-300'}"
									disabled={user.id === $page.data.user.id}
								>
									<option value="user">User</option>
									<option value="admin">Admin</option>
								</select>
							</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
								{formatDate(user.createdAt)}
							</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
								{formatDate(user.updatedAt)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button
									on:click={() => deleteUser(user.id, user.name || user.email)}
									class="text-red-400 hover:text-red-300 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed"
									disabled={user.id === $page.data.user.id}
									title={user.id === $page.data.user.id ? "Cannot delete your own account" : "Delete user account"}
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if users.length === 0}
			<div class="text-center py-8">
				<p class="text-slate-400">
					{searchTerm || selectedRole ? 'No users found matching your criteria.' : 'No users found.'}
				</p>
			</div>
		{/if}
	</div>
</div>
</div>
