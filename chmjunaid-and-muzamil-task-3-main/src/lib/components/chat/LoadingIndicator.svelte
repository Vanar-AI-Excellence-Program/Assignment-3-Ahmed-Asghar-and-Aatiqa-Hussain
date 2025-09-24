<script lang="ts">
  export let message = 'AI is thinking...';
  export let isStreaming = false;
  export let streamedContent = '';
</script>

<div 
  class="mb-6 animate-fade-in"
  role="status"
  aria-live="polite"
  aria-label="AI is processing your request"
>
  <div class="flex justify-start">
    <div class="max-w-4xl">
      <div class="relative">
        <!-- AI Bubble -->
        <div class="bg-gray-800/90 backdrop-blur-sm text-gray-100 rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
          <!-- Content Area -->
          <div>
            {#if isStreaming && streamedContent}
              <!-- Streaming Content -->
              <div class="prose prose-invert max-w-none text-sm leading-relaxed">
                <div class="text-gray-100">
                  {streamedContent}<span class="animate-pulse">|</span>
                </div>
              </div>
            {:else}
              <!-- Typing Animation -->
              <div class="flex items-center space-x-3">
                <div class="flex space-x-1" aria-hidden="true">
                  <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                  <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                </div>
                
                <span class="text-gray-300 font-medium text-sm">{message}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
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
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .animate-bounce {
    animation: bounce 1.4s ease-in-out infinite both;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
  
  .animate-pulse {
    animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
