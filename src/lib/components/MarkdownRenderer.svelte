<script lang="ts">
  import { onMount } from 'svelte';
  import { createHighlighter } from 'shiki';
  
  export let content: string;
  export let citations: any[] = [];
  
  let htmlContent = '';
  let highlighter: any = null;
  
  onMount(async () => {
    // Initialize Shiki highlighter
    highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'sql']
    });
    
    // Process content
    htmlContent = await processMarkdown(content);
  });
  
  async function processMarkdown(text: string): Promise<string> {
    if (!highlighter) return text;
    
    // Simple markdown processing with code block highlighting
    let processed = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-white mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-4">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
      
      // Code inline
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-blue-300 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks
      .replace(/\n/g, '<br>');
    
    // Process code blocks
    processed = await processCodeBlocks(processed);
    
    return processed;
  }
  
  async function processCodeBlocks(text: string): Promise<string> {
    if (!highlighter) return text;
    
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let result = text;
    const matches = [...text.matchAll(codeBlockRegex)];
    
    for (const match of matches) {
      const [fullMatch, lang, code] = match;
      try {
        const highlighted = highlighter.codeToHtml(code.trim(), {
          lang: lang || 'text',
          theme: 'github-dark'
        });
        
        const replacement = `<div class="my-4 rounded-lg overflow-hidden">
          <div class="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
            ${lang || 'text'}
          </div>
          <div class="bg-gray-900 p-4 overflow-x-auto">
            ${highlighted}
          </div>
        </div>`;
        
        result = result.replace(fullMatch, replacement);
      } catch (error) {
        console.error('Code highlighting error:', error);
        const fallback = `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>${code.trim()}</code></pre>`;
        result = result.replace(fullMatch, fallback);
      }
    }
    
    return result;
  }
</script>

<div class="prose prose-invert max-w-none">
  {@html htmlContent}
</div>

{#if citations && citations.length > 0}
  <div class="mt-4 p-3 bg-gray-800/50 border border-gray-600/60 rounded-lg">
    <div class="flex items-center gap-2 mb-2">
      <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span class="text-sm font-medium text-blue-400">Sources</span>
    </div>
    <div class="space-y-2">
      {#each citations as citation}
        <div class="text-xs text-gray-300 bg-gray-700/50 p-2 rounded border-l-2 border-blue-500/50">
          <div class="font-medium text-blue-300 mb-1">Source {citation.index}</div>
          <div class="text-gray-400">{citation.content}</div>
          {#if citation.score}
            <div class="text-xs text-gray-500 mt-1">Relevance: {(citation.score * 100).toFixed(1)}%</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
