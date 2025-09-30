<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	
	let code = $state(['', '', '', '', '', '']);
	let error = $state('');
	let success = $state('');
	let isLoading = $state(false);
	let resendCooldown = $state(0);
	
	// Get email from URL params
	const email = $page.url.searchParams.get('email') || '';
	
	// Redirect if no email
	$effect(() => {
		if (!email) {
			goto('/forgot-password');
		}
	});
	
	// Handle individual code input
	function handleCodeInput(index: number, value: string) {
		if (value.length > 1) {
			// Handle paste
			const pastedCode = value.slice(0, 6).split('');
			pastedCode.forEach((digit, i) => {
				if (i < 6) {
					code[i] = digit;
				}
			});
			return;
		}
		
		code[index] = value;
		
		// Auto-focus next input
		if (value && index < 5) {
			const nextInput = document.getElementById(`code-${index + 1}`);
			nextInput?.focus();
		}
	}
	
	// Handle keyboard navigation
	function handleKeyDown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace' && !code[index] && index > 0) {
			const prevInput = document.getElementById(`code-${index - 1}`);
			prevInput?.focus();
		}
	}
	
	// Handle paste
	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pastedData = event.clipboardData?.getData('text') || '';
		const digits = pastedData.replace(/\D/g, '').slice(0, 6);
		
		digits.split('').forEach((digit, i) => {
			code[i] = digit;
		});
		
		// Focus the last filled input or the first empty one
		const lastFilledIndex = Math.min(digits.length - 1, 5);
		const nextInput = document.getElementById(`code-${lastFilledIndex}`);
		nextInput?.focus();
	}
	
	// Resend code
	async function resendCode(event?: Event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		
		if (resendCooldown > 0) return;
		
		console.log('Resending code for email:', email);
		isLoading = true;
		error = '';
		success = ''; // Clear any existing success message
		
		try {
			const response = await fetch('/api/auth/resend-password-reset-code', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});
			
			const result = await response.json();
			console.log('Resend code response:', result);
			
			if (response.ok) {
				success = 'New password reset code sent to your email!';
				resendCooldown = 60; // 60 seconds cooldown
				
				// Start countdown
				const interval = setInterval(() => {
					resendCooldown--;
					if (resendCooldown <= 0) {
						clearInterval(interval);
					}
				}, 1000);
			} else {
				error = result.error || 'Failed to resend code';
			}
		} catch (err) {
			console.error('Resend code error:', err);
			error = 'Failed to resend code. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	// Handle form submission
	function handleSubmit() {
		const codeString = code.join('');
		console.log('=== Form Submission Debug ===');
		console.log('Code array:', code);
		console.log('Code string:', codeString);
		console.log('Code string length:', codeString.length);
		console.log('Email:', email);
		console.log('Is valid 6-digit code?', /^\d{6}$/.test(codeString));
		
		if (codeString.length !== 6) {
			error = 'Please enter a 6-digit code';
			return;
		}
		
		return async ({ result, update }: { result: any; update: any }) => {
			console.log('Form submission result:', result);
			
			if (result.type === 'failure') {
				error = result.data?.error || 'Invalid verification code';
				success = ''; // Clear success message on failure
			} else if (result.type === 'success') {
				success = 'Code verified! Redirecting to reset password...';
				error = ''; // Clear error message on success
				setTimeout(() => {
					goto(`/reset-password?email=${encodeURIComponent(email)}&code=${codeString}`);
				}, 2000);
			}
			await update();
		};
	}
</script>

<svelte:head>
	<title>Verify Reset Code - ShieldAuth</title>
	<meta name="description" content="Verify your password reset code" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
			<!-- Background texture overlay -->
			<div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5"></div>
			<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
			<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-2xl"></div>
			<div class="relative z-10">
				<div class="text-center mb-8">
					<h1 class="text-3xl font-bold text-white mb-2">
						Verify Reset Code
					</h1>
					<p class="text-gray-300">
						Enter the 6-digit code sent to <strong class="text-purple-400">{email}</strong>
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

				<!-- Code Alert -->
				<div class="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
					<div class="flex items-center gap-3">
						<svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span class="text-blue-300 text-sm font-medium">Don't Receive Code Yet! Check Spam Section As well</span>
					</div>
				</div>

				<!-- Verification Form -->
				<form method="POST" use:enhance={handleSubmit} class="space-y-6">
					<input type="hidden" name="email" value={email} />
					<input type="hidden" name="code" value={code.join('')} />
					
					<!-- Code Input -->
					<div>
						<label class="block text-sm font-semibold text-gray-300 mb-4 text-center">
							Enter the 6-digit code
						</label>
						<div class="flex justify-center space-x-3">
							{#each Array(6) as _, i}
								<input
									id="code-{i}"
									type="text"
									maxlength="1"
									value={code[i] || ''}
									oninput={(e) => handleCodeInput(i, (e.target as HTMLInputElement)?.value || '')}
									onkeydown={(e) => handleKeyDown(i, e)}
									onpaste={handlePaste}
									class="w-12 h-12 text-center text-lg font-semibold border border-gray-600 rounded-xl bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
								/>
							{/each}
						</div>
					</div>
				
					<!-- Submit Button -->
					<div>
						<button
							type="submit"
							disabled={isLoading || code.join('').length !== 6}
							class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
						>
							{isLoading ? 'Verifying...' : 'Verify Code'}
						</button>
					</div>
				</form>

				<!-- Resend Code -->
				<div class="mt-6 text-center">
					<p class="text-sm text-gray-400 mb-2">
						Didn't receive the code?
					</p>
					<button
						type="button"
						onclick={(e) => resendCode(e)}
						disabled={isLoading || resendCooldown > 0}
						class="text-purple-400 hover:text-purple-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
					</button>
				</div>

				<!-- Back to Login -->
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
