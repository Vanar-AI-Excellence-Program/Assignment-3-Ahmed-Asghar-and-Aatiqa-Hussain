<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	let email = $state('');
	let error = $state('');
	let success = $state('');
	let isLoading = $state(false);
	
	// Redirect if already logged in
	$effect(() => {
		if ($page.data.user) {
			goto('/');
		}
	});
	
	// Handle form submission
	function handleSubmit() {
		if (isLoading) {
			console.log('Form submission already in progress, ignoring');
			return;
		}
		
		if (!email) {
			error = 'Please enter your email address';
			return;
		}
		
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			error = 'Please enter a valid email address';
			return;
		}
		
		console.log('Forgot password form submitted with email:', email);
		isLoading = true;
		
		return async ({ result, update }: { result: any; update: any }) => {
			console.log('Forgot password form result:', result);
			
			if (result.type === 'failure') {
				error = result.data?.error || 'Failed to send reset code';
				console.log('Form submission failed:', result.data);
				isLoading = false;
			} else if (result.type === 'success') {
				console.log('Form submission successful, redirecting to verification page');
				success = 'Password reset code sent! Redirecting to verification...';
				
				// Use redirectUrl from server response if available, otherwise construct it
				const redirectUrl = result.data?.redirectUrl || `/reset-password-code?email=${encodeURIComponent(email)}`;
				
				setTimeout(() => {
					console.log('Redirecting to:', redirectUrl);
					goto(redirectUrl);
				}, 2000);
			} else {
				console.log('Unexpected result type:', result.type);
				isLoading = false;
			}
			await update();
		};
	}
</script>

<svelte:head>
	<title>Forgot Password - ShieldAuth</title>
	<meta name="description" content="Reset your password" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
			<!-- Background texture overlay -->
			<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
			<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
			<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
			<div class="relative z-10">
				<div class="text-center mb-8">
					<div class="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
						<svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
						</svg>
					</div>
					<h1 class="text-3xl font-bold text-white mb-2">
						Forgot Password
					</h1>
					<p class="text-gray-300">
						Enter your email address and we'll send you a 6-digit code to reset your password.
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
					<div>
						<label for="email" class="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							placeholder="Enter your email address"
							required
							disabled={isLoading}
							class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						class="w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						{isLoading ? 'Sending Code...' : 'Send Reset Code'}
					</button>
				</form>

				<div class="mt-6 text-center">
					<p class="text-sm text-gray-400">
						Remember your password?
						<a href="/login" class="text-blue-400 hover:text-blue-300 hover:underline ml-1 transition-colors">
							Sign in
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
