<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect if not admin
	$: if (!$page.data.user || $page.data.user.role !== 'admin') {
		goto('/');
	}

	let stats = $page.data.stats;
	let recentUsers = $page.data.recentUsers;

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

	// Delete user account
	async function deleteUser(userId: string, userName: string) {
		const confirmed = confirm(`Are you sure you want to permanently delete the account for "${userName}"? This action cannot be undone and will remove all user data including sessions, OAuth accounts, and verification tokens.`);
		
		if (!confirmed) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/users/${userId}/delete`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				// Refresh the page to show updated data
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
</script>

<svelte:head>
	<title>Admin Dashboard - AuthApp</title>
	<meta name="description" content="Administrative dashboard for user management" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Spacer for transparent navbar -->
	<div class="h-10"></div>
	<div class="h-10"></div>
	<!-- Header -->
	<div class="mb-8">
		<div class="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-white">Admin Dashboard</h1>
					<p class="text-slate-400 mt-1">Manage users and monitor system activity</p>
				</div>
				<div class="flex items-center space-x-4">
					<a
						href="/dashboard"
						class="px-4 py-2 border border-slate-600 rounded-lg text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
					>
						← Back to Dashboard
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Statistics Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		<!-- Total Users -->
		<div class="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-blue-900/30 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
						</svg>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-400">Total Users</p>
					<p class="text-2xl font-semibold text-white">{stats.totalUsers}</p>
				</div>
			</div>
		</div>

		<!-- Admin Users -->
		<div class="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-400">Admin Users</p>
					<p class="text-2xl font-semibold text-white">{stats.adminUsers}</p>
				</div>
			</div>
		</div>

		<!-- Recent Registrations -->
		<div class="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-orange-900/30 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-400">New (30 days)</p>
					<p class="text-2xl font-semibold text-white">{stats.recentRegistrations}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Users Table -->
	<div class="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-white">Recent Users</h2>
			<a
				href="/admin/users"
				class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
			>
				View All Users
			</a>
		</div>

		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-slate-700">
				<thead>
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700">
					{#each recentUsers as user}
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
										<div class="text-sm text-slate-400">{user.email}</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {user.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-600 text-slate-300'}">
									{user.role}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
								{formatDate(user.createdAt)}
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
	</div>
</div>
</div>
