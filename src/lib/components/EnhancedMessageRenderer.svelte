<script lang="ts">
  import { onMount } from 'svelte';
  
  export let content: string;
  export let isStreaming: boolean = false;
  export let citations: any[] = [];

  let renderedContent = '';
  let isCodeHighlighted = false;

  // Simple markdown-like rendering
  function renderMarkdown(text: string): string {
    if (!text) return '';
    
    // Handle code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'text';
      return `<pre class="code-block"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle headers
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-5">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>');
    
    // Handle lists
    text = text.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>');
    text = text.replace(/(<li class="ml-4">.*<\/li>)/s, '<ul class="list-disc ml-6 mb-4">$1</ul>');
    
    // Handle line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
  }

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  $: {
    renderedContent = renderMarkdown(content);
  }

  onMount(() => {
    // Simple syntax highlighting for code blocks
    if (renderedContent.includes('code-block') && !isCodeHighlighted) {
      isCodeHighlighted = true;
      // You can add more sophisticated syntax highlighting here
      // For now, we'll use basic styling
    }
  });
</script>

<div class="message-content prose prose-invert max-w-none">
  {@html renderedContent}
  
  {#if isStreaming}
    <span class="inline-block w-2 h-4 bg-current animate-pulse ml-1"></span>
  {/if}
</div>

{#if citations && citations.length > 0}
  <div class="mt-3">
    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-800/60 border border-gray-600/50 text-gray-200 text-xs">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      {citations[0]?.title || citations[0]?.name || 'Source'}
    </span>
  </div>
{/if}

<style>
  :global(.message-content) {
    line-height: 1.6;
  }
  
  :global(.message-content h1) {
    @apply text-2xl font-bold mb-4 mt-6 text-white;
  }
  
  :global(.message-content h2) {
    @apply text-xl font-semibold mb-3 mt-5 text-white;
  }
  
  :global(.message-content h3) {
    @apply text-lg font-semibold mb-2 mt-4 text-white;
  }
  
  :global(.message-content p) {
    @apply mb-3 text-gray-100;
  }
  
  :global(.message-content ul) {
    @apply list-disc ml-6 mb-4 text-gray-100;
  }
  
  :global(.message-content li) {
    @apply mb-1;
  }
  
  :global(.message-content strong) {
    @apply font-semibold text-white;
  }
  
  :global(.message-content em) {
    @apply italic text-gray-200;
  }
  
  :global(.message-content .inline-code) {
    @apply bg-gray-800 text-red-400 px-2 py-1 rounded text-sm font-mono;
  }
  
  :global(.message-content .code-block) {
    @apply bg-gray-900 border border-gray-700 rounded-lg p-4 my-4 overflow-x-auto;
  }
  
  :global(.message-content .code-block code) {
    @apply text-gray-100 font-mono text-sm leading-relaxed;
  }
  
  :global(.message-content a) {
    @apply text-red-400 hover:text-red-300 underline;
  }
  
  :global(.message-content blockquote) {
    @apply border-l-4 border-gray-600 pl-4 italic text-gray-300 my-4;
  }
</style>
