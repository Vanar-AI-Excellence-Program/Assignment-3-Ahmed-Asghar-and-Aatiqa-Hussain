<script lang="ts">
	import { enhance } from '$app/forms';
	import { signIn } from '@auth/sveltekit/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	// Redirect if already logged in
	$effect(() => {
		if ($page.data.user) {
			goto('/');
		}
	});
	
	// Handle OAuth errors
	let oauthError = $state('');
	$effect(() => {
		const error = $page.url.searchParams.get('error');
		if (error === 'OAuthAccountNotLinked') {
			oauthError = 'This email is already registered. Please sign in with your email and password first, then you can link your Google account from your profile.';
		} else if (error === 'OAuthSignin') {
			oauthError = 'There was an error signing in with OAuth. Please try again.';
		} else if (error === 'OAuthCallback') {
			oauthError = 'OAuth callback error. Please try again.';
		} else if (error) {
			oauthError = 'Authentication error. Please try again.';
		} else {
			oauthError = '';
		}
	});
	
	// Handle Google OAuth sign-in
	async function handleGoogleSignIn() {
		console.log('🔗 Google OAuth - Callback URL set to: /');
		await signIn('google', { callbackUrl: '/' });
	}
	
	// Handle GitHub OAuth sign-in
	async function handleGitHubSignIn() {
		console.log('🔗 GitHub OAuth - Callback URL set to: /');
		await signIn('github', { callbackUrl: '/' });
	}
</script>

<svelte:head>
	<title>Login - ShieldAuth</title>
	<meta name="description" content="Sign in to your account" />
</svelte:head>

<!-- Two Panel Layout -->
<div class="min-h-screen flex">
	<!-- Left Panel - Graphics and Welcome (65%) -->
	<div class="hidden lg:flex lg:w-[65%] bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 opacity-10">
			<svg class="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
						<path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgb(147 197 253)" stroke-width="0.5"/>
					</pattern>
				</defs>
				<rect width="100" height="100" fill="url(#grid)" />
			</svg>
		</div>
		
		<!-- Content -->
		<div class="relative z-10 flex flex-col justify-center items-center px-12 text-white w-full">
			<!-- Text Overlay Background -->
			<div class="absolute inset-0 bg-black/20 rounded-2xl"></div>
			<div class="relative z-20 max-w-lg text-center p-8">
				<!-- Logo -->
				<div class="mb-12">
					<h1 class="text-5xl font-bold mb-4 text-white">ShieldAuth</h1>
					<p class="text-blue-200 text-xl">Secure Authentication Platform</p>
				</div>
				
				<!-- Welcome Text -->
				<div class="mb-12">
					<h2 class="text-4xl font-semibold mb-6 text-white">Welcome Back!</h2>
					<p class="text-blue-200 text-lg leading-relaxed">
						Sign in to access your secure dashboard and manage your account with confidence.
					</p>
				</div>
				
				<!-- Features -->
				<div class="flex justify-center space-x-8">
					<div class="flex flex-col items-center space-y-2">
						<div class="w-12 h-12 bg-blue-800/30 rounded-full flex items-center justify-center">
							<svg class="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<span class="text-blue-200 text-sm text-center">Secure database sessions</span>
					</div>
					<div class="flex flex-col items-center space-y-2">
						<div class="w-12 h-12 bg-purple-800/30 rounded-full flex items-center justify-center">
							<svg class="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
						</div>
						<span class="text-purple-200 text-sm text-center">Advanced security features</span>
					</div>
					<div class="flex flex-col items-center space-y-2">
						<div class="w-12 h-12 bg-indigo-800/30 rounded-full flex items-center justify-center">
							<svg class="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<span class="text-indigo-200 text-sm text-center">Lightning fast performance</span>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Decorative Elements -->
		<div class="absolute top-20 right-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"></div>
		<div class="absolute bottom-20 left-20 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
		<div class="absolute top-1/2 left-10 w-16 h-16 bg-indigo-400/10 rounded-full blur-lg"></div>
	</div>
	
	<!-- Right Panel - Login Form (35%) -->
	<div class="flex-1 lg:w-[35%] flex flex-col justify-center px-8 bg-gradient-to-b from-black via-gray-900 to-black">
		<!-- Mobile Logo -->
		<div class="lg:hidden text-center mb-8">
			<a href="/" class="text-3xl font-bold text-white">
				ShieldAuth
			</a>
		</div>
		
		<!-- Form Container with Rectangle Background -->
		<div class="mx-auto w-full max-w-md">
			<!-- Rectangle Background with 2cm spacing -->
			<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 m-8 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5"></div>
				<div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10">
				<!-- Form Header -->
				<div class="text-center mb-8">
					<div class="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
						<svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-white">
						Sign in
					</h2>
					<p class="mt-2 text-sm text-gray-300">
						Don't have an account?{' '}
						<a href="/register" class="font-medium text-blue-400 hover:text-blue-300 transition-colors">
							Sign up
						</a>
					</p>
				</div>
				
				<!-- OAuth Buttons -->
				<div class="space-y-4 mb-6">
					<!-- Google Sign In -->
					<button
						type="button"
						onclick={handleGoogleSignIn}
						class="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-xl text-gray-300 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
					>
						<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Continue with Google
					</button>
					
					<!-- GitHub Sign In -->
					<button
						type="button"
						onclick={handleGitHubSignIn}
						class="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-xl text-gray-300 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
					>
						<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
						Continue with GitHub
					</button>
				</div>
				
				<!-- Divider -->
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-600"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-gray-900 text-gray-400">Or continue with email</span>
					</div>
				</div>
				
				<!-- OAuth Error Message -->
				{#if oauthError}
					<div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm text-blue-300">{oauthError}</p>
							</div>
						</div>
					</div>
				{/if}
				
				<!-- Login Form -->
				<form method="POST" use:enhance class="space-y-6">
					<!-- Error Message -->
					{#if $page.form?.error}
						<div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
							<div class="flex">
								<div class="flex-shrink-0">
									<svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div class="ml-3">
									<p class="text-sm text-blue-300">{$page.form.error}</p>
								</div>
							</div>
						</div>
					{/if}
					
					<!-- Email Field -->
					<div>
						<label for="email" class="block text-sm font-semibold text-gray-300 mb-2">
							Email address
						</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							class="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
							placeholder="Enter your email"
						/>
					</div>
					
					<!-- Password Field -->
					<div>
						<label for="password" class="block text-sm font-semibold text-gray-300 mb-2">
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							class="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
							placeholder="Enter your password"
						/>
					</div>
					
					<!-- Forgot Password Link -->
					<div class="text-right">
						<a href="/forgot-password" class="text-sm text-blue-400 hover:text-blue-300 transition-colors">
							Forgot your password?
						</a>
					</div>
					
					<!-- Submit Button -->
					<div>
						<button
							type="submit"
							class="w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
						>
							<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
							</svg>
							Sign in
						</button>
					</div>
				</form>
				</div>
			</div>
		</div>
	</div>
</div>