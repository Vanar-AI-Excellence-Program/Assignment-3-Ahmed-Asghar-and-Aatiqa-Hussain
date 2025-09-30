<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
	export let label = '';
	export let placeholder = '';
	export let value = '';
	export let required = false;
	export let disabled = false;
	export let error = '';
	export let helpText = '';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	
	const dispatch = createEventDispatcher();
	
	// Input sizes
	const sizes = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-3 py-3 text-sm',
		lg: 'px-4 py-4 text-base'
	};
	
	// Base classes
	const baseClasses = 'appearance-none relative block w-full border placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors';
	
	// Dynamic classes
	$: classes = [
		baseClasses,
		sizes[size],
		error 
			? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
			: 'border-slate-300 dark:border-slate-600',
		disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-700' : ''
	].filter(Boolean).join(' ');
	
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		dispatch('input', { value });
	}
	
	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		dispatch('change', { value });
	}
</script>

<div class="space-y-2">
	{#if label}
		<label for="input-{label}" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
			{label}
			{#if required}
				<span class="text-red-500 ml-1">*</span>
			{/if}
		</label>
	{/if}
	
	<input
		id="input-{label}"
		{type}
		{placeholder}
		bind:value
		{required}
		{disabled}
		class={classes}
		on:input={handleInput}
		on:change={handleChange}
		on:blur={() => dispatch('blur')}
		on:focus={() => dispatch('focus')}
	/>
	
	{#if error}
		<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
	{/if}
	
	{#if helpText && !error}
		<p class="text-sm text-slate-500 dark:text-slate-400">{helpText}</p>
	{/if}
</div>
