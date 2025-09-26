<script lang="ts">
	interface Message {
		id: string;
		text: string;
		isUser: boolean;
		timestamp: Date;
		isStreaming?: boolean;
	}

	export let message: Message;
</script>

<div class="flex p-4 {message.isUser ? 'justify-end' : 'justify-start'} hover:bg-gray-800/30 transition-colors">
	<div class="flex flex-col gap-1 {message.isUser ? 'max-w-[50%] items-end' : 'max-w-[60%] items-start'}">
		<div
			class="rounded-2xl px-4 py-3 shadow-sm border {
				message.isUser
					? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md border-emerald-200'
					: 'bg-gray-800 text-white rounded-bl-md border-gray-700'
			}"
		>
			{#if message.isUser}
				<p class="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
			{:else}
				<slot>
					<p class="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
				</slot>
			{/if}
		</div>
		<span class="text-xs text-gray-400 px-2">
			{message.timestamp.toLocaleTimeString('en-US', { 
				hour: '2-digit', 
				minute: '2-digit' 
			})}
		</span>
	</div>
</div>
