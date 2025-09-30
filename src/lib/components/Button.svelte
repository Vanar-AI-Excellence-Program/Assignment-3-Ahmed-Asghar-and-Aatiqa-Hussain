<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let loading = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let fullWidth = false;
	
	const dispatch = createEventDispatcher();
	
	// Button variants
	const variants = {
		primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-transparent',
		secondary: 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600',
		outline: 'bg-transparent border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30',
		ghost: 'bg-transparent border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
		danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent'
	};
	
	// Button sizes
	const sizes = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};
	
	// Base classes
	const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
	
	// Dynamic classes
	$: classes = [
		baseClasses,
		variants[variant],
		sizes[size],
		fullWidth ? 'w-full' : '',
		loading ? 'cursor-wait' : ''
	].filter(Boolean).join(' ');
	
	function handleClick(event: MouseEvent) {
		if (!disabled && !loading) {
			dispatch('click', event);
		}
	}
</script>

<button
	{type}
	{disabled}
	class={classes}
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick(e as any)}
>
	{#if loading}
		<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
		Loading...
	{:else}
		<slot />
	{/if}
</button>
