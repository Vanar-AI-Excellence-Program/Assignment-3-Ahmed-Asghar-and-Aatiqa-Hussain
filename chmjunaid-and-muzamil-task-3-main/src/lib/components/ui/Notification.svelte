<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let message: string = '';
  export let duration: number = 3000;
  export let show: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let timeoutId: ReturnType<typeof setTimeout>;
  
  $: if (show && duration > 0) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      show = false;
      dispatch('close');
    }, duration);
  }
  
  function handleClose() {
    show = false;
    dispatch('close');
  }
  
  const icons = {
    success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`,
    error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`,
    warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>`,
    info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`
  };
  
  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  };
</script>

{#if show}
  <div 
    class="fixed top-4 right-4 z-50 max-w-sm w-full"
    transition:fly={{ y: -50, duration: 300 }}
  >
    <div class="flex items-center p-4 rounded-xl border {styles[type]} backdrop-blur-sm shadow-2xl">
      <div class="flex-shrink-0 mr-3">
        {@html icons[type]}
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium">{message}</p>
      </div>
      <button
        on:click={handleClose}
        class="flex-shrink-0 ml-3 text-gray-400 hover:text-white transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  </div>
{/if}
