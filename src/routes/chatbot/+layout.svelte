<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Redirect if not authenticated
	$: if (!$page.data.user) {
		goto('/login');
	}
</script>

<slot />
