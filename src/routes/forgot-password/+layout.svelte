<script lang="ts">
	import '../../app.css';
	import { onMount } from 'svelte';
	
	onMount(() => {
		// Always apply dark mode
		if (typeof document !== 'undefined') {
			document.documentElement.classList.add('dark');
		}
	});
</script>

<!-- Complete layout override - no navbar -->
<div class="min-h-screen bg-slate-900">
	<slot />
</div>
