<script lang="ts">
	export let onSendMessage: (message: string, file?: File) => void;
	export let isTyping: boolean = false;

	let message = '';
	let selectedFile: File | null = null;
	let showFileDialog = false;
	let fileInputRef: HTMLInputElement;

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		if ((message.trim() || selectedFile) && !isTyping) {
			onSendMessage(message.trim(), selectedFile || undefined);
			message = '';
			selectedFile = null;
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handleFileSelect = () => {
		fileInputRef.click();
	};

	const handleFileChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			// Validate file type
			const allowedTypes = [
				'text/plain',
				'application/pdf',
				'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			];
			
			const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx'];
			const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
			
			if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
				selectedFile = file;
				showFileDialog = false;
			} else {
				alert('Please select a valid file type (.txt, .doc, .docx, .pdf)');
				target.value = '';
			}
		}
	};

	const removeFile = () => {
		selectedFile = null;
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	};

	const getFileIcon = (fileName: string) => {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
			case 'doc':
			case 'docx':
				return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
			case 'txt':
				return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
			default:
				return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};
</script>

<div class="border-t border-gray-700/50 bg-gradient-to-r from-gray-900/90 via-black/80 to-gray-900/90 backdrop-blur-sm p-4 relative overflow-hidden">
	<!-- Background texture overlay -->
	<div class="absolute inset-0 bg-gradient-to-r from-blue-500/2 via-transparent to-purple-500/2"></div>
	<div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-xl"></div>
	<div class="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-lg"></div>
	<!-- Hidden file input -->
	<input
		bind:this={fileInputRef}
		type="file"
		accept=".txt,.doc,.docx,.pdf"
		on:change={handleFileChange}
		class="hidden"
	/>

	<form on:submit={handleSubmit} class="relative z-10 flex gap-3 items-center max-w-4xl mx-auto">
		<button
			type="button"
			on:click={handleFileSelect}
			class="group text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-700/60 hover:to-gray-800/70 shrink-0 flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gray-500/10 transform hover:-translate-y-0.5"
			aria-label="Attach file"
		>
			<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
			</svg>
		</button>
		
		<div class="flex-1 relative">
			<input
				bind:value={message}
				on:keydown={handleKeyDown}
				placeholder="Message AI Assistant..."
				class="w-full bg-gradient-to-r from-gray-900/80 via-black/70 to-gray-900/80 border border-gray-700/50 text-white placeholder:text-gray-300 focus:border-blue-500/60 focus:ring-blue-500/20 focus:bg-gradient-to-r focus:from-gray-800/90 focus:via-black/80 focus:to-gray-800/90 pr-12 rounded-full px-4 py-3 h-12 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-blue-500/10"
				disabled={isTyping}
			/>
			
			<button
				type="button"
				class="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-700/60 hover:to-gray-800/70 size-8 p-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gray-500/10 transform hover:scale-110"
				aria-label="Voice input"
			>
				<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
				</svg>
			</button>
		</div>
		
		<button
			type="submit"
			disabled={!message.trim() || isTyping}
			class="group relative bg-gradient-to-r from-blue-500/90 via-indigo-600/80 to-purple-700/90 hover:from-blue-400/90 hover:via-indigo-500/80 hover:to-purple-600/90 text-white disabled:from-gray-600/60 disabled:via-gray-500/50 disabled:to-gray-600/60 disabled:text-gray-400 shrink-0 rounded-full h-12 w-12 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none overflow-hidden"
			aria-label="Send message"
		>
			<!-- Animated background effects -->
			<div class="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-indigo-300/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			<div class="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-blue-300/20 to-transparent rounded-full blur-lg"></div>
			<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12L18 12M18 12L13 7M18 12L13 17" />
			</svg>
		</button>
	</form>

	<!-- File Attachment Preview -->
	{#if selectedFile}
		<div class="relative z-10 max-w-4xl mx-auto mt-3">
			<div class="bg-gray-800/50 border border-gray-600/60 rounded-xl p-4 backdrop-blur-sm">
				<div class="flex items-center gap-3">
					<!-- File Icon -->
					<div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getFileIcon(selectedFile.name)} />
						</svg>
					</div>
					
					<!-- File Info -->
					<div class="flex-1 min-w-0">
						<div class="text-white font-medium truncate">{selectedFile.name}</div>
						<div class="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</div>
					</div>
					
					<!-- Remove Button -->
					<button
						on:click={removeFile}
						class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
						aria-label="Remove file"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
