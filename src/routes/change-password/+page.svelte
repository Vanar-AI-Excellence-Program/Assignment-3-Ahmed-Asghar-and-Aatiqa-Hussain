<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/Input.svelte';
	
	let email = $state('');
	let error = $state('');
	let success = $state('');
	let isLoading = $state(false);
	
	// Get current user's email
	$effect(() => {
		if ($page.data.user?.email) {
			email = $page.data.user.email;
		}
	});
	
	// Redirect if not logged in
	$effect(() => {
		if (!$page.data.user) {
			goto('/login');
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
		
		console.log('Change password form submitted with email:', email);
		isLoading = true;
		
		return async ({ result, update }: { result: any; update: any }) => {
			console.log('Change password form result:', result);
			
			if (result.type === 'failure') {
				error = result.data?.error || 'Failed to send verification code';
				console.log('Form submission failed:', result.data);
				isLoading = false;
			} else if (result.type === 'success') {
				console.log('Form submission successful, redirecting to verification page');
				success = 'Verification code sent! Redirecting to verification...';
				
				// Use redirectUrl from server response if available, otherwise construct it
				const redirectUrl = result.data?.redirectUrl || `/change-password-code?email=${encodeURIComponent(email)}`;
				
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
	<title>Change Password - ShieldAuth</title>
	<meta name="description" content="Change your password" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 overflow-hidden">
			<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
			<div class="relative z-10">
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-white mb-2">
					Change Password
				</h1>
				<p class="text-gray-300">
					We'll send a 6-digit verification code to your email address to confirm the password change.
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
					<Input
						type="email"
						label="Email Address"
						bind:value={email}
						placeholder="Enter your email address"
						required
						disabled={isLoading}
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
				>
					{isLoading ? 'Sending Code...' : 'Send Verification Code'}
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
