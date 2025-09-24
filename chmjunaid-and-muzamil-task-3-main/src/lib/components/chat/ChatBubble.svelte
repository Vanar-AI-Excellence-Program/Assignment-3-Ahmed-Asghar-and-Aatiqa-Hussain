<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let message: {
    id: number;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    versionNumber: number;
    isEdited: boolean;
    parentId?: number;
    versionGroupId: string;
    isActive: boolean;
    isStreaming?: boolean;
    citations?: any[];
  };
  
  export let isEditing = false;
  export let editingContent = '';
  export let onEdit: () => void;
  export let onSave: () => void;
  export let onCancel: () => void;
  
  const dispatch = createEventDispatcher();
  
  let textareaElement: HTMLTextAreaElement;
  let showActions = false;
  let copySuccess = false;
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSave();
    } else if (event.key === 'Escape') {
      onCancel();
    }
  }
  
  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message.content);
      copySuccess = true;
      setTimeout(() => copySuccess = false, 2000);
      dispatch('copy', { messageId: message.id });
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }
  
  function editMessage() {
    onEdit();
  }
  
  function regenerateMessage() {
    dispatch('regenerate', { messageId: message.id });
  }

  function switchVersion(direction: 'prev' | 'next') {
    dispatch('switchVersion', { messageId: message.id, direction });
  }
  
  function formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
</script>

<div 
  class="group mb-6 animate-fade-in"
  role="article"
  aria-label="{message.type === 'user' ? 'Your message' : 'AI response'}"
>
  {#if message.type === 'user'}
    <!-- User Message - Right Aligned -->
    <div class="flex justify-end">
      <div class="max-w-xs md:max-w-md lg:max-w-lg">
        {#if isEditing}
          <!-- Edit Mode -->
          <div class="bg-gray-700/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg ">
            <textarea
              bind:this={textareaElement}
              bind:value={editingContent}
              id="edit-message-{message.id}"
              on:keydown={handleKeydown}
              class="w-full p-3 bg-gray-600/50 text-white placeholder-gray-400 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-200"
              rows="3"
              placeholder="Edit your message..."
              aria-describedby="edit-help-{message.id}"
            ></textarea>
            <div id="edit-help-{message.id}" class="text-xs text-gray-400 mt-2">
              Press Enter to save, Escape to cancel
            </div>
            <div class="flex space-x-2 mt-3">
              <button
                on:click={onSave}
                class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                aria-label="Save edited message"
              >
                Save
              </button>
              <button
                on:click={onCancel}
                class="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                aria-label="Cancel editing"
              >
                Cancel
              </button>
            </div>
          </div>
        {:else}
          <!-- User Bubble -->
          <div class="relative">
            <!-- Message Bubble -->
            <div 
              class="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              on:mouseenter={() => showActions = true}
              on:mouseleave={() => showActions = false}
              role="group"
            >
              <div class="text-sm leading-relaxed">
                {message.content}
              </div>
            </div>
            
            <!-- Timestamp and Actions Below Bubble -->
            <div class="flex items-center justify-end mt-2 px-1 space-x-2">
              <div class="flex items-center space-x-1">
                <button
                  on:click={copyMessage}
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  aria-label="Copy message"
                  title="Copy message"
                >
                  {#if copySuccess}
                    <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  {/if}
                </button>
                
                <button
                  on:click={editMessage}
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  aria-label="Edit message"
                  title="Edit message"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
              </div>
              <!-- Version switcher: previous/next for user messages -->
              <div class="flex items-center space-x-1">
                <button
                  on:click={() => switchVersion('prev')}
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  aria-label="Previous version"
                  title="Previous version"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button
                  on:click={() => switchVersion('next')}
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  aria-label="Next version"
                  title="Next version"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
              
              <span class="text-xs text-gray-400">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- AI Message - Left Aligned -->
    <div class="flex justify-start">
      <div class="max-w-4xl">
        {#if isEditing}
          <!-- Edit Mode -->
          <div class="bg-gray-700/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg ">
            <textarea
              bind:this={textareaElement}
              bind:value={editingContent}
              id="edit-message-{message.id}"
              on:keydown={handleKeydown}
              class="w-full p-3 bg-gray-600/50 text-white placeholder-gray-400 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              rows="3"
              placeholder="Edit your message..."
              aria-describedby="edit-help-{message.id}"
            ></textarea>
            <div id="edit-help-{message.id}" class="text-xs text-gray-400 mt-2">
              Press Enter to save, Escape to cancel
            </div>
            <div class="flex space-x-2 mt-3">
              <button
                on:click={onSave}
                class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                aria-label="Save edited message"
              >
                Save
              </button>
              <button
                on:click={onCancel}
                class="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                aria-label="Cancel editing"
              >
                Cancel
              </button>
            </div>
          </div>
        {:else}
          <!-- AI Bubble -->
          <div class="relative">
            <!-- Message Bubble -->
            <div 
              class="bg-gray-800/90 backdrop-blur-sm text-gray-100 rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              on:mouseenter={() => showActions = true}
              on:mouseleave={() => showActions = false}
              role="group"
            >
              <!-- Message Content -->
              <div class="prose prose-invert max-w-none text-sm leading-relaxed">
                <slot {message} />
                {#if message.isStreaming}
                  <span class="typing-cursor">|</span>
                {/if}
              </div>
            </div>
            
            <!-- Timestamp and Actions Below Bubble -->
            <div class="flex items-center justify-between mt-2 px-1">
              <span class="text-xs text-gray-400">
                {formatTimestamp(message.timestamp)}
              </span>
              
              <div class="flex items-center space-x-1">
                <button
                  on:click={copyMessage}
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  aria-label="Copy message"
                  title="Copy message"
                >
                  {#if copySuccess}
                    <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  {/if}
                </button>
                
                <button
                  on:click={regenerateMessage}
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  aria-label="Regenerate response"
                  title="Regenerate response"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>

                <!-- Version switcher: previous/next (visible on all screens) -->
                <div class="flex items-center space-x-1">
                  <button
                    on:click={() => switchVersion('prev')}
                    class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                    aria-label="Previous version"
                    title="Previous version"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </button>
                  <button
                    on:click={() => switchVersion('next')}
                    class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                    aria-label="Next version"
                    title="Next version"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Animation for message entry */
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.4s ease-out;
  }
  
  /* Typing cursor animation */
  @keyframes blink {
    0%, 50% {
      opacity: 1;
    }
    51%, 100% {
      opacity: 0;
    }
  }
  
  .typing-cursor {
    display: inline-block;
    animation: blink 1.2s infinite;
    font-weight: normal;
    color: #10b981; /* Green color to indicate active streaming */
    margin-left: 2px;
  }
  
  /* Enhanced prose styling for better readability */
  :global(.prose) {
    color: inherit;
  }
  
  :global(.prose p) {
    margin: 0.5em 0;
  }
  
  :global(.prose code) {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 0.375rem;
    font-size: 0.875em;
  }
  
  :global(.prose pre) {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.75rem;
    padding: 1rem;
    overflow-x: auto;
    margin: 0.5rem 0;
  }
  
  :global(.prose blockquote) {
    border-left: 4px solid rgba(255, 255, 255, 0.2);
    padding-left: 1rem;
    margin: 0.5rem 0;
    font-style: italic;
  }
  
  /* Table styles for markdown tables */
  :global(.prose table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5rem 0;
  }
  
  :global(.prose th) {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  :global(.prose td) {
    padding: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  :global(.prose tr:hover) {
    background: rgba(255, 255, 255, 0.05);
  }
</style>
