<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let codeArray = Array(6).fill('');
	let error = '';
	let success = '';
	let isLoading = false;
	let resendCooldown = 0;
	let userId = '';
	let userEmail = '';

	// Get user data from URL params
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		userId = urlParams.get('userId') || '';
		userEmail = urlParams.get('email') || '';
		if (!userId || !userEmail) {
			goto('/register');
		}
	});

	// Auto-focus first input
	onMount(() => {
		const firstInput = document.getElementById('code-0') as HTMLInputElement;
		if (firstInput) firstInput.focus();
	});

	// Handle input
	function handleCodeInput(index: number, value: string) {
		if (value.length > 1) value = value.slice(-1);
		codeArray[index] = value;
		error = '';
		success = '';

		if (value && index < 5) {
			const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
			if (nextInput) nextInput.focus();
		}
	}

	// Backspace navigation
	function handleKeyDown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace' && !codeArray[index] && index > 0) {
			const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
			if (prevInput) prevInput.focus();
		}
	}

	// Handle paste
	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text') || '';
		const clean = pasted.replace(/\D/g, '').slice(0, 6);
		if (clean.length === 6) {
			codeArray = clean.split('');
			const lastInput = document.getElementById('code-5') as HTMLInputElement;
			if (lastInput) lastInput.focus();
		}
	}

	// Resend code
	async function resendCode() {
		if (resendCooldown > 0) return;
		isLoading = true;
		error = '';
		try {
			const response = await fetch('/api/auth/resend-verification-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, email: userEmail }),
			});
			const result = await response.json();
			if (response.ok) {
				success = 'New verification code sent to your email!';
				setTimeout(() => (success = ''), 3000);
				resendCooldown = 60;
				const timer = setInterval(() => {
					resendCooldown--;
					if (resendCooldown <= 0) clearInterval(timer);
				}, 1000);
			} else {
				error = result.error || 'Failed to resend code';
				setTimeout(() => (error = ''), 5000);
			}
		} catch {
			error = 'Network error. Please try again.';
			setTimeout(() => (error = ''), 5000);
		} finally {
			isLoading = false;
		}
	}

	// Handle form submission
	function handleSubmit() {
		const code = codeArray.join('');
		if (code.length !== 6) {
			error = 'Please enter a 6-digit code';
			return () => {}; // no-op
		}
		isLoading = true;
		error = '';
		success = '';

		return async ({ result, update }: { result: any; update: any }) => {
			if (result.type === 'failure') {
				error = result.data?.error || 'Verification failed';
				codeArray = Array(6).fill('');
				setTimeout(() => {
					const firstInput = document.getElementById('code-0') as HTMLInputElement;
					if (firstInput) firstInput.focus();
				}, 100);
			} else if (result.type === 'success') {
				success = 'Email verified successfully! Redirecting to login...';
				setTimeout(() => goto('/login'), 2000);
			}
			isLoading = false;
			await update();
		};
	}
</script>

<svelte:head>
	<title>Verify Email - ShieldAuth</title>
	<meta name="description" content="Verify your email address" />
</svelte:head>

<div class="min-h-screen flex">
	<!-- Left Panel -->
	<div class="hidden lg:flex lg:w-[65%] bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
		<div class="relative z-10 flex flex-col justify-center items-center px-12 text-white w-full">
			<h1 class="text-5xl font-bold mb-4">ShieldAuth</h1>
			<h2 class="text-4xl font-semibold mb-6">Verify Your Email</h2>
			<p class="text-blue-200">Enter the 6-digit verification code sent to your email.</p>
		</div>
	</div>

	<!-- Right Panel -->
	<div class="flex-1 lg:w-[35%] flex flex-col justify-center px-8 bg-gradient-to-b from-black via-gray-900 to-black">
		<div class="mx-auto w-full max-w-lg">
			<div class="relative bg-gray-900 rounded-2xl shadow-xl border border-gray-700 p-8 m-8">

				<!-- Error -->
				{#if error}
					<div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300">{error}</div>
				{/if}

				<!-- Success -->
				{#if success}
					<div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 text-green-300">{success}</div>
				{/if}

				<!-- Code Alert -->
				<div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 text-blue-300">
					<div class="flex items-center gap-3">
						<svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span class="text-sm font-medium">Don't Receive Code Yet! Check Spam Section As well</span>
					</div>
				</div>

				<form method="POST" use:enhance={handleSubmit} class="space-y-6">
					<input type="hidden" name="userId" value={userId} />
					<input type="hidden" name="email" value={userEmail} />
					<input type="hidden" name="code" value={codeArray.join('')} />

					<!-- Code Input -->
					<div class="flex justify-center space-x-3">
						{#each Array(6) as _, i}
							<input
								id="code-{i}"
								type="text"
								maxlength="1"
								bind:value={codeArray[i]}
								on:input={(e) => handleCodeInput(i, (e.target as HTMLInputElement).value)}
								on:keydown={(e) => handleKeyDown(i, e)}
								on:paste={handlePaste}
								disabled={isLoading}
								class="w-12 h-12 text-center text-lg font-semibold border border-gray-600 rounded-xl bg-gray-800/50 text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
							/>
						{/each}
					</div>

					<!-- Verify Button -->
					<button
						type="submit"
						disabled={codeArray.join('').length !== 6 || isLoading}
						class="w-full py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50"
					>
						{#if isLoading}
							Verifying...
						{:else}
							Verify Email
						{/if}
					</button>

					<!-- Resend + Back -->
					<div class="text-center mt-4 space-y-2">
						<button
							type="button"
							on:click={resendCode}
							disabled={isLoading || resendCooldown > 0}
							class="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:text-gray-500"
						>
							{#if isLoading}
								Sending...
							{:else if resendCooldown > 0}
								Resend in {resendCooldown}s
							{:else}
								Resend Code
							{/if}
						</button>
						<br />
						<a href="/register" data-sveltekit-reload class="text-sm text-blue-400 hover:text-blue-300">
							← Back to Registration
						</a>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
