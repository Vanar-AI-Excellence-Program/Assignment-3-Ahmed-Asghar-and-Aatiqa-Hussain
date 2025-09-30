<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ScrollArea from '$lib/components/ScrollArea.svelte';
	import { chatStore } from '$lib/stores/chatStore';

	export let isOpen: boolean;
	export let onToggle: () => void;
	export let handleNewChat: () => void;
	export let currentChatId: string;
	export let handleSelectChat: (chatId: string) => void;

	// Use the chat store
	$: conversations = $chatStore.conversations;
	$: currentChatId = $chatStore.currentChatId || '';

	// Remove unused exports

	// Load conversations on mount
	onMount(() => {
		chatStore.loadConversations();
	});

	const userInfo = {
		name: $page.data.user?.name || "User",
		email: $page.data.user?.email || "user@example.com",
		image: $page.data.user?.image || null
	};


	const formatChatTime = (date: Date | string) => {
		const now = new Date();
		const chatDate = typeof date === 'string' ? new Date(date) : date;
		const diffInHours = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60));
		
		if (diffInHours < 1) return "Just now";
		if (diffInHours < 24) return `${diffInHours}h ago`;
		if (diffInHours < 48) return "Yesterday";
		return `${Math.floor(diffInHours / 24)}d ago`;
	};

	let showUserDropdown = false;
	let showChatDropdown: string | null = null;
	let showRenameModal = false;
	let renameChatId: string | null = null;
	let newChatTitle = '';

	const handleClickOutside = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		if (!target.closest('.dropdown')) {
			showUserDropdown = false;
			showChatDropdown = null;
		}
	};


	const handleBackToDashboard = () => {
		goto('/');
	};

	const handleRenameChat = (chatId: string) => {
		const conversation = conversations.find(c => c.id === chatId);
		if (conversation) {
			renameChatId = chatId;
			newChatTitle = conversation.title;
			showRenameModal = true;
			showChatDropdown = null;
		}
	};

	const handleRenameSubmit = async () => {
		if (!renameChatId || !newChatTitle.trim()) return;
		
		const currentTitle = conversations.find(c => c.id === renameChatId)?.title;
		if (newChatTitle.trim() === currentTitle) {
			handleRenameCancel();
			return;
		}

		try {
			await chatStore.renameConversation(renameChatId, newChatTitle.trim());
			handleRenameCancel();
		} catch (error) {
			console.error('Error renaming conversation:', error);
			alert('Failed to rename conversation. Please try again.');
		}
	};

	const handleRenameCancel = () => {
		showRenameModal = false;
		renameChatId = null;
		newChatTitle = '';
	};

	const handleDeleteChat = async (chatId: string) => {
		const confirmed = confirm('Are you sure you want to delete this conversation? This action cannot be undone and will remove all messages in this chat.');
		
		if (confirmed) {
			try {
				await chatStore.deleteConversation(chatId);
				showChatDropdown = null;
			} catch (error) {
				console.error('Error deleting conversation:', error);
				alert('Failed to delete conversation. Please try again.');
			}
		}
	};
</script>

<svelte:window on:click={handleClickOutside} />

{#if isOpen}
	<div class="w-80 h-full bg-gradient-to-b from-gray-900/95 via-black/90 to-gray-900/95 border-r border-gray-700/50 flex flex-col relative overflow-hidden">
		<!-- Background texture overlay -->
		<div class="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-transparent to-purple-500/3"></div>
		<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/8 to-transparent rounded-full blur-xl"></div>
		<div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/8 to-transparent rounded-full blur-lg"></div>
		
		<!-- Header Section -->
		<div class="relative z-10 p-4 border-b border-gray-700/50">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-white">Conversations</h2>
				<button
					on:click={onToggle}
					class="text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center p-2 rounded-lg transition-colors"
					aria-label="Close sidebar"
				>
					<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Back to Home Button -->
			<button
				on:click={handleBackToDashboard}
				class="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-600/80 via-indigo-600/70 to-purple-600/80 hover:from-blue-500/80 hover:via-indigo-500/70 hover:to-purple-500/80 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-0.5 mb-4"
			>
				<span class="font-medium">Back to Home</span>
			</button>
		</div>

		<!-- New Chat Button -->
		<div class="relative z-10 p-4">
			<button
				on:click={handleNewChat}
				class="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-600/80 via-indigo-600/70 to-purple-600/80 hover:from-blue-500/80 hover:via-indigo-500/70 hover:to-purple-500/80 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-0.5"
			>
				<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				<span class="font-medium">New Chat</span>
			</button>
		</div>

		<!-- Chat List -->
		<div class="relative z-10 flex-1 overflow-hidden">
			<ScrollArea class="h-full sidebar-scroll-area">
				<div class="p-4 space-y-2">
					{#if conversations.length === 0}
						<!-- Empty State -->
						<div class="flex flex-col items-center justify-center py-8 text-center">
							<div class="w-16 h-16 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full flex items-center justify-center mb-4">
								<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
								</svg>
							</div>
							<h3 class="text-lg font-medium text-white mb-2">No conversations yet</h3>
							<p class="text-sm text-gray-400 mb-4">Start a new chat to begin your conversation with ShieldBot</p>
							<button
								on:click={handleNewChat}
								class="px-4 py-2 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500/80 hover:to-indigo-500/80 text-white rounded-lg transition-all duration-300 text-sm font-medium"
							>
								Start New Chat
							</button>
						</div>
					{:else}
						{#each conversations as conversation}
							<div class="relative group">
								<div
									on:click={() => handleSelectChat(conversation.id)}
									on:keydown={(e) => e.key === 'Enter' && handleSelectChat(conversation.id)}
									class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left cursor-pointer {conversation.id === currentChatId ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-purple-600/20 border border-blue-500/30' : 'hover:bg-gradient-to-r hover:from-gray-800/60 hover:via-gray-700/50 hover:to-gray-800/60'}"
									role="button"
									tabindex="0"
									aria-label="Select conversation: {conversation.title}"
								>
									<!-- Chat Icon -->
									<div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
										<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
										</svg>
									</div>
									
									<!-- Chat Info -->
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-white truncate">{conversation.title}</p>
										<p class="text-xs text-gray-400">{formatChatTime(conversation.updatedAt)}</p>
									</div>

									<!-- Three Dots Menu -->
									<div class="relative dropdown">
										<button
											on:click|stopPropagation={() => showChatDropdown = showChatDropdown === conversation.id ? null : conversation.id}
											class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white hover:bg-gray-700/50 flex items-center justify-center p-1 rounded-lg transition-all duration-200"
											aria-label="Chat options"
											type="button"
										>
											<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
											</svg>
										</button>
										
										{#if showChatDropdown === conversation.id}
											<div class="absolute right-0 top-full mt-1 w-32 bg-black border border-gray-600 rounded-lg shadow-lg z-50">
												<button
													on:click={() => handleRenameChat(conversation.id)}
													class="w-full text-left px-3 py-2 text-white hover:bg-gray-800 transition-colors rounded-lg text-sm"
												>
													Rename
												</button>
												<button
													on:click={() => handleDeleteChat(conversation.id)}
													class="w-full text-left px-3 py-2 text-red-400 hover:bg-red-900/20 transition-colors rounded-lg text-sm"
												>
													Delete
												</button>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</ScrollArea>
		</div>

		<!-- User Profile Section -->
		<div class="relative z-10 p-4 border-t border-gray-700/50">
			<!-- Dark background with texture -->
			<div class="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-black/90 to-gray-900/95"></div>
			<div class="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-transparent to-purple-500/3"></div>
			<div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/8 to-transparent rounded-full blur-lg"></div>
			<div class="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-500/8 to-transparent rounded-full blur-md"></div>
			
			<div class="relative z-10 flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer w-full text-left">
				<!-- User Profile Image -->
				<div class="flex-shrink-0">
                {#if userInfo.image}
                    <img 
                        src={userInfo.image} 
                        alt={userInfo.name}
                        referrerpolicy="no-referrer"
                        class="w-8 h-8 rounded-full object-cover border border-gray-500/50"
                    />
					{:else}
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-gray-500/50">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
					{/if}
				</div>
				
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-white truncate">{userInfo.name}</p>
					<p class="text-xs text-gray-200 truncate">{userInfo.email}</p>
				</div>
				
				<div class="relative dropdown">
					<button
						on:click={() => showUserDropdown = !showUserDropdown}
						class="size-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
						aria-label="User options"
					>
						<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
						</svg>
					</button>
					
					{#if showUserDropdown}
						<div class="absolute right-0 bottom-full mb-1 w-36 bg-black border border-gray-600 rounded-lg shadow-lg z-50">
							<a href="/dashboard" class="block w-full text-left px-3 py-2 text-white hover:bg-gray-800 transition-colors rounded-lg text-sm">
								Dashboard
							</a>
							<a href="/profile" class="block w-full text-left px-3 py-2 text-white hover:bg-gray-800 transition-colors rounded-lg text-sm">
								Profile
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Rename Chat Modal -->
	{#if showRenameModal}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-600 shadow-2xl">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
						<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-white">Rename Chat</h3>
						<p class="text-sm text-gray-400">Enter a new title for this conversation</p>
					</div>
				</div>
				
				<div class="space-y-4">
					<div>
						<label for="chat-title" class="block text-sm font-medium text-gray-300 mb-2">
							Chat Title
						</label>
						<input
							id="chat-title"
							type="text"
							bind:value={newChatTitle}
							class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Enter chat title..."
							on:keydown={(e) => e.key === 'Enter' && handleRenameSubmit()}
							on:keydown={(e) => e.key === 'Escape' && handleRenameCancel()}
						/>
					</div>
					
					<div class="flex gap-3 pt-2">
						<button
							on:click={handleRenameCancel}
							class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
						>
							Cancel
						</button>
						<button
							on:click={handleRenameSubmit}
							disabled={!newChatTitle.trim()}
							class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
						>
							Rename
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}