<script lang="ts">
  import { onMount } from 'svelte';
  
  export let type: string = 'text';
  export let value: string = '';
  export let placeholder: string = '';
  export let label: string = '';
  export let error: string = '';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let id: string = '';
  
  let inputId: string;
  
  onMount(() => {
    // Generate unique ID if none provided
    if (!id) {
      inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
    } else {
      inputId = id;
    }
  });
  
  const baseClasses = 'block w-full rounded-lg border shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 px-4 py-3';
  const normalClasses = 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500';
  const errorClasses = 'border-red-500 focus:border-red-500 focus:ring-red-500';
  
  $: inputClasses = `${baseClasses} ${error ? errorClasses : normalClasses}`;
</script>

<div class="space-y-2">
  {#if label}
    <label for={inputId} class="block text-sm font-semibold text-gray-300">
      {label}
      {#if required}
        <span class="text-red-400">*</span>
      {/if}
    </label>
  {/if}
  
  <input
    id={inputId}
    {type}
    {placeholder}
    bind:value
    {required}
    {disabled}
    class={inputClasses}
    on:input
    on:blur
  />
  
  {#if error}
    <p class="text-sm text-red-400" id={`${inputId}-error`} role="alert">
      {error}
    </p>
  {/if}
</div>
