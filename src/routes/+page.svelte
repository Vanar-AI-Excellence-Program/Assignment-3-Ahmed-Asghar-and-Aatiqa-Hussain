<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { showWarning } from '$lib/stores/notifications.js';
	import { onMount } from 'svelte';

	// Animation state
	let isLoaded = false;
	let typewriterText = '';
	let typewriterIndex = 0;
	
	const fullText = "AI-powered authentication with advanced security, seamless user management, and intelligent integration.";


	onMount(() => {
		// Trigger animation after page loads
		setTimeout(() => {
			isLoaded = true;
		}, 100);
		
		// Start typewriter effect after heading animation
		setTimeout(() => {
			const typewriterInterval = setInterval(() => {
				if (typewriterIndex < fullText.length) {
					typewriterText += fullText[typewriterIndex];
					typewriterIndex++;
				} else {
					clearInterval(typewriterInterval);
				}
			}, 30); // 30ms delay between each character
		}, 1500); // Start after heading animation completes
	});
</script>

<svelte:head>
	<title>Welcome to ShieldAuth - Secure Authentication</title>
	<meta name="description" content="A secure authentication application built with SvelteKit" />
</svelte:head>

<!-- Hero Section with Background Image -->
<section class="relative h-[70vh] flex items-center justify-center overflow-hidden group">
	<!-- Background Image -->
	<div class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 ease-out group-hover:scale-105" 
		 style="background-image: url('/images/backgrounds/bg-1.png');"></div>
	
	<!-- Overlay for better text readability -->
	<div class="absolute inset-0 bg-black/40"></div>
	
	<!-- Content -->
	<div class="relative z-10 max-w-4xl w-full text-center px-4 space-y-8 mt-16">
		<!-- Hero Section -->
		<div class="space-y-6">
			<div class="space-y-4">
						<h1 class="text-5xl md:text-6xl font-bold text-white">
							<span class="inline-block transition-all duration-1000 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">Welcome to </span>
							<span class="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-1000 ease-out delay-300 {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">ShieldAuth</span>
						</h1>
				<p class="text-xl font-semibold text-slate-300 max-w-2xl mx-auto min-h-[3rem]">
					{typewriterText}<span class="animate-pulse">|</span>
				</p>
			</div>
		</div>
		
		<!-- Call to Action -->
		<div class="space-y-4">
			{#if $page.data.user}
				<div class="space-y-4">
					<p class="text-lg text-white drop-shadow-lg">
						Welcome back, <span class="font-semibold text-sky-400">{$page.data.user.name || $page.data.user.email}</span>!
					</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<a
							href="/dashboard"
							class="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
						>
							Go to Dashboard
						</a>
						<a
							href="/profile"
							class="inline-flex justify-center items-center px-8 py-4 border border-slate-300 rounded-lg shadow-sm text-base font-semibold text-white bg-transparent hover:border-sky-500 hover:text-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-600 transition-all duration-200"
						>
							View Profile
						</a>
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<p class="text-lg font-semibold text-white">
						Get started with secure authentication today
					</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/register"
                            class="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                        >
							Get Started
						</a>
						<a
							href="/login"
							class="inline-flex justify-center items-center px-8 py-4 border border-slate-300 rounded-lg shadow-sm text-base font-semibold text-white bg-transparent hover:border-sky-500 hover:text-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-600 transition-all duration-200"
						>
                            Sign In
                        </a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Main Content Section -->
<main class="bg-black py-16">
	<div class="max-w-6xl mx-auto px-4">
		<!-- Intro Section -->
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
				Why Choose <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">ShieldAuth</span>?
			</h2>
			<p class="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
				ShieldAuth is a modern, secure authentication application built with cutting-edge technologies. 
				We provide enterprise-level security with database sessions, role-based access control, and a 
				beautiful user interface that works seamlessly across all devices.
			</p>
		</div>

		<!-- Feature Cards Grid -->
		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
			<div class="group relative bg-gradient-to-r from-blue-900/40 via-blue-800/30 to-blue-700/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/25 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
				<!-- Animated background effects -->
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-blue-400/5 to-blue-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-300/10 to-transparent rounded-full blur-lg"></div>
				
				<div class="relative z-10">
					<div class="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/30 group-hover:from-blue-400/30 group-hover:to-blue-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-blue-500/30">
						<svg class="w-7 h-7 text-blue-300 group-hover:text-blue-200 transition-all duration-300 group-hover:drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors duration-300 group-hover:drop-shadow-sm">Secure Authentication</h3>
					<p class="text-slate-300 group-hover:text-slate-100 transition-colors duration-300 leading-relaxed">Database sessions with bcrypt password hashing for maximum security</p>
				</div>
			</div>
			
			<div class="group relative bg-gradient-to-r from-cyan-900/40 via-cyan-800/30 to-cyan-700/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 shadow-2xl hover:shadow-3xl hover:shadow-cyan-500/25 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
				<!-- Animated background effects -->
				<div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-cyan-400/5 to-cyan-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full blur-xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-300/10 to-transparent rounded-full blur-lg"></div>
				
				<div class="relative z-10">
					<div class="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 group-hover:from-cyan-400/30 group-hover:to-cyan-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-cyan-500/30">
						<svg class="w-7 h-7 text-cyan-300 group-hover:text-cyan-200 transition-all duration-300 group-hover:drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors duration-300 group-hover:drop-shadow-sm">Role-Based Access</h3>
					<p class="text-slate-300 group-hover:text-slate-100 transition-colors duration-300 leading-relaxed">Advanced admin dashboard with user management and analytics</p>
				</div>
			</div>

			<div class="group relative bg-gradient-to-r from-indigo-900/40 via-indigo-800/30 to-indigo-700/40 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 shadow-2xl hover:shadow-3xl hover:shadow-indigo-500/25 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
				<!-- Animated background effects -->
				<div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-indigo-400/5 to-indigo-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-transparent rounded-full blur-xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-300/10 to-transparent rounded-full blur-lg"></div>
				
				<div class="relative z-10">
					<div class="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 group-hover:from-indigo-400/30 group-hover:to-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-indigo-500/30">
						<svg class="w-7 h-7 text-indigo-300 group-hover:text-indigo-200 transition-all duration-300 group-hover:drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-300 group-hover:drop-shadow-sm">Modern Technology</h3>
					<p class="text-slate-300 group-hover:text-slate-100 transition-colors duration-300 leading-relaxed">Built with SvelteKit 5, TypeScript, and PostgreSQL for reliability</p>
				</div>
			</div>

			<div class="group relative bg-gradient-to-r from-green-900/40 via-green-800/30 to-green-700/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 shadow-2xl hover:shadow-3xl hover:shadow-green-500/25 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
				<!-- Animated background effects -->
				<div class="absolute inset-0 bg-gradient-to-r from-green-500/5 via-green-400/5 to-green-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-transparent rounded-full blur-xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-300/10 to-transparent rounded-full blur-lg"></div>
				
				<div class="relative z-10">
					<div class="w-14 h-14 bg-gradient-to-br from-green-500/20 to-green-600/30 group-hover:from-green-400/30 group-hover:to-green-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-green-500/30">
						<svg class="w-7 h-7 text-green-300 group-hover:text-green-200 transition-all duration-300 group-hover:drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-white mb-3 group-hover:text-green-200 transition-colors duration-300 group-hover:drop-shadow-sm">User-Friendly</h3>
					<p class="text-slate-300 group-hover:text-slate-100 transition-colors duration-300 leading-relaxed">Beautiful dark interface with responsive design for all devices</p>
				</div>
			</div>

			<div class="group relative bg-gradient-to-r from-orange-900/40 via-orange-800/30 to-orange-700/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 shadow-2xl hover:shadow-3xl hover:shadow-orange-500/25 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
				<!-- Animated background effects -->
				<div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-orange-400/5 to-orange-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-300/10 to-transparent rounded-full blur-lg"></div>
				
				<div class="relative z-10">
					<div class="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-600/30 group-hover:from-orange-400/30 group-hover:to-orange-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-orange-500/30">
						<svg class="w-7 h-7 text-orange-300 group-hover:text-orange-200 transition-all duration-300 group-hover:drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-white mb-3 group-hover:text-orange-200 transition-colors duration-300 group-hover:drop-shadow-sm">Analytics Dashboard</h3>
					<p class="text-slate-300 group-hover:text-slate-100 transition-colors duration-300 leading-relaxed">Comprehensive user analytics and system monitoring tools</p>
				</div>
			</div>

			<div class="group relative bg-gradient-to-r from-emerald-900/40 via-emerald-800/30 to-emerald-700/40 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-400/50 shadow-2xl hover:shadow-3xl hover:shadow-emerald-500/25 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
				<!-- Animated background effects -->
				<div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-400/5 to-emerald-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-300/10 to-transparent rounded-full blur-lg"></div>
				
				<div class="relative z-10">
					<div class="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 group-hover:from-emerald-400/30 group-hover:to-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-emerald-500/30">
						<svg class="w-7 h-7 text-emerald-300 group-hover:text-emerald-200 transition-all duration-300 group-hover:drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-white mb-3 group-hover:text-emerald-200 transition-colors duration-300 group-hover:drop-shadow-sm">Production Ready</h3>
					<p class="text-slate-300 group-hover:text-slate-100 transition-colors duration-300 leading-relaxed">Docker deployment with comprehensive security and monitoring</p>
				</div>
			</div>
		</div>

		<!-- ShieldBot AI Feature Card -->
		<div class="mb-16">
			<div class="group relative bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-700/40 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 shadow-2xl hover:shadow-3xl hover:shadow-purple-500/25 transform hover:-translate-y-2 transition-all duration-500 overflow-hidden">
				<!-- Animated background effects -->
				<div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-purple-400/5 to-purple-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full blur-xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-300/10 to-transparent rounded-full blur-lg"></div>
				
				<!-- Centered content layout -->
				<div class="relative z-10 text-center">
					<!-- ShieldBot Icon -->
					<div class="flex justify-center mb-3">
						<div class="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/30 group-hover:from-purple-400/30 group-hover:to-purple-500/40 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-purple-500/30">
							<svg class="w-7 h-7 text-purple-300 group-hover:text-purple-200 transition-all duration-300 group-hover:drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<!-- Square Message Icon -->
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
							</svg>
						</div>
					</div>
					
					<!-- Heading -->
					<h3 class="text-3xl font-bold text-white group-hover:text-purple-200 transition-colors duration-300 mb-2">
						ShieldBot
					</h3>
					
					<!-- AI Assistant Badge -->
					<div class="flex justify-center mb-3">
						<span class="px-4 py-2 bg-gradient-to-r from-purple-500/30 to-purple-500/30 text-purple-200 text-sm font-semibold rounded-full border border-purple-400/50 shadow-lg">
							AI Assistant
						</span>
					</div>
					
					<!-- Description -->
					<p class="text-lg text-slate-300 group-hover:text-slate-200 transition-colors duration-300 leading-relaxed max-w-3xl mx-auto mb-4">
						Your intelligent security companion. Get instant help with authentication,
						security best practices, and system guidance powered by advanced AI.
					</p>
					
					<!-- Action Buttons -->
					<div class="flex items-center justify-center space-x-4">
						<a
							href="/chatbot?new=true"
							class="px-6 py-3 bg-gradient-to-r from-purple-800/90 via-purple-700/80 to-purple-800/90 hover:from-purple-700/90 hover:via-purple-600/80 hover:to-purple-700/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-600/30 transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 border border-purple-600/50 backdrop-blur-sm"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
							<span>Start Chat</span>
						</a>

						<button
							on:click={() => showWarning('ShieldBot is your AI security assistant. Click "Start Chat" to begin a conversation!')}
							class="px-6 py-3 bg-gradient-to-r from-purple-800/80 via-purple-700/70 to-purple-800/80 hover:from-purple-700/80 hover:via-purple-600/70 hover:to-purple-700/80 text-white font-semibold rounded-xl border border-purple-600/50 hover:border-purple-500/70 shadow-lg hover:shadow-xl hover:shadow-purple-600/30 transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span>Learn More</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Call to Action Section -->
		<div class="text-center mb-12">
			<h3 class="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
			<p class="text-gray-300 mb-8">Join thousands of users who trust ShieldAuth for their authentication needs.</p>

			{#if $page.data.user}
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="/dashboard"
						class="group relative inline-flex justify-center items-center px-8 py-3 bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/80 hover:to-slate-700/90 border border-slate-600/50 rounded-lg text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:shadow-slate-600/30 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 overflow-hidden backdrop-blur-sm"
					>
						<!-- Dark texture overlay -->
						<div class="absolute inset-0 bg-gradient-to-r from-slate-600/10 via-transparent to-slate-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						<span class="relative z-10">Dashboard</span>
					</a>
					<a
						href="/profile"
						class="group relative inline-flex justify-center items-center px-8 py-3 bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/80 hover:to-slate-700/90 border border-slate-600/50 rounded-lg text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:shadow-slate-600/30 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 overflow-hidden backdrop-blur-sm"
					>
						<!-- Dark texture overlay -->
						<div class="absolute inset-0 bg-gradient-to-r from-slate-600/10 via-transparent to-slate-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						<span class="relative z-10">Profile</span>
					</a>
				</div>
			{:else}
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="/register"
						class="group relative inline-flex justify-center items-center px-8 py-3 bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/80 hover:to-slate-700/90 border border-slate-600/50 rounded-lg text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:shadow-slate-600/30 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 overflow-hidden backdrop-blur-sm"
					>
						<!-- Dark texture overlay -->
						<div class="absolute inset-0 bg-gradient-to-r from-slate-600/10 via-transparent to-slate-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						<span class="relative z-10">Get Started</span>
					</a>
					<a
						href="/login"
						class="group relative inline-flex justify-center items-center px-8 py-3 bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/80 hover:to-slate-700/90 border border-slate-600/50 rounded-lg text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:shadow-slate-600/30 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 overflow-hidden backdrop-blur-sm"
					>
						<!-- Dark texture overlay -->
						<div class="absolute inset-0 bg-gradient-to-r from-slate-600/10 via-transparent to-slate-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						<span class="relative z-10">Sign In</span>
					</a>
				</div>
			{/if}
		</div>
	</div>
</main>

<!-- Footer -->
<footer class="bg-gray-900 border-t border-gray-700">
	<div class="max-w-6xl mx-auto px-4 py-12">
		<div class="grid md:grid-cols-4 gap-8">
			<!-- Brand -->
			<div class="md:col-span-2">
				<div class="flex items-center mb-4">
					<span class="text-2xl font-bold text-blue-400">ShieldAuth</span>
				</div>
				<p class="text-slate-400 mb-4 max-w-md">
					A modern, secure authentication application built with SvelteKit 5, featuring 
					database sessions, role-based access control, and enterprise-level security.
				</p>
				<div class="flex space-x-4">
					<a href="#" class="text-slate-400 hover:text-blue-400 transition-colors" aria-label="Twitter">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
						</svg>
					</a>
					<a href="#" class="text-slate-400 hover:text-blue-400 transition-colors" aria-label="Facebook">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
						</svg>
					</a>
					<a href="#" class="text-slate-400 hover:text-blue-400 transition-colors" aria-label="Pinterest">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
						</svg>
					</a>
				</div>
			</div>

			<!-- Quick Links -->
			<div>
				<h4 class="text-white font-semibold mb-4">Quick Links</h4>
				<ul class="space-y-2">
					<li><a href="/login" class="text-slate-400 hover:text-blue-400 transition-colors">Login</a></li>
					<li><a href="/register" class="text-slate-400 hover:text-blue-400 transition-colors">Register</a></li>
					<li><a href="/dashboard" class="text-slate-400 hover:text-blue-400 transition-colors">Dashboard</a></li>
					<li><a href="/profile" class="text-slate-400 hover:text-blue-400 transition-colors">Profile</a></li>
				</ul>
			</div>

			<!-- Support -->
			<div>
				<h4 class="text-white font-semibold mb-4">Support</h4>
				<ul class="space-y-2">
					<li><a href="/contact" class="text-slate-400 hover:text-blue-400 transition-colors">Documentation</a></li>
					<li><a href="/contact" class="text-slate-400 hover:text-blue-400 transition-colors">API Reference</a></li>
					<li><a href="/contact" class="text-slate-400 hover:text-blue-400 transition-colors">Help Center</a></li>
					<li><a href="/contact" class="text-slate-400 hover:text-blue-400 transition-colors">Contact Us</a></li>
				</ul>
			</div>
		</div>

		<!-- Bottom Bar -->
		<div class="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
			<p class="text-slate-400 text-sm">
				© 2024 ShieldAuth. All rights reserved.
			</p>
			<div class="flex space-x-6 mt-4 md:mt-0">
				<a href="/contact" class="text-slate-400 hover:text-blue-400 text-sm transition-colors">Privacy Policy</a>
				<a href="/contact" class="text-slate-400 hover:text-blue-400 text-sm transition-colors">Terms of Service</a>
				<a href="/contact" class="text-slate-400 hover:text-blue-400 text-sm transition-colors">Security</a>
			</div>
		</div>
	</div>
</footer>
