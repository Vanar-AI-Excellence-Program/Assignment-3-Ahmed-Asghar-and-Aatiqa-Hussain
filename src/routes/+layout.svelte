<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { signOut } from '@auth/sveltekit/client';
	import { invalidateAll } from '$app/navigation';
	import NotificationContainer from '$lib/components/NotificationContainer.svelte';
	
	// User dropdown state
	let showUserDropdown = false;
	let userButtonEl: HTMLButtonElement | null = null;
	let dropdownWidth = 0;
	function updateDropdownWidth() {
		if (userButtonEl) {
			dropdownWidth = userButtonEl.offsetWidth;
		}
	}
	
	// Toggle user dropdown
	function toggleUserDropdown() {
		showUserDropdown = !showUserDropdown;
		updateDropdownWidth();
	}
	
	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-dropdown')) {
			showUserDropdown = false;
		}
	}
	
	// Handle logout using Auth.js
	async function handleLogout() {
		try {
			// Close dropdown first
			showUserDropdown = false;
			
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
		// Always apply dark mode
		if (typeof document !== 'undefined') {
			document.documentElement.classList.add('dark');
		}
		
		// Add click outside listener
		document.addEventListener('click', handleClickOutside);
		window.addEventListener('resize', updateDropdownWidth);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
			window.removeEventListener('resize', updateDropdownWidth);
		};
	});
</script>

<svelte:head>
	<title>ShieldAuth - Secure Authentication</title>
	<meta name="description" content="A secure authentication application built with SvelteKit" />
</svelte:head>

<div class="min-h-screen bg-black">
	<!-- Navigation - Hidden on auth pages -->
	{#if !$page.url.pathname.startsWith('/auth') && $page.url.pathname !== '/login' && $page.url.pathname !== '/register' && !$page.url.pathname.startsWith('/checks') && $page.url.pathname !== '/forgot-password' && $page.url.pathname !== '/reset-password' && $page.url.pathname !== '/reset-password-code' && $page.url.pathname !== '/verify-code' && $page.url.pathname !== '/new-password' && $page.url.pathname !== '/change-password' && $page.url.pathname !== '/change-password-code' && $page.url.pathname !== '/chatbot'}
	<nav class="absolute inset-x-0 top-0 z-30 bg-transparent border-transparent">
		<div class="w-full px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16 w-full">
				<!-- Left side - Logo -->
				<div class="flex items-center">
					<a href="/" class="font-bold transition-all duration-200 relative group {($page.url.pathname === '/') ? 'text-white text-3xl md:text-4xl hover:text-blue-400' : 'text-white hover:text-blue-400 text-2xl'}">
						ShieldAuth
						<span class="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-200 group-hover:w-full {($page.url.pathname === '/') ? 'bg-blue-400' : 'bg-blue-400'}"></span>
					</a>
				</div>
				
				<!-- Right side - Navigation Links or User menu -->
				<div class="flex items-center space-x-8">
					<!-- Navigation Links for all users -->
					<div class="hidden md:flex items-center space-x-8">
						<a href="/about" class="transition-all duration-200 {($page.url.pathname === '/') ? 'text-white text-lg md:text-xl font-semibold hover:text-sky-400 hover:underline underline-offset-4 decoration-sky-400' : ($page.url.pathname === '/about') ? 'text-blue-400 text-lg font-semibold' : 'text-slate-300 hover:text-sky-400 hover:underline underline-offset-4 decoration-sky-400 text-lg font-semibold'}">
							About
						</a>
						<a href="/contact" class="transition-all duration-200 {($page.url.pathname === '/') ? 'text-white text-lg md:text-xl font-semibold hover:text-sky-400 hover:underline underline-offset-4 decoration-sky-400' : ($page.url.pathname === '/contact') ? 'text-blue-400 text-lg font-semibold' : 'text-slate-300 hover:text-sky-400 hover:underline underline-offset-4 decoration-sky-400 text-lg font-semibold'}">
							Contact
						</a>
					</div>
					
					{#if !$page.data.user}
						<!-- Authentication Links for non-authenticated users -->
						<div class="hidden md:flex items-center space-x-8">
							<a href="/login" class="transition-all duration-200 {($page.url.pathname === '/') ? 'text-white text-lg md:text-xl font-semibold hover:text-sky-400 hover:underline underline-offset-4 decoration-sky-400' : 'text-slate-300 hover:text-sky-400 hover:underline underline-offset-4 decoration-sky-400 text-lg font-semibold'}">
								Login
							</a>
							<a href="/register" class="transition-all duration-200 {($page.url.pathname === '/') ? 'text-white text-lg md:text-xl font-semibold hover:text-sky-400 hover:underline underline-offset-4 decoration-sky-400' : 'text-slate-300 hover:text-sky-400 hover:underline underline-offset-4 decoration-sky-400 text-lg font-semibold'}">
								Register
							</a>
						</div>
					{:else}
						<!-- User menu for authenticated users -->
						<div class="relative user-dropdown">
						<button bind:this={userButtonEl}
								on:click={toggleUserDropdown}
							class="flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors bg-transparent text-white hover:bg-transparent {($page.url.pathname === '/') ? 'border border-white/30 hover:border-white/40' : 'border border-gray-700 hover:border-gray-500'}"
							class:rounded-b-none={showUserDropdown}
								aria-label="User menu"
							>
								{#if $page.data.user.image}
									<img 
										src={$page.data.user.image} 
										alt="Profile" 
										class="w-6 h-6 rounded-full object-cover"
										on:error={(e) => {
											e.target.style.display = 'none';
											e.target.nextElementSibling.style.display = 'flex';
										}}
									/>
									<div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium {($page.url.pathname === '/') ? 'bg-white/30' : 'bg-blue-500'}" style="display: none;">
										{$page.data.user.email?.charAt(0).toUpperCase()}
									</div>
								{:else}
								<div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium {($page.url.pathname === '/') ? 'bg-white/30' : 'bg-blue-500'}">
										{$page.data.user.email?.charAt(0).toUpperCase()}
									</div>
								{/if}
							<span class="hidden sm:block hover:text-sky-400 transition-colors duration-200">{$page.data.user.email}</span>
								<svg class="w-4 h-4 transition-transform duration-200" class:rotate-180={showUserDropdown} fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							
						<!-- Dropdown menu -->
						{#if showUserDropdown}
							<div class="absolute left-0 mt-0 z-50 overflow-hidden rounded-xl rounded-t-none shadow-2xl {($page.url.pathname === '/') ? 'border border-white/30' : 'border border-gray-700'} bg-black/20 backdrop-blur-sm" style="margin-top:-1px; width: {dropdownWidth}px;">
									<a
										href="/dashboard"
										on:click={() => { if ($page.url.pathname === '/dashboard') { window.location.reload(); } }}
								class="flex items-center px-6 py-3 text-sm transition-all duration-200 relative group {($page.url.pathname === '/dashboard') ? 'text-gray-500 cursor-default opacity-50' : 'text-gray-300 hover:bg-white/5 hover:text-blue-400'}"
									>
										<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
										</svg>
										Dashboard
										{#if $page.url.pathname !== '/dashboard'}
											<span class="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
										{/if}
									</a>
									<a
										href="/profile"
										on:click={() => { if ($page.url.pathname === '/profile') { window.location.reload(); } }}
								class="flex items-center px-6 py-3 text-sm transition-all duration-200 relative group {($page.url.pathname === '/profile') ? 'text-gray-500 cursor-default opacity-50' : 'text-gray-300 hover:bg-white/5 hover:text-blue-400'}"
									>
										<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
										Profile
										{#if $page.url.pathname !== '/profile'}
											<span class="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
										{/if}
									</a>
									{#if $page.data.user.role === 'admin'}
										<a
											href="/admin"
											on:click={() => { if ($page.url.pathname === '/admin') { window.location.reload(); } }}
								class="flex items-center px-6 py-3 text-sm transition-all duration-200 relative group {($page.url.pathname.startsWith('/admin')) ? 'text-gray-500 cursor-default opacity-50' : 'text-gray-300 hover:bg-white/5 hover:text-blue-400'}"
										>
											<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
											</svg>
											Admin Dashboard
											{#if !$page.url.pathname.startsWith('/admin')}
												<span class="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
											{/if}
										</a>
									{/if}
							<div class="border-t {($page.url.pathname === '/') ? 'border-white/20' : 'border-gray-700/50'} my-2"></div>
									<button
										on:click={handleLogout}
										class="flex items-center w-full px-6 py-3 text-sm font-bold text-red-400 hover:bg-red-900/20 hover:text-white transition-all duration-200 relative group"
									>
										<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
										</svg>
										Sign Out
										<span class="absolute bottom-0 left-0 w-0 h-0.5 bg-red-400 transition-all duration-200 group-hover:w-full"></span>
									</button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</nav>
	{/if}
	
	<!-- Main content -->
	<main class="flex-1">
		<slot />
	</main>
	
	<!-- Notification Container -->
	<NotificationContainer />
	
</div>
