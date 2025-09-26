<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Clear any remaining client-side state
		setTimeout(() => {
			goto('/login', { replaceState: true });
		}, 1000);
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
	<div class="text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Signing you out...</h2>
		<p class="text-gray-600 dark:text-gray-400">Please wait while we log you out securely.</p>
	</div>
</div>
