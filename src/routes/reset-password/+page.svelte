<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
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
			goto('/forgot-password');
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
				error = result.data?.error || 'Failed to reset password';
			} else if (result.type === 'success') {
				success = 'Password reset successfully! Redirecting to login...';
				setTimeout(() => {
					goto('/login');
				}, 2000);
			}
			await update();
		};
	}
</script>

<svelte:head>
	<title>Reset Password - ShieldAuth</title>
	<meta name="description" content="Reset your password" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 overflow-hidden">
			<!-- Background texture overlay -->
			<div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-indigo-500/5"></div>
			<div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>
			<div class="relative z-10">
				<div class="text-center mb-8">
					<div class="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
						<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
						</svg>
					</div>
					<h1 class="text-3xl font-bold text-white mb-2">
						Reset Password
					</h1>
					<p class="text-gray-300">
						Enter your new password for <strong class="text-emerald-400">{email}</strong>
					</p>
				</div>

				{#if error}
					<div class="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm text-blue-300">{error}</p>
							</div>
						</div>
					</div>
				{/if}

				{#if success}
					<div class="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm text-emerald-300">{success}</p>
							</div>
						</div>
					</div>
				{/if}

				<form method="POST" use:enhance={handleSubmit} class="space-y-6">
					<input type="hidden" name="email" value={email} />
					<input type="hidden" name="code" value={code} />
					<input type="hidden" name="password" value={password} />
					<input type="hidden" name="confirmPassword" value={confirmPassword} />
					
					<div>
						<label for="password" class="block text-sm font-semibold text-gray-300 mb-2">
							New Password
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							placeholder="Enter your new password"
							required
							disabled={isLoading}
							class="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
						/>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-semibold text-gray-300 mb-2">
							Confirm New Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							placeholder="Confirm your new password"
							required
							disabled={isLoading}
							class="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading || !!error}
						class="w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
						</svg>
						{isLoading ? 'Resetting Password...' : 'Reset Password'}
					</button>
				</form>

				<div class="mt-6 text-center">
					<p class="text-sm text-gray-400">
						Remember your password?
						<a href="/login" class="text-blue-400 hover:text-blue-300 hover:underline ml-1">
							Sign in
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
