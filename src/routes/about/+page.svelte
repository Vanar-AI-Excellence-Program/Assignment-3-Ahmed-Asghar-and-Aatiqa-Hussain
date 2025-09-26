<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let activeTab = $state('mission');
	let isVisible = $state(false);

	const tabs = [
		{ id: 'mission', label: 'Our Mission', icon: '🎯' },
		{ id: 'team', label: 'Our Team', icon: '👥' },
		{ id: 'values', label: 'Our Values', icon: '💎' },
		{ id: 'story', label: 'Our Story', icon: '📖' }
	];

	const teamMembers = [
		{
			name: 'Muhammad Ahmed',
			role: 'Founder & Full Stack Developer',
			description: 'Lead developer and architect behind ShieldAuth, passionate about building secure and scalable authentication solutions',
			image: '/images/team/muhammad.jpg'
		},
		{
			name: 'Emma Watson',
			role: 'UI/UX Designer',
			description: 'Creative designer focused on creating intuitive and beautiful user experiences for secure applications',
			image: '/images/team/emma.jpg'
		},
		{
			name: 'Sofia Chen',
			role: 'Security Specialist',
			description: 'Cybersecurity expert ensuring our platform meets the highest security standards and compliance requirements',
			image: '/images/team/sofia.jpg'
		}
	];

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
	<title>About Us - ShieldAuth</title>
	<meta name="description" content="Learn about ShieldAuth's mission, team, and commitment to secure authentication" />
</svelte:head>

<!-- Hero Section -->
<section class="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-28 pb-24">
	<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
	<div class="relative max-w-6xl mx-auto px-4 text-center">
		<div class="space-y-6">
			<h1 class="text-4xl md:text-5xl font-bold text-white transition-all duration-1000 ease-out {isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
				About <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">ShieldAuth</span>
			</h1>
			<p class="text-xl text-gray-300 max-w-2xl mx-auto transition-all duration-1000 ease-out delay-200 {isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
				We're building the future of secure authentication with cutting-edge technology and unwavering commitment to user safety.
			</p>
		</div>
	</div>
</section>

<!-- Main Content -->
<main class="bg-gradient-to-b from-black via-gray-900 to-black py-16">
	<div class="max-w-6xl mx-auto px-4">
		<!-- Tab Navigation -->
		<div class="mb-12">
			<div class="flex flex-wrap justify-center gap-2 p-2 bg-gray-800/50 rounded-2xl border border-gray-700 backdrop-blur-sm">
				{#each tabs as tab}
					<button
						onclick={() => activeTab = tab.id}
						class="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 {
						activeTab === tab.id 
							? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
								: 'text-gray-400 hover:text-white hover:bg-gray-700/50'
						}"
					>
						<span class="text-lg">{tab.icon}</span>
						<span>{tab.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Tab Content -->
		<div class="space-y-8">
			{#if activeTab === 'mission'}
				<div class="grid lg:grid-cols-2 gap-12 items-center">
					<div class="space-y-6">
						<h2 class="text-3xl font-bold text-white">
							Our <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Mission</span>
						</h2>
						<p class="text-lg text-gray-300 leading-relaxed">
							At ShieldAuth, we believe that security shouldn't be complicated. Our mission is to provide 
							enterprise-grade authentication solutions that are both powerful and easy to use.
						</p>
						<div class="space-y-4">
							<div class="flex items-start space-x-4">
								<div class="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-600/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-blue-500/30">
									<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								</div>
								<div>
									<h3 class="text-white font-semibold mb-1">Secure by Design</h3>
									<p class="text-gray-400">Every feature is built with security as the foundation</p>
								</div>
							</div>
							<div class="flex items-start space-x-4">
								<div class="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-indigo-600/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30">
									<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
								</div>
								<div>
									<h3 class="text-white font-semibold mb-1">Lightning Fast</h3>
									<p class="text-gray-400">Optimized for speed without compromising security</p>
								</div>
							</div>
							<div class="flex items-start space-x-4">
								<div class="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-indigo-600/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-500/30">
									<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
									</svg>
								</div>
								<div>
									<h3 class="text-white font-semibold mb-1">User-Centric</h3>
									<p class="text-gray-400">Designed with the end user experience in mind</p>
								</div>
							</div>
						</div>
					</div>
					<div class="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
						<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
						<div class="relative z-10 text-center">
							<div class="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
								<svg class="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<h3 class="text-2xl font-bold text-white mb-4">Trusted by Thousands</h3>
							<p class="text-slate-300">Over 10,000 developers and companies trust ShieldAuth for their authentication needs.</p>
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'team'}
				<div class="space-y-8">
					<div class="text-center">
						<h2 class="text-3xl font-bold text-white mb-4">
							Meet Our <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Team</span>
						</h2>
						<p class="text-lg text-gray-300 max-w-2xl mx-auto">
							We're a passionate team of security experts, developers, and designers working together to build the future of authentication.
						</p>
					</div>
					<div class="grid md:grid-cols-3 gap-8">
						{#each teamMembers as member}
							<div class="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-2 transition-all duration-500">
								<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
								<div class="relative z-10 text-center">
									<div class="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-600/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-500/30">
										<span class="text-2xl">👤</span>
									</div>
									<h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">{member.name}</h3>
									<p class="text-blue-400 font-semibold mb-3">{member.role}</p>
									<p class="text-gray-400 text-sm leading-relaxed">{member.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if activeTab === 'values'}
				<div class="grid lg:grid-cols-2 gap-12">
					<div class="space-y-8">
						<h2 class="text-3xl font-bold text-white">
							Our <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Values</span>
						</h2>
						<div class="space-y-6">
							<div class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
								<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
								<div class="relative z-10">
									<h3 class="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">Security First</h3>
									<p class="text-slate-400">We prioritize security in every decision, ensuring our users' data is always protected.</p>
								</div>
							</div>
							<div class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
								<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
								<div class="relative z-10">
									<h3 class="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">Innovation</h3>
									<p class="text-slate-400">We continuously push the boundaries of what's possible in authentication technology.</p>
								</div>
							</div>
							<div class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
								<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
								<div class="relative z-10">
									<h3 class="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">Transparency</h3>
									<p class="text-slate-400">We believe in open communication and honest relationships with our users and partners.</p>
								</div>
							</div>
						</div>
						<div class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
							<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							<div class="relative z-10">
								<h3 class="text-2xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors duration-300">Our Commitment</h3>
								<div class="space-y-4">
									<div class="flex items-center space-x-3">
										<div class="w-2 h-2 bg-blue-400 rounded-full"></div>
										<span class="text-slate-300">99.9% uptime guarantee</span>
									</div>
									<div class="flex items-center space-x-3">
										<div class="w-2 h-2 bg-blue-400 rounded-full"></div>
										<span class="text-slate-300">24/7 security monitoring</span>
									</div>
									<div class="flex items-center space-x-3">
										<div class="w-2 h-2 bg-blue-400 rounded-full"></div>
										<span class="text-slate-300">Regular security audits</span>
									</div>
									<div class="flex items-center space-x-3">
										<div class="w-2 h-2 bg-blue-400 rounded-full"></div>
										<span class="text-slate-300">GDPR compliance</span>
									</div>
									<div class="flex items-center space-x-3">
										<div class="w-2 h-2 bg-blue-400 rounded-full"></div>
										<span class="text-slate-300">SOC 2 Type II certified</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'story'}
				<div class="max-w-4xl mx-auto">
					<div class="text-center mb-12">
						<h2 class="text-3xl font-bold text-white mb-4">
							Our <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Story</span>
						</h2>
						<p class="text-lg text-slate-300">From a simple idea to a global authentication platform</p>
					</div>
					<div class="space-y-8">
						<div class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
							<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							<div class="relative z-10">
								<div class="flex items-start space-x-4">
									<div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
										<span class="text-xl">🚀</span>
									</div>
									<div>
										<h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">2020 - The Beginning</h3>
										<p class="text-slate-400">ShieldAuth was founded with a simple mission: make authentication secure, simple, and accessible to everyone.</p>
									</div>
								</div>
							</div>
						</div>
						<div class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
							<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							<div class="relative z-10">
								<div class="flex items-start space-x-4">
									<div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
										<span class="text-xl">💡</span>
									</div>
									<div>
										<h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">2021 - First Breakthrough</h3>
										<p class="text-slate-400">We launched our first public beta and gained our first 1,000 users, proving that developers needed a better authentication solution.</p>
									</div>
								</div>
							</div>
						</div>
						<div class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-500">
							<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							<div class="relative z-10">
								<div class="flex items-start space-x-4">
									<div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
										<span class="text-xl">🌟</span>
									</div>
									<div>
										<h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">2023 - Global Expansion</h3>
										<p class="text-slate-400">Today, ShieldAuth serves over 10,000 developers worldwide and continues to innovate in the authentication space.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>
