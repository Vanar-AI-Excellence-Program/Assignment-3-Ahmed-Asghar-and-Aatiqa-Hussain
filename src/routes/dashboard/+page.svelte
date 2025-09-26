<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { signOut } from '@auth/sveltekit/client';
	import { invalidateAll } from '$app/navigation';
	
	// Redirect if not authenticated
	$: if (!$page.data.user) {
		goto('/login');
	}
	
	let stats = {
		lastLogin: new Date().toLocaleDateString(),
		accountAge: '0 days',
		loginCount: 1
	};
	
	// Handle logout using Auth.js
	async function handleLogout() {
		try {
			// Use Auth.js signOut function
			await signOut({ redirectTo: '/' });
			
			// Invalidate all page data to refresh user state
			await invalidateAll();
		} catch (error) {
			console.error('Logout error:', error);
			// Fallback: force page reload if Auth.js logout fails
			window.location.href = '/';
		}
	}
	
	onMount(() => {
		// Calculate account age
		if ($page.data.user?.createdAt) {
			const created = new Date($page.data.user.createdAt);
			const now = new Date();
			const diffTime = Math.abs(now.getTime() - created.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			stats.accountAge = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
		}
	});
</script>

<svelte:head>
	<title>Dashboard - AuthApp</title>
	<meta name="description" content="Your personal dashboard" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Spacer for transparent navbar -->
		<div class="h-10"></div>
		<div class="h-10"></div>
		<!-- Welcome Header -->
		<div class="mb-8">
			<div class="relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10 flex items-center space-x-6">
					{#if $page.data.user?.image}
						<img src={$page.data.user.image} alt="Profile" class="w-20 h-20 rounded-full border-2 border-gray-600/50 shadow-lg" />
					{:else}
						<div class="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-2 border-gray-600/50">
							{$page.data.user?.email?.charAt(0).toUpperCase()}
						</div>
					{/if}
					<div>
						<h1 class="text-4xl font-bold text-white mb-2">
							Welcome back, <span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{$page.data.user?.name || $page.data.user?.email}</span>!
						</h1>
						<p class="text-gray-300 text-lg">
							Member since {$page.data.user?.createdAt ? new Date($page.data.user.createdAt).toLocaleDateString() : 'recently'}
						</p>
					</div>
				</div>
			</div>
		</div>
	
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5"></div>
				<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10 flex items-center">
					<div class="flex-shrink-0">
						<div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
							<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-400">Account Age</p>
						<p class="text-2xl font-bold text-white">{stats.accountAge}</p>
					</div>
				</div>
			</div>
		
			<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5"></div>
				<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10 flex items-center">
					<div class="flex-shrink-0">
						<div class="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-xl flex items-center justify-center border border-purple-500/30">
							<svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-400">Last Login</p>
						<p class="text-2xl font-bold text-white">{stats.lastLogin}</p>
					</div>
				</div>
			</div>
		
			<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-green-500/5"></div>
				<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10 flex items-center">
					<div class="flex-shrink-0">
						<div class="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
							<svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-400">Login Count</p>
						<p class="text-2xl font-bold text-white">{stats.loginCount}</p>
					</div>
				</div>
			</div>
	</div>
	
		<!-- Quick Actions -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-blue-500/5"></div>
				<div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10">
					<h3 class="text-xl font-bold text-white mb-6">Quick Actions</h3>
					<div class="space-y-4">
						<a
							href="/profile"
							class="group flex items-center p-4 rounded-xl border border-gray-600/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200"
						>
							<div class="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-lg flex items-center justify-center border border-blue-500/30 mr-4">
								<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							</div>
							<span class="text-gray-300 group-hover:text-white font-medium">Edit Profile</span>
						</a>
				
						<!-- Only show Change Password for users with passwords (not OAuth users) -->
						{#if $page.data.user?.password}
							<a
								href="/change-password"
								class="group flex items-center p-4 rounded-xl border border-gray-600/50 hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all duration-200"
							>
							<div class="w-10 h-10 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-lg flex items-center justify-center border border-indigo-500/50 mr-4">
								<svg class="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							</div>
								<span class="text-gray-300 group-hover:text-white font-medium">Change Password</span>
							</a>
						{/if}
						
						<button
							onclick={handleLogout}
							class="group flex items-center w-full p-4 rounded-xl border border-gray-600/50 hover:border-red-500/50 hover:bg-gray-800/50 transition-all duration-200 text-left"
						>
							<div class="w-10 h-10 bg-gradient-to-br from-red-500/20 to-pink-600/20 rounded-lg flex items-center justify-center border border-red-500/30 mr-4">
								<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
							</div>
							<span class="text-gray-300 group-hover:text-white font-medium">Sign Out</span>
						</button>
					</div>
				</div>
			</div>
		
			<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-green-500/5"></div>
				<div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10">
					<h3 class="text-xl font-bold text-white mb-6">Account Security</h3>
					<div class="space-y-5">
						<div class="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
							<span class="text-gray-300 font-medium">Two-Factor Authentication</span>
							<span class="text-sky-400 text-sm font-semibold bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/30">Not enabled</span>
						</div>
						<div class="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
							<span class="text-gray-300 font-medium">Email Verification</span>
							<span class="text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">Verified</span>
						</div>
						<div class="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
							<span class="text-gray-300 font-medium">Last Password Change</span>
							<span class="text-gray-400 text-sm font-semibold">Never</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
