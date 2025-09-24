<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let value = '';
  export let placeholder = 'Type a message...';
  export let disabled = false;
  export let isLoading = false;
  export let onSend: () => void;
  export let onDocumentUpload: () => void;
  
  const dispatch = createEventDispatcher();
  
  let inputElement: HTMLTextAreaElement;
  let inputId = `chat-input-${Math.random().toString(36).substr(2, 9)}`;
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  }
  
  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    value = target.value;
    
    // Auto-resize textarea
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 200) + 'px';
    
    dispatch('input', { value });
  }
  
  function handleSend() {
    if (!disabled && value.trim()) {
      onSend();
    }
  }
  
  function handleDocumentUpload() {
    onDocumentUpload();
  }
</script>

<div class="bg-gray-900/95 backdrop-blur-md p-6 shadow-2xl">
  <div class="max-w-5xl mx-auto">
    <div class="relative">
      <!-- Main Input Container -->
      <div class="flex items-end space-x-4 bg-gradient-to-r from-orange-500/40 to-red-500/40 backdrop-blur-sm rounded-full p-4 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 border border-orange-500/20">
        <!-- Input Field -->
        <div class="flex-1 relative">
          <textarea
            bind:this={inputElement}
            bind:value
            {placeholder}
            {disabled}
            id={inputId}
            on:input={handleInput}
            on:keydown={handleKeydown}
            class="w-full bg-transparent border-none text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-0 text-base leading-relaxed py-2 px-0"
            rows="1"
            style="min-height: 24px; max-height: 200px;"
            aria-describedby="input-help"
            aria-label="Type your message to the AI assistant"
          ></textarea>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center space-x-2">
          <!-- Document Upload Button -->
          <button
            on:click={handleDocumentUpload}
            disabled={disabled}
            class="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group/upload"
            aria-label="Upload documents for context"
            title="Upload documents for RAG"
          >
            <svg class="w-5 h-5 transition-transform group-hover/upload:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </button>
          
          <!-- Send Button -->
          <button
            on:click={handleSend}
            disabled={disabled || !value.trim() || isLoading}
            class="p-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 group/send"
            aria-label="Send message"
            title="Send message"
          >
            {#if isLoading}
              <!-- Loading Spinner -->
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <!-- Send Icon -->
              <svg class="w-5 h-5 transition-transform group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Auto-resize textarea */
  textarea {
    min-height: 24px;
    max-height: 200px;
    overflow-y: auto;
  }
  
  /* Custom scrollbar for textarea */
  textarea::-webkit-scrollbar {
    width: 4px;
  }
  
  textarea::-webkit-scrollbar-track {
    background: transparent;
  }
  
  textarea::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 2px;
  }
  
  textarea::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.5);
  }
  
  /* Focus styles for better accessibility */
  textarea:focus-visible,
  button:focus-visible {
    outline: none;
  }
  
  /* Disabled state styles */
  button:disabled {
    cursor: not-allowed;
  }
  
  /* Enhanced hover effects */
  button:not(:disabled):hover {
    transform: translateY(-1px);
  }
  
  /* Active state */
  button:not(:disabled):active {
    transform: translateY(0);
  }
  
  /* Smooth transitions for all elements */
  * {
    transition: all 0.2s ease;
  }
</style>
