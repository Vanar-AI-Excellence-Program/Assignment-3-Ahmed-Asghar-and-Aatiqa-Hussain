<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let isOpen = false;
  export let title = '';
  export let description = '';
  export let confirmText = 'Confirm';
  export let cancelText = 'Cancel';
  export let confirmVariant: 'primary' | 'danger' = 'primary';
  export let loading = false;
  
  const dispatch = createEventDispatcher();
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      dispatch('close');
    }
  }
  
  function handleConfirm() {
    dispatch('confirm');
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !loading) {
      dispatch('close');
    }
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div class="card max-w-md w-full p-6 animate-scale-in">
      <!-- Header -->
      <div class="mb-6">
        <h2 id="modal-title" class="text-xl font-bold text-white mb-2">
          {title}
        </h2>
        {#if description}
          <p class="text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        {/if}
      </div>
      
      <!-- Content Slot -->
      <div class="mb-6">
        <slot />
      </div>
      
      <!-- Actions -->
      <div class="flex items-center justify-end space-x-3">
        <button
          class="btn-ghost text-sm px-4 py-2"
          disabled={loading}
          on:click={handleCancel}
        >
          {cancelText}
        </button>
        <button
          class="btn-{confirmVariant} text-sm px-4 py-2 flex items-center"
          disabled={loading}
          on:click={handleConfirm}
        >
          {#if loading}
            <div class="loading-dots mr-2">
              <div class="loading-dot"></div>
              <div class="loading-dot"></div>
              <div class="loading-dot"></div>
            </div>
          {/if}
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
