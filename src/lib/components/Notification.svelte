<script lang="ts">
	import { onMount } from 'svelte';

	interface NotificationProps {
		message: string;
		type: 'success' | 'error' | 'warning' | 'info';
		duration?: number;
		onClose?: () => void;
	}

	let { message, type = 'info', duration = 4000, onClose }: NotificationProps = $props();

	let isVisible = $state(false);
	let isExiting = $state(false);

	onMount(() => {
		// Show notification with animation
		setTimeout(() => {
			isVisible = true;
		}, 100);

		// Auto-hide after duration
		if (duration > 0) {
			setTimeout(() => {
				hide();
			}, duration);
		}
	});

	function hide() {
		isExiting = true;
		setTimeout(() => {
			onClose?.();
		}, 300);
	}

	// Get colors based on type
	function getColors() {
		switch (type) {
			case 'success':
				return {
					bg: 'bg-blue-600',
					border: 'border-blue-500',
					text: 'text-white',
					icon: 'text-blue-200'
				};
			case 'error':
				return {
					bg: 'bg-red-600',
					border: 'border-red-500',
					text: 'text-white',
					icon: 'text-red-200'
				};
			case 'warning':
				return {
					bg: 'bg-yellow-500',
					border: 'border-yellow-400',
					text: 'text-white',
					icon: 'text-yellow-200'
				};
			default:
				return {
					bg: 'bg-blue-600',
					border: 'border-blue-500',
					text: 'text-white',
					icon: 'text-blue-200'
				};
		}
	}

	const colors = getColors();
</script>

<!-- Simple Notification Container -->
<div class="fixed top-4 right-4 z-50 max-w-sm w-full">
	<div class="transform transition-all duration-300 ease-in-out {
		isVisible && !isExiting 
			? 'translate-x-0 opacity-100 scale-100' 
			: 'translate-x-full opacity-0 scale-95'
	}">
		<div class="bg-slate-800 border border-slate-600 rounded-lg shadow-lg p-4 flex items-center justify-between">
			<!-- Message Content -->
			<p class="text-white text-sm leading-relaxed flex-1 mr-3">{message}</p>

			<!-- Close Button -->
			<button
				onclick={hide}
				class="text-slate-400 hover:text-white transition-colors p-1 flex-shrink-0"
				aria-label="Close notification"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>
</div>

