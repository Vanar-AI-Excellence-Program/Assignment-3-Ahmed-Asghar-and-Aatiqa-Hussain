<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import { createHighlighter } from 'shiki';
  
  export let content: string;
  export let isStreaming: boolean = false;
  export let citations: Array<{ documentTitle?: string; documentSource?: string; score: number }> = [];

  let renderedContent = '';
  let isCodeHighlighted = false;
  let highlighter: any = null;

  // Configure marked for better rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Enhanced markdown rendering with syntax highlighting
  async function renderMarkdown(text: string): Promise<string> {
    if (!text) return '';
    
    // Initialize highlighter if not already done
    if (!highlighter) {
      try {
        highlighter = await createHighlighter({
          themes: ['github-dark'],
          langs: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'html', 'css', 'json', 'yaml', 'bash', 'sql', 'markdown', 'xml', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'shell', 'powershell', 'dockerfile', 'toml', 'ini', 'log', 'diff', 'git', 'text', 'plaintext']
        });
      } catch (error) {
        console.warn('Failed to initialize syntax highlighter:', error);
      }
    }
    
    // Configure marked with custom renderer for code blocks
    const renderer = new marked.Renderer();
    
    renderer.code = function({ text, lang, escaped }: { text: string; lang?: string; escaped?: boolean }) {
      if (highlighter && lang) {
        try {
          const highlighted = highlighter.codeToHtml(text, {
            lang: lang,
            theme: 'github-dark'
          });
          return `<div class="code-block-wrapper">${highlighted}</div>`;
        } catch (error) {
          // Silently fall back to basic highlighting for unsupported languages
          console.debug(`Language ${lang} not supported, using fallback highlighting`);
        }
      }
      
      // Fallback to basic highlighting
      const language = lang || 'text';
      const codeToRender = escaped ? text : escapeHtml(text);
      return `<pre class="code-block"><code class="language-${language}">${codeToRender}</code></pre>`;
    };
    
    // Use marked to parse markdown
    const html = marked.parse(text, { renderer });
    return html;
  }

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  $: {
    renderMarkdown(content).then(html => {
      renderedContent = html;
    });
  }

  onMount(() => {
    // Additional setup if needed
  });
</script>

<div class="message-content prose prose-invert max-w-none">
  {@html renderedContent}
  
  {#if isStreaming}
    <span class="inline-block w-2 h-4 bg-current animate-pulse ml-1"></span>
  {/if}
  
  <!-- Citations Section -->
  {#if citations && citations.length > 0}
    <div class="mt-4 pt-4 border-t border-gray-600/50">
      <div class="flex items-center gap-2 mb-3">
        <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-sm font-medium text-blue-400">Sources</span>
        <span class="text-xs text-gray-500">({citations.length} reference{citations.length !== 1 ? 's' : ''})</span>
      </div>
      
      <div class="space-y-2">
        {#each citations as citation, index}
          <div class="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
            <div class="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-white font-medium">
                {citation.documentTitle || citation.documentSource || 'Unknown Document'}
              </div>
              {#if citation.documentSource && citation.documentSource !== citation.documentTitle}
                <div class="text-xs text-gray-400 mt-1">
                  {citation.documentSource}
                </div>
              {/if}
              <div class="flex items-center gap-2 mt-2">
                <div class="text-xs text-gray-500">
                  Relevance: {Math.round(citation.score * 100)}%
                </div>
                <div class="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-500 transition-all duration-300" 
                    style="width: {citation.score * 100}%"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.message-content) {
    line-height: 1.6;
  }
  
  :global(.message-content h1) {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
    color: white;
  }
  
  :global(.message-content h2) {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    margin-top: 1.25rem;
    color: white;
  }
  
  :global(.message-content h3) {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    margin-top: 1rem;
    color: white;
  }
  
  :global(.message-content p) {
    margin-bottom: 0.75rem;
    color: #f3f4f6;
  }
  
  :global(.message-content ul) {
    list-style-type: disc;
    margin-left: 1.5rem;
    margin-bottom: 1rem;
    color: #f3f4f6;
  }
  
  :global(.message-content li) {
    margin-bottom: 0.25rem;
  }
  
  :global(.message-content strong) {
    font-weight: 600;
    color: white;
  }
  
  :global(.message-content em) {
    font-style: italic;
    color: #e5e7eb;
  }
  
  :global(.message-content .inline-code) {
    background-color: #1f2937;
    color: #f87171;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: monospace;
  }
  
  :global(.message-content .code-block) {
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 1rem 0;
    overflow-x: auto;
  }
  
  :global(.message-content .code-block code) {
    color: #f3f4f6;
    font-family: monospace;
    font-size: 0.875rem;
    line-height: 1.625;
  }
  
  :global(.message-content .code-block-wrapper) {
    margin: 1rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid #374151;
  }
  
  :global(.message-content .code-block-wrapper pre) {
    background-color: #111827;
    padding: 1rem;
    overflow-x: auto;
    margin: 0;
  }
  
  :global(.message-content .code-block-wrapper code) {
    font-size: 0.875rem;
    line-height: 1.625;
    background: none;
    padding: 0;
  }
  
  :global(.message-content a) {
    color: #f87171;
    text-decoration: underline;
  }
  
  :global(.message-content a:hover) {
    color: #fca5a5;
  }
  
  :global(.message-content blockquote) {
    border-left: 4px solid #4b5563;
    padding-left: 1rem;
    font-style: italic;
    color: #d1d5db;
    margin: 1rem 0;
  }
</style>
