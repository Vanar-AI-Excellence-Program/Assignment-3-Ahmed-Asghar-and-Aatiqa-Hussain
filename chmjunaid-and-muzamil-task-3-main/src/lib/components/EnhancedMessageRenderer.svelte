<script lang="ts">
  import { onMount } from 'svelte';
  import CodeBlock from './CodeBlock.svelte';
  import { parseMarkdown, sanitizeHTML, markdownToHTML, tableToHTML } from '$lib/utils/markdownParser';

  export let content: string = '';
  export let isStreaming: boolean = false;

  let parsedBlocks: Array<{
    type: 'text' | 'code' | 'table';
    content: string;
    language?: string;
    tableData?: {
      headers: string[];
      rows: string[][];
    };
  }> = [];

  // Parse content into blocks when it changes
  $: {
    if (content) {
      parsedBlocks = parseMarkdown(content);
    } else {
      parsedBlocks = [];
    }
  }

  onMount(() => {
    // Initialize highlight.js
    import('highlight.js/styles/github-dark.css');
  });
</script>

<div class="message-renderer">
  {#each parsedBlocks as block, index}
    {#if block.type === 'code'}
      <CodeBlock 
        code={block.content} 
        language={block.language} 
        showLanguage={true}
      />
    {:else if block.type === 'table'}
      <div class="table-block">
        {@html sanitizeHTML(tableToHTML(block.tableData!))}
      </div>
    {:else}
      <div class="text-block">
        {@html sanitizeHTML(markdownToHTML(block.content))}
      </div>
    {/if}
  {/each}
  
  {#if isStreaming}
    <span class="streaming-cursor"></span>
  {/if}
</div>

<style>
  .message-renderer {
    @apply text-base leading-relaxed;
  }

  .text-block {
    @apply mb-4 last:mb-0;
  }

  .table-block {
    @apply mb-4 last:mb-0;
  }

  /* Markdown text styles */
  .text-block :global(.markdown-paragraph) {
    @apply mb-4 last:mb-0;
  }

  .text-block :global(.markdown-heading) {
    @apply font-bold mb-3 mt-6 first:mt-0;
  }

  .text-block :global(.markdown-h1) {
    @apply text-2xl;
  }

  .text-block :global(.markdown-h2) {
    @apply text-xl;
  }

  .text-block :global(.markdown-h3) {
    @apply text-lg;
  }

  .text-block :global(.markdown-h4) {
    @apply text-base;
  }

  .text-block :global(.markdown-h5) {
    @apply text-sm;
  }

  .text-block :global(.markdown-h6) {
    @apply text-xs;
  }

  /* List styles */
  .text-block :global(.markdown-list) {
    @apply mb-4 pl-6;
  }

  .text-block :global(.markdown-list ul) {
    @apply list-disc;
  }

  .text-block :global(.markdown-list ol) {
    @apply list-decimal;
  }

  .text-block :global(.markdown-list-item) {
    @apply mb-1;
  }

  /* Inline code styles */
  .text-block :global(.inline-code) {
    @apply px-2 py-1 bg-gray-800 text-orange-300 rounded text-sm font-mono border border-gray-700;
  }

  /* Blockquote styles */
  .text-block :global(.markdown-blockquote) {
    @apply border-l-4 border-orange-500 pl-4 py-2 mb-4 bg-gray-800 italic text-gray-300 rounded-r;
  }

  /* Link styles */
  .text-block :global(.markdown-link) {
    @apply text-orange-400 hover:text-orange-300 underline transition-colors;
  }

  /* Text emphasis */
  .text-block :global(.markdown-strong) {
    @apply font-bold text-white;
  }

  .text-block :global(.markdown-em) {
    @apply italic;
  }

  /* Table styles - GPT-like appearance */
  .table-block :global(.table-container) {
    @apply mb-4 overflow-x-auto rounded-lg border border-gray-700 bg-gray-800;
  }

  .table-block :global(.markdown-table) {
    @apply w-full border-collapse;
  }

  .table-block :global(.markdown-table th),
  .table-block :global(.markdown-th) {
    @apply px-4 py-3 text-left font-semibold bg-gray-700 text-gray-200 border-b border-gray-600;
  }

  .table-block :global(.markdown-table td),
  .table-block :global(.markdown-td) {
    @apply px-4 py-3 text-gray-300 border-b border-gray-700;
  }

  .table-block :global(.markdown-table tr:hover) {
    background-color: #2d2d2d;
  }

  /* Remove border from last row to avoid double border with container */
  .table-block :global(.markdown-table tr:last-child td) {
    @apply border-b-0;
  }

  /* Streaming cursor */
  .streaming-cursor {
    @apply inline-block w-0.5 h-5 bg-white ml-1 animate-pulse;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .message-renderer {
      @apply text-sm;
    }
    
    .table-block :global(.table-container) {
      @apply text-sm;
    }
    
    .table-block :global(.markdown-table th),
    .table-block :global(.markdown-table td) {
      @apply px-2 py-2;
    }
  }
</style>
