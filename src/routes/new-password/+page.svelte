<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/Input.svelte';
	
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state('');
	let isLoading = $state(false);
	
	// Get email and code from URL params
	const email = $page.url.searchParams.get('email') || '';
	const code = $page.url.searchParams.get('code') || '';
	
	// Redirect if no email or code
	$effect(() => {
		if (!email || !code) {
			goto('/change-password');
		}
	});
	
	// Client-side password validation
	$effect(() => {
		if (password && confirmPassword && password !== confirmPassword) {
			error = 'Passwords do not match';
		} else if (password && password.length < 8) {
			error = 'Password must be at least 8 characters long';
		} else {
			error = '';
		}
	});
	
	// Handle form submission
	function handleSubmit() {
		if (!password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}
		
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		
		if (password.length < 8) {
			error = 'Password must be at least 8 characters long';
			return;
		}
		
		return async ({ result, update }: { result: any; update: any }) => {
			if (result.type === 'failure') {
				error = result.data?.error || 'Failed to change password';
			} else if (result.type === 'success') {
				success = 'Password changed successfully! All sessions have been invalidated. Redirecting to login...';
				setTimeout(() => {
					goto('/login');
				}, 3000);
			}
			await update();
		};
	}
</script>

<svelte:head>
	<title>New Password - ShieldAuth</title>
	<meta name="description" content="Set your new password" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
			<!-- Background texture overlay -->
			<div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-indigo-500/5 to-blue-500/5"></div>
			<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>
			<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-2xl"></div>
			<div class="relative z-10">
				<div class="text-center mb-8">
					<h1 class="text-3xl font-bold text-white mb-2">
						New Password
					</h1>
					<p class="text-gray-300">
						Enter your new password for <strong class="text-emerald-400">{email}</strong>
					</p>
				</div>

				{#if error}
					<div class="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
						<p class="text-blue-300 text-sm">{error}</p>
					</div>
				{/if}

				{#if success}
					<div class="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
						<p class="text-emerald-300 text-sm">{success}</p>
					</div>
				{/if}

				<form method="POST" use:enhance={handleSubmit} class="space-y-6">
					<input type="hidden" name="email" value={email} />
					<input type="hidden" name="code" value={code} />
					<input type="hidden" name="password" value={password} />
					<input type="hidden" name="confirmPassword" value={confirmPassword} />
					
					<div>
						<label for="password" class="block text-sm font-semibold text-gray-300 mb-2">New Password</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							placeholder="Enter your new password"
							required
							disabled={isLoading}
							class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50"
						/>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-semibold text-gray-300 mb-2">Confirm New Password</label>
						<input
							type="password"
							id="confirmPassword"
							bind:value={confirmPassword}
							placeholder="Confirm your new password"
							required
							disabled={isLoading}
							class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading || !!error}
						class="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
					>
						{isLoading ? 'Changing Password...' : 'Change Password'}
					</button>
				</form>

				<div class="mt-6 text-center">
					<p class="text-sm text-gray-400">
						<a href="/" class="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
							← Back to Home
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
