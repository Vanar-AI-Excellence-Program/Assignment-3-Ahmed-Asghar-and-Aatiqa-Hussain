<script lang="ts">
	export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
	export let shadow: 'none' | 'sm' | 'md' | 'lg' = 'sm';
	export let border = true;
	export let hover = false;
	
	// Padding variants
	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};
	
	// Shadow variants
	const shadowClasses = {
		none: '',
		sm: 'shadow-sm',
		md: 'shadow-md',
		lg: 'shadow-lg'
	};
	
	// Border classes
	const borderClasses = border ? 'border border-slate-200 dark:border-slate-700' : '';
	
	// Hover effect
	const hoverClasses = hover ? 'hover:shadow-lg hover:scale-[1.02] transition-all duration-200' : '';
	
	// Base classes
	const baseClasses = 'bg-white dark:bg-slate-800 rounded-xl';
	
	// Dynamic classes
	$: classes = [
		baseClasses,
		paddingClasses[padding],
		shadowClasses[shadow],
		borderClasses,
		hoverClasses
	].filter(Boolean).join(' ');
</script>

<div class={classes}>
	<slot />
</div>
