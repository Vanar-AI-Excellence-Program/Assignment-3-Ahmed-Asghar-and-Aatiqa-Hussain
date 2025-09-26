<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let formData = $state({
		name: '',
		email: '',
		subject: '',
		message: ''
	});

	let isSubmitting = $state(false);
	let submitStatus = $state<'idle' | 'success' | 'error'>('idle');
	let isVisible = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;
		submitStatus = 'idle';

		try {
			// Simulate form submission
			await new Promise(resolve => setTimeout(resolve, 2000));
			submitStatus = 'success';
			formData = { name: '', email: '', subject: '', message: '' };
		} catch (error) {
			submitStatus = 'error';
		} finally {
			isSubmitting = false;
		}
	}

	onMount(() => {
		// Apply dark mode
		if (typeof document !== 'undefined') {
			document.documentElement.classList.add('dark');
		}
		
		// Trigger animation after component mounts
		setTimeout(() => {
			isVisible = true;
		}, 100);
	});
</script>

<svelte:head>
	<title>Contact Us - ShieldAuth</title>
	<meta name="description" content="Get in touch with ShieldAuth team for support and inquiries" />
</svelte:head>

<!-- Hero Section -->
<section class="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-28 pb-24">
	<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
	<div class="relative max-w-6xl mx-auto px-4 text-center">
		<div class="space-y-6">
			<h1 class="text-4xl md:text-5xl font-bold text-white transition-all duration-1000 ease-out {isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
				Get in <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Touch</span>
			</h1>
			<p class="text-xl text-gray-300 max-w-2xl mx-auto transition-all duration-1000 ease-out delay-200 {isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
				Have questions about ShieldAuth? We're here to help you with any inquiries or support needs.
			</p>
		</div>
	</div>
</section>

<!-- Main Content -->
<main class="bg-gradient-to-b from-black via-gray-900 to-black py-16">
	<div class="max-w-6xl mx-auto px-4">
		<div class="grid lg:grid-cols-2 gap-12">
			<!-- Contact Information -->
			<div class="space-y-8">
				<div class="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
					<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
					<div class="relative z-10">
						<h2 class="text-2xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors duration-300">
							Contact Information
						</h2>
						<div class="space-y-6">
							<div class="flex items-center space-x-4">
								<div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-600/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-blue-500/30">
									<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
								</div>
								<div>
									<h3 class="text-white font-semibold">Email</h3>
									<p class="text-gray-400">support@shieldauth.com</p>
								</div>
							</div>
							<div class="flex items-center space-x-4">
								<div class="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-600/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-500/30">
									<svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div>
									<h3 class="text-white font-semibold">Response Time</h3>
									<p class="text-gray-400">Within 24 hours</p>
								</div>
							</div>
							<div class="flex items-center space-x-4">
								<div class="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-indigo-600/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-emerald-500/30">
									<svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
									</svg>
								</div>
								<div>
									<h3 class="text-white font-semibold">Support Hours</h3>
									<p class="text-gray-400">24/7 Available</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- FAQ Section -->
				<div class="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-purple-500/30 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transform hover:-translate-y-1 transition-all duration-500">
					<div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
					<div class="relative z-10">
						<h2 class="text-2xl font-bold text-white mb-6 group-hover:text-purple-300 transition-colors duration-300">
							Frequently Asked Questions
						</h2>
						<div class="space-y-4">
							<div class="border-l-4 border-purple-500/30 pl-4">
								<h3 class="text-white font-semibold mb-2">How secure is ShieldAuth?</h3>
								<p class="text-gray-400 text-sm">ShieldAuth uses industry-standard encryption and database sessions for maximum security.</p>
							</div>
							<div class="border-l-4 border-purple-500/30 pl-4">
								<h3 class="text-white font-semibold mb-2">Can I integrate ShieldAuth with my app?</h3>
								<p class="text-gray-400 text-sm">Yes! ShieldAuth provides comprehensive APIs for easy integration.</p>
							</div>
							<div class="border-l-4 border-purple-500/30 pl-4">
								<h3 class="text-white font-semibold mb-2">Is there a free trial?</h3>
								<p class="text-gray-400 text-sm">We offer a 30-day free trial with full access to all features.</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Contact Form -->
			<div class="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-indigo-500/30 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transform hover:-translate-y-1 transition-all duration-500">
				<div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				<div class="relative z-10">
					<h2 class="text-2xl font-bold text-white mb-6 group-hover:text-indigo-300 transition-colors duration-300">
						Send us a Message
					</h2>
					
					{#if submitStatus === 'success'}
						<div class="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
							<p class="text-emerald-400 text-center">Thank you! Your message has been sent successfully.</p>
						</div>
					{:else if submitStatus === 'error'}
						<div class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
							<p class="text-red-400 text-center">Sorry, there was an error sending your message. Please try again.</p>
						</div>
					{/if}

					<form onsubmit={handleSubmit} class="space-y-6">
						<div class="grid md:grid-cols-2 gap-6">
							<div>
								<label for="name" class="block text-sm font-semibold text-gray-300 mb-2">Name</label>
								<input
									type="text"
									id="name"
									bind:value={formData.name}
									required
									class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
									placeholder="Your name"
								/>
							</div>
							<div>
								<label for="email" class="block text-sm font-semibold text-gray-300 mb-2">Email</label>
								<input
									type="email"
									id="email"
									bind:value={formData.email}
									required
									class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
									placeholder="your@email.com"
								/>
							</div>
						</div>
						<div>
							<label for="subject" class="block text-sm font-semibold text-gray-300 mb-2">Subject</label>
							<input
								type="text"
								id="subject"
								bind:value={formData.subject}
								required
								class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
								placeholder="What's this about?"
							/>
						</div>
						<div>
							<label for="message" class="block text-sm font-semibold text-gray-300 mb-2">Message</label>
							<textarea
								id="message"
								bind:value={formData.message}
								required
								rows="5"
								class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none"
								placeholder="Tell us more about your inquiry..."
							></textarea>
						</div>
						<button
							type="submit"
							disabled={isSubmitting}
							class="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
						>
							{#if isSubmitting}
								<div class="flex items-center justify-center space-x-2">
									<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									<span>Sending...</span>
								</div>
							{:else}
								Send Message
							{/if}
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</main>
