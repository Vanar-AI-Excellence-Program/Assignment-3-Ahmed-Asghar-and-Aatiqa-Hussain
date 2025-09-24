<script lang="ts">
  import { marked } from 'marked';
  import { markedHighlight } from 'marked-highlight';
  import hljs from 'highlight.js';
  import DOMPurify from 'dompurify';
  import { onMount } from 'svelte';

  export let content: string = '';
  export let isStreaming: boolean = false;

  let renderedContent: string = '';

  // Configure marked with syntax highlighting and table support
  marked.use(markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  }));

  // Configure marked options for better table and text rendering
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
    pedantic: false,
  });

  // Post-process HTML to add custom classes
  function addCustomClasses(html: string): string {
    return html
      // Tables
      .replace(/<table>/g, '<div class="table-container"><table class="markdown-table">')
      .replace(/<\/table>/g, '</table></div>')
      .replace(/<th>/g, '<th class="markdown-th">')
      .replace(/<td>/g, '<td class="markdown-td">')
      // Code blocks
      .replace(/<pre><code class="hljs language-([^"]*)">/g, '<div class="code-block"><div class="code-lang">$1</div><pre><code class="hljs language-$1">')
      .replace(/<pre><code class="hljs">/g, '<div class="code-block"><pre><code class="hljs">')
      .replace(/<\/code><\/pre>/g, '</code></pre></div>')
      // Inline code
      .replace(/<code>/g, '<code class="inline-code">')
      // Paragraphs
      .replace(/<p>/g, '<p class="markdown-paragraph">')
      // Headings
      .replace(/<h1>/g, '<h1 class="markdown-heading markdown-h1">')
      .replace(/<h2>/g, '<h2 class="markdown-heading markdown-h2">')
      .replace(/<h3>/g, '<h3 class="markdown-heading markdown-h3">')
      .replace(/<h4>/g, '<h4 class="markdown-heading markdown-h4">')
      .replace(/<h5>/g, '<h5 class="markdown-heading markdown-h5">')
      .replace(/<h6>/g, '<h6 class="markdown-heading markdown-h6">')
      // Lists
      .replace(/<ul>/g, '<ul class="markdown-list">')
      .replace(/<ol>/g, '<ol class="markdown-list">')
      .replace(/<li>/g, '<li class="markdown-list-item">')
      // Blockquotes
      .replace(/<blockquote>/g, '<blockquote class="markdown-blockquote">')
      // Links
      .replace(/<a href="([^"]*)">/g, '<a href="$1" class="markdown-link" target="_blank" rel="noopener noreferrer">')
      // Emphasis
      .replace(/<strong>/g, '<strong class="markdown-strong">')
      .replace(/<em>/g, '<em class="markdown-em">');
  }

  // Reactive statement to update rendered content
  $: {
    if (content) {
      try {
        const rawHtml = marked(content) as string;
        const processedHtml = addCustomClasses(rawHtml);
        
        // Sanitize the HTML to prevent XSS attacks
        renderedContent = DOMPurify.sanitize(processedHtml, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'code', 'pre', 
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'hr',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'a', 'img', 'div', 'span'
          ],
          ALLOWED_ATTR: [
            'href', 'title', 'alt', 'src', 'class', 'align', 'target', 'rel'
          ]
        });
      } catch (error) {
        console.error('Error rendering markdown:', error);
        // Fallback to plain text if markdown parsing fails
        renderedContent = content.replace(/\n/g, '<br>');
      }
    } else {
      renderedContent = '';
    }
  }

  onMount(() => {
    // Import highlight.js CSS for syntax highlighting
    import('highlight.js/styles/github-dark.css');
  });
</script>

<div class="message-renderer">
  {@html renderedContent}
  {#if isStreaming}
    <span class="streaming-cursor"></span>
  {/if}
</div>

<style>
  .message-renderer {
    @apply text-base leading-relaxed;
  }

  /* Global markdown styles */
  .message-renderer :global(.markdown-paragraph) {
    @apply mb-4 last:mb-0;
  }

  .message-renderer :global(.markdown-heading) {
    @apply font-bold mb-3 mt-6 first:mt-0;
  }

  .message-renderer :global(.markdown-h1) {
    @apply text-2xl;
  }

  .message-renderer :global(.markdown-h2) {
    @apply text-xl;
  }

  .message-renderer :global(.markdown-h3) {
    @apply text-lg;
  }

  .message-renderer :global(.markdown-h4) {
    @apply text-base;
  }

  .message-renderer :global(.markdown-h5) {
    @apply text-sm;
  }

  .message-renderer :global(.markdown-h6) {
    @apply text-xs;
  }

  /* List styles */
  .message-renderer :global(.markdown-list) {
    @apply mb-4 pl-6;
  }

  .message-renderer :global(.markdown-list ul) {
    @apply list-disc;
  }

  .message-renderer :global(.markdown-list ol) {
    @apply list-decimal;
  }

  .message-renderer :global(.markdown-list-item) {
    @apply mb-1;
  }

  /* Code styles */
  .message-renderer :global(.code-block) {
    @apply mb-4 rounded-lg overflow-hidden bg-gray-800 border border-gray-700;
  }

  .message-renderer :global(.code-lang) {
    @apply px-4 py-2 bg-gray-700 text-gray-300 text-xs font-mono border-b border-gray-600;
  }

  .message-renderer :global(.code-block pre) {
    @apply p-4 overflow-x-auto bg-gray-800 text-gray-100;
  }

  .message-renderer :global(.code-block code) {
    @apply font-mono text-sm;
  }

  .message-renderer :global(.inline-code) {
    @apply px-2 py-1 bg-gray-800 text-orange-300 rounded text-sm font-mono border border-gray-700;
  }

  /* Table styles */
  .message-renderer :global(.table-container) {
    @apply mb-4 overflow-x-auto rounded-lg border border-gray-700 bg-gray-800;
  }

  .message-renderer :global(.markdown-table) {
    @apply w-full border-collapse;
  }

  .message-renderer :global(.markdown-table th),
  .message-renderer :global(.markdown-th) {
    @apply px-4 py-3 text-left font-semibold bg-gray-700 text-gray-200 border-b border-gray-600;
  }

  .message-renderer :global(.markdown-table td),
  .message-renderer :global(.markdown-td) {
    @apply px-4 py-3 text-gray-300 border-b border-gray-700;
  }

  .message-renderer :global(.markdown-table tr:hover) {
    background-color: #2d2d2d;
  }

  /* Remove border from last row to avoid double border with container */
  .message-renderer :global(.markdown-table tr:last-child td) {
    @apply border-b-0;
  }

  /* Blockquote styles */
  .message-renderer :global(.markdown-blockquote) {
    @apply border-l-4 border-orange-500 pl-4 py-2 mb-4 bg-gray-800 italic text-gray-300 rounded-r;
  }

  /* Link styles */
  .message-renderer :global(.markdown-link) {
    @apply text-orange-400 hover:text-orange-300 underline transition-colors;
  }

  /* Text emphasis */
  .message-renderer :global(.markdown-strong) {
    @apply font-bold text-white;
  }

  .message-renderer :global(.markdown-em) {
    @apply italic;
  }

  /* Streaming cursor */
  .streaming-cursor {
    @apply inline-block w-0.5 h-5 bg-white ml-1 animate-pulse;
  }

  /* Responsive table */
  @media (max-width: 768px) {
    .message-renderer :global(.table-container) {
      @apply text-sm;
    }
    
    .message-renderer :global(.markdown-table th),
    .message-renderer :global(.markdown-table td) {
      @apply px-2 py-2;
    }
  }
</style>
