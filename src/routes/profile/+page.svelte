<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	
	let name = $page.data.user?.name || '';
	let email = $page.data.user?.email || '';
	let selectedFile: File | null = null;
	
	// Handle file selection
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				alert('Please select an image file');
				return;
			}
			
			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert('File size must be less than 5MB');
				return;
			}
			
			selectedFile = file;
		}
	}
	
	// Handle profile picture upload
	async function handleImageUpload() {
		if (!selectedFile) return;
		
		try {
			const formData = new FormData();
			formData.append('image', selectedFile);
			
			const response = await fetch('/api/profile/upload-image', {
				method: 'POST',
				body: formData
			});
			
			if (response.ok) {
				// Refresh page data to show new image
				await invalidateAll();
				selectedFile = null;
			} else {
				const error = await response.json();
				alert(error.message || 'Failed to upload image');
			}
		} catch (error) {
			console.error('Upload error:', error);
			alert('Failed to upload image');
		}
	}
	
	// Handle profile picture deletion
	async function handleImageDelete() {
		if (!confirm('Are you sure you want to delete your profile picture?')) {
			return;
		}
		
		try {
			const response = await fetch('/api/profile/delete-image', {
				method: 'DELETE'
			});
			
			if (response.ok) {
				// Refresh page data to show updated image
				await invalidateAll();
			} else {
				const error = await response.json();
				alert(error.message || 'Failed to delete image');
			}
		} catch (error) {
			console.error('Delete error:', error);
			alert('Failed to delete image');
		}
	}
</script>

<svelte:head>
	<title>Profile - AuthApp</title>
	<meta name="description" content="Manage your profile" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Spacer for transparent navbar -->
		<div class="h-10"></div>
		<div class="h-10"></div>
		<!-- Header -->
		<div class="mb-8">
			<div class="relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
				<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
				<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10">
					<h1 class="text-4xl font-bold text-white mb-3">Profile Settings</h1>
					<p class="text-gray-300 text-lg">
						Manage your account information and preferences
					</p>
				</div>
			</div>
		</div>

		<!-- Profile Picture Section (Only for non-OAuth users) -->
		{#if $page.data.user?.password}
			<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8 mb-8 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
				<!-- Background texture overlay -->
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5"></div>
				<div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
				<div class="relative z-10">
					<h3 class="text-xl font-bold text-white mb-6">Profile Picture</h3>
			
					<div class="flex items-center space-x-8">
						<!-- Current Profile Picture -->
						<div class="flex-shrink-0 relative group">
							{#if $page.data.user?.image}
								<img src={$page.data.user.image} alt="Profile" class="w-24 h-24 rounded-full object-cover border-2 border-gray-600/50 shadow-lg" />
								<!-- Delete button overlay -->
								<button
									type="button"
									onclick={handleImageDelete}
									class="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
									aria-label="Delete profile picture"
									title="Delete profile picture"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{:else}
								<div class="w-24 h-24 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold border-2 border-gray-600/50 shadow-lg">
									{$page.data.user?.email?.charAt(0).toUpperCase()}
								</div>
							{/if}
						</div>
				
						<!-- Upload Section -->
						<div class="flex-1">
							<div class="space-y-4">
								<!-- File Input -->
								<div>
									<label for="profile-image" class="block text-sm font-medium text-gray-300 mb-3">
										Upload New Picture
									</label>
									<div class="relative">
										<input
											id="profile-image"
											type="file"
											accept="image/*"
											onchange={handleFileSelect}
											class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
										/>
										<div class="relative border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-gray-800/30 transition-all duration-200 cursor-pointer group">
											<svg class="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
												<path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
											</svg>
											<div class="mt-2">
												<p class="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
													Click to upload
												</p>
												<p class="text-xs text-gray-400 mt-1">
													PNG, JPG, GIF up to 5MB
												</p>
											</div>
										</div>
									</div>
								</div>
						
								<!-- File Selected and Upload Button -->
								{#if selectedFile}
									<div class="space-y-4">
										<div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
											<div class="flex items-center space-x-3">
												<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<div>
													<p class="text-sm font-medium text-white">File Selected</p>
													<p class="text-xs text-gray-400">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
												</div>
											</div>
										</div>
										<div class="flex space-x-3">
											<button
												type="button"
												onclick={handleImageUpload}
												class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
											>
												<svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
												</svg>
												Upload Picture
											</button>
											<button
												type="button"
												onclick={() => {
													selectedFile = null;
													const input = document.getElementById('profile-image') as HTMLInputElement;
													if (input) input.value = '';
												}}
												class="px-6 py-3 border border-gray-600 text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-800 hover:border-gray-500 hover:text-white transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
											>
												<svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
												Cancel
											</button>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

        <!-- Profile Form -->
        <div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8 hover:border-purple-500/50 transition-all duration-300 overflow-hidden mb-8">
			<!-- Background texture overlay -->
			<div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5"></div>
			<div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
			<div class="relative z-10">
				<form method="POST" action="?/updateProfile" use:enhance class="space-y-6">
					<!-- Success Message -->
					{#if $page.form?.success}
						<div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
							<div class="flex">
								<div class="flex-shrink-0">
									<svg class="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div class="ml-3">
									<p class="text-sm text-emerald-300">{$page.form.success}</p>
								</div>
							</div>
						</div>
					{/if}

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

					<!-- Name Field -->
					<div>
						<label for="name" class="block text-sm font-semibold text-gray-300 mb-2">
							Full Name
						</label>
						<div class="mt-1">
							<input
								id="name"
								name="name"
								type="text"
								bind:value={name}
								required
								class="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
								placeholder="Enter your full name"
							/>
						</div>
					</div>

					<!-- Email Field -->
					<div>
						<label for="email" class="block text-sm font-semibold text-gray-300 mb-2">
							Email Address
						</label>
						<div class="mt-1">
							<input
								id="email"
								name="email"
								type="email"
								bind:value={email}
								required
								class="appearance-none relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
								placeholder="Enter your email"
							/>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="flex justify-end">
						<button
							type="submit"
							class="px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
						>
							Update Profile
						</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Account Information -->
		<div class="group relative bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
			<!-- Background texture overlay -->
			<div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-green-500/5"></div>
			<div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>
			<div class="relative z-10">
				<h3 class="text-xl font-bold text-white mb-6">Account Information</h3>
				<div class="space-y-5">
					<div class="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
						<span class="text-gray-300 font-medium">User ID</span>
						<span class="text-white font-mono text-sm">{$page.data.user?.id}</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
						<span class="text-gray-300 font-medium">Role</span>
						<span class="text-white capitalize font-semibold">{$page.data.user?.role || 'user'}</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
						<span class="text-gray-300 font-medium">Account Status</span>
						<span class="text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">Active</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
						<span class="text-gray-300 font-medium">Member Since</span>
						<span class="text-white">
							{$page.data.user?.createdAt ? new Date($page.data.user.createdAt).toLocaleDateString() : 'Unknown'}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="mt-8 flex justify-between">
			<a
				href="/"
				class="px-6 py-3 border border-gray-600 text-sm font-semibold rounded-xl text-gray-300 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
			>
				Back to Home
			</a>
			
			<form method="POST" action="/logout" class="inline">
				<button
					type="submit"
					class="px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
				>
					Sign Out
				</button>
			</form>
		</div>
	</div>
</div>