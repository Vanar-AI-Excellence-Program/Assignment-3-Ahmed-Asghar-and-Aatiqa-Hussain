<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let conversations: Array<{
    id: number;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  
  export let currentConversationId: number | null = null;
  export let showSidebar = false;
  
  const dispatch = createEventDispatcher();
  
  let searchQuery = '';
  let showSearch = false;
  
  // Filter conversations based on search query
  $: filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group conversations by date
  $: groupedConversations = (() => {
    const groups = {
      today: [],
      yesterday: [],
      earlier: []
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt);
      const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());
      
      if (convDay.getTime() === today.getTime()) {
        groups.today.push(conv);
      } else if (convDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conv);
      } else {
        groups.earlier.push(conv);
      }
    });
    
    return groups;
  })();
  
  function createNewConversation() {
    dispatch('create');
  }
  
  function selectConversation(id: number) {
    dispatch('select', { id });
  }
  
  function deleteConversation(id: number) {
    dispatch('delete', { id });
  }
  
  function toggleSidebar() {
    dispatch('toggle');
  }
  
  function toggleSearch() {
    showSearch = !showSearch;
    if (!showSearch) {
      searchQuery = '';
    }
  }
  
  function formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }
  
  function getConversationIcon(title: string): string {
    const firstChar = title.charAt(0).toLowerCase();
    if (firstChar >= 'a' && firstChar <= 'z') return firstChar.toUpperCase();
    return '💬';
  }
</script>

<!-- Mobile Sidebar Toggle -->
<button
  on:click={toggleSidebar}
  class="md:hidden fixed top-4 left-4 z-50 relative p-3 bg-gray-800/90 backdrop-blur-sm text-gray-400 hover:text-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg group
         bg-gray-800/90 hover:bg-gray-700/90
         border border-gray-600/30 hover:border-gray-500/50
         shadow-[0_6px_18px_rgba(0,0,0,0.5),0_3px_6px_rgba(0,0,0,0.2)]
         hover:shadow-[0_8px_24px_rgba(0,0,0,0.7),0_4px_8px_rgba(0,0,0,0.3)]
         active:shadow-[0_3px_12px_rgba(0,0,0,0.6),0_1px_3px_rgba(0,0,0,0.2)]
         hover:transform hover:scale-105 hover:-translate-y-0.5
         active:transform active:scale-95 active:translate-y-0
         before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-gray-600/20 before:to-gray-700/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
  aria-label="Toggle conversation sidebar"
  aria-expanded={showSidebar}
  aria-controls="chat-sidebar"
>
  <svg class="w-5 h-5 relative z-10 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
</button>

<!-- Sidebar Overlay for Mobile -->
{#if showSidebar}
  <div
    class="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
    on:click={toggleSidebar}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSidebar();
      }
    }}
    role="button"
    tabindex="0"
    aria-label="Close sidebar"
  ></div>
{/if}

<!-- Sidebar -->
<aside
  id="chat-sidebar"
  class="w-80 bg-gray-900/95 backdrop-blur-md border-r border-gray-800/50 flex flex-col shadow-2xl animate-slideInLeft {showSidebar ? 'fixed md:relative inset-y-0 left-0 z-50' : 'hidden md:flex'}"
  aria-label="Conversations"
>
  <!-- Sidebar Header -->
  <header class="p-2">
    <div class="flex flex-col">
      <div class="flex items-center justify-between mb-2 mt-2">
        <h2 class="text-xl font-bold text-white">Conversations</h2>
        <!-- New Chat Button -->
        <button
          on:click={createNewConversation}
          class="relative p-2 text-orange-400 hover:text-orange-300 rounded-lg transition-all duration-300 focus:outline-none group
                 hover:bg-orange-500/10
                 shadow-[0_2px_6px_rgba(249,115,22,0.2),0_1px_2px_rgba(0,0,0,0.1)]
                 hover:shadow-[0_4px_12px_rgba(249,115,22,0.3),0_2px_4px_rgba(0,0,0,0.2)]
                 active:shadow-[0_1px_3px_rgba(249,115,22,0.2),0_0.5px_1px_rgba(0,0,0,0.1)]
                 hover:transform hover:scale-105 hover:-translate-y-0.5
                 active:transform active:scale-95 active:translate-y-0
                 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-orange-500/20 before:to-red-500/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
          aria-label="Create new conversation"
          title="New Chat"
        >
          <svg class="w-4 h-4 relative z-10 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Search Bar -->
    <div class="relative px-4 pb-4">
      <input
        bind:value={searchQuery}
        type="text"
        placeholder="Search conversations..."
        class="w-full px-4 py-2 bg-gray-800/50 text-white placeholder-gray-400 rounded-xl focus:outline-none transition-all duration-200"
      />
    </div>
  </header>

  <!-- Conversations List -->
  <div class="flex-1 overflow-y-auto p-4 space-y-6" aria-label="Conversation list">
    {#if filteredConversations.length === 0}
      <div class="text-center py-12 text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <p class="text-lg font-medium">
          {searchQuery ? 'No conversations found' : 'No conversations yet'}
        </p>
        <p class="text-sm mt-2 text-gray-500">
          {searchQuery ? 'Try a different search term' : 'Start a new chat to begin!'}
        </p>
      </div>
    {:else}
      <!-- Today -->
      {#if groupedConversations.today.length > 0}
        <div class="space-y-2">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Today</h3>
          {#each groupedConversations.today as conversation}
            <div 
              class="group relative p-3 rounded-xl transition-all duration-200 cursor-pointer {currentConversationId === conversation.id ? 'bg-orange-500/20 border border-orange-500/30 shadow-lg' : 'hover:bg-gray-800/60 hover:shadow-md'}"
              role="button"
              tabindex="0"
              on:click={() => selectConversation(conversation.id)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectConversation(conversation.id);
                }
              }}
              aria-label="Load conversation: {conversation.title}"
              aria-current={currentConversationId === conversation.id ? 'true' : 'false'}
            >
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {getConversationIcon(conversation.title)}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-white truncate group-hover:text-orange-400 transition-colors">
                    {conversation.title}
                  </h4>
                  <p class="text-xs text-gray-400 mt-1">
                    {formatDate(conversation.updatedAt)}
                  </p>
                </div>
                
                <!-- Delete Button -->
                <button
                  on:click|stopPropagation={() => deleteConversation(conversation.id)}
                  class="relative p-2 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300 focus:outline-none ml-2 group
                         hover:bg-red-500/20
                         shadow-[0_2px_6px_rgba(239,68,68,0.2),0_1px_2px_rgba(0,0,0,0.1)]
                         hover:shadow-[0_4px_12px_rgba(239,68,68,0.3),0_2px_4px_rgba(0,0,0,0.2)]
                         active:shadow-[0_1px_3px_rgba(239,68,68,0.2),0_0.5px_1px_rgba(0,0,0,0.1)]
                         hover:transform hover:scale-105 hover:-translate-y-0.5
                         active:transform active:scale-95 active:translate-y-0
                         before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-red-500/20 before:to-red-600/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                  aria-label="Delete conversation: {conversation.title}"
                  title="Delete conversation"
                >
                  <svg class="w-4 h-4 relative z-10 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
      
      <!-- Yesterday -->
      {#if groupedConversations.yesterday.length > 0}
        <div class="space-y-2">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Yesterday</h3>
          {#each groupedConversations.yesterday as conversation}
            <div 
              class="group relative p-3 rounded-xl transition-all duration-200 cursor-pointer {currentConversationId === conversation.id ? 'bg-orange-500/20 border border-orange-500/30 shadow-lg' : 'hover:bg-gray-800/60 hover:shadow-md'}"
              role="button"
              tabindex="0"
              on:click={() => selectConversation(conversation.id)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectConversation(conversation.id);
                }
              }}
              aria-label="Load conversation: {conversation.title}"
              aria-current={currentConversationId === conversation.id ? 'true' : 'false'}
            >
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {getConversationIcon(conversation.title)}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                    {conversation.title}
                  </h4>
                  <p class="text-xs text-gray-400 mt-1">
                    {formatDate(conversation.updatedAt)}
                  </p>
                </div>
                
                <!-- Delete Button -->
                <button
                  on:click|stopPropagation={() => deleteConversation(conversation.id)}
                  class="relative p-2 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300 focus:outline-none ml-2 group
                         hover:bg-red-500/20
                         shadow-[0_2px_6px_rgba(239,68,68,0.2),0_1px_2px_rgba(0,0,0,0.1)]
                         hover:shadow-[0_4px_12px_rgba(239,68,68,0.3),0_2px_4px_rgba(0,0,0,0.2)]
                         active:shadow-[0_1px_3px_rgba(239,68,68,0.2),0_0.5px_1px_rgba(0,0,0,0.1)]
                         hover:transform hover:scale-105 hover:-translate-y-0.5
                         active:transform active:scale-95 active:translate-y-0
                         before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-red-500/20 before:to-red-600/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                  aria-label="Delete conversation: {conversation.title}"
                  title="Delete conversation"
                >
                  <svg class="w-4 h-4 relative z-10 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
      
      <!-- Earlier -->
      {#if groupedConversations.earlier.length > 0}
        <div class="space-y-2">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Earlier</h3>
          {#each groupedConversations.earlier as conversation}
            <div 
              class="group relative p-3 rounded-xl transition-all duration-200 cursor-pointer {currentConversationId === conversation.id ? 'bg-orange-500/20 border border-orange-500/30 shadow-lg' : 'hover:bg-gray-800/60 hover:shadow-md'}"
              role="button"
              tabindex="0"
              on:click={() => selectConversation(conversation.id)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectConversation(conversation.id);
                }
              }}
              aria-label="Load conversation: {conversation.title}"
              aria-current={currentConversationId === conversation.id ? 'true' : 'false'}
            >
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {getConversationIcon(conversation.title)}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-white truncate group-hover:text-gray-300 transition-colors">
                    {conversation.title}
                  </h4>
                  <p class="text-xs text-gray-400 mt-1">
                    {formatDate(conversation.updatedAt)}
                  </p>
                </div>
                
                <!-- Delete Button -->
                <button
                  on:click|stopPropagation={() => deleteConversation(conversation.id)}
                  class="relative p-2 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300 focus:outline-none ml-2 group
                         hover:bg-red-500/20
                         shadow-[0_2px_6px_rgba(239,68,68,0.2),0_1px_2px_rgba(0,0,0,0.1)]
                         hover:shadow-[0_4px_12px_rgba(239,68,68,0.3),0_2px_4px_rgba(0,0,0,0.2)]
                         active:shadow-[0_1px_3px_rgba(239,68,68,0.2),0_0.5px_1px_rgba(0,0,0,0.1)]
                         hover:transform hover:scale-105 hover:-translate-y-0.5
                         active:transform active:scale-95 active:translate-y-0
                         before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-red-500/20 before:to-red-600/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                  aria-label="Delete conversation: {conversation.title}"
                  title="Delete conversation"
                >
                  <svg class="w-4 h-4 relative z-10 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</aside>

<style>
  /* Custom scrollbar for sidebar */
  .flex-1.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .flex-1.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }

  .flex-1.overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 3px;
  }

  .flex-1.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.5);
  }
  
  /* Focus styles for better accessibility */
  [role="button"]:focus-visible {
    outline: none;
  }
  
  /* Mobile sidebar animation */
  @media (max-width: 768px) {
    aside {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    aside.fixed {
      transform: translateX(0);
    }
  }

  /* Sidebar entrance animation */
  .animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Conversation item hover animation */
  .group:hover .w-8.h-8 {
    animation: bounceIn 0.4s ease-out;
  }

  @keyframes bounceIn {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Search bar focus animation */
  input:focus {
    animation: inputGlow 0.3s ease-out;
  }

  @keyframes inputGlow {
    0% {
      box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4);
    }
    100% {
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
    }
  }
</style>
