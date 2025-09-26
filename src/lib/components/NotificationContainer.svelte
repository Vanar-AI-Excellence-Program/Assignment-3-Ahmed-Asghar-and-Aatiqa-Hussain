<script lang="ts">
	import { notifications, removeNotification } from '$lib/stores/notifications.js';
	import Notification from './Notification.svelte';
</script>

<!-- Notification Container -->
<div class="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
	{#each $notifications as notification (notification.id)}
		<div class="pointer-events-auto">
			<Notification
				message={notification.message}
				type={notification.type}
				duration={notification.duration}
				onClose={() => removeNotification(notification.id)}
			/>
		</div>
	{/each}
</div>
