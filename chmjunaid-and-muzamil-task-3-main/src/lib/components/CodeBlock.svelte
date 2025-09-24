<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js';

  export let code: string = '';
  export let language: string = '';
  export let showLanguage: boolean = true;

  let codeElement: HTMLElement;
  let detectedLanguage: string = '';

  // Initialize highlight.js and detect language
  onMount(() => {
    // Import highlight.js CSS for syntax highlighting
    import('highlight.js/styles/github-dark.css');
    
    // Auto-detect language if not specified
    if (!language) {
      detectedLanguage = hljs.highlightAuto(code).language || 'plaintext';
    } else {
      detectedLanguage = hljs.getLanguage(language) ? language : 'plaintext';
    }

    // Apply highlighting
    if (codeElement) {
      // Decode HTML entities to prevent &amp; and &lt; issues
      const decodedCode = decodeHTMLEntities(code);
      
      // Set the language class
      codeElement.className = `hljs language-${detectedLanguage}`;
      
      // Apply syntax highlighting
      const highlighted = hljs.highlight(decodedCode, { 
        language: detectedLanguage 
      }).value;
      
      codeElement.innerHTML = highlighted;
    }
  });

  // Function to decode HTML entities
  function decodeHTMLEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Reactive statement to re-highlight when code changes
  $: if (codeElement && code) {
    const decodedCode = decodeHTMLEntities(code);
    const lang = language ? (hljs.getLanguage(language) ? language : 'plaintext') : 
                          (hljs.highlightAuto(decodedCode).language || 'plaintext');
    
    codeElement.className = `hljs language-${lang}`;
    const highlighted = hljs.highlight(decodedCode, { language: lang }).value;
    codeElement.innerHTML = highlighted;
  }
</script>

<div class="code-block">
  {#if showLanguage && detectedLanguage}
    <div class="code-header">
      <span class="language-label">{detectedLanguage}</span>
      <button 
        class="copy-button" 
        on:click={() => navigator.clipboard.writeText(code)}
        title="Copy code"
      >
        <svg class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
    </div>
  {/if}
  <pre class="code-container">
    <code bind:this={codeElement}></code>
  </pre>
</div>

<style>
  .code-block {
    @apply mb-6 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 shadow-lg;
  }

  .code-header {
    @apply flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700;
  }

  .language-label {
    @apply text-xs font-mono text-gray-400 uppercase tracking-wide;
  }

  .copy-button {
    @apply p-1 text-gray-400 hover:text-white transition-colors duration-200 rounded;
  }

  .copy-button:hover {
    @apply bg-gray-700;
  }

  .copy-icon {
    @apply w-4 h-4;
  }

  .code-container {
    @apply p-4 overflow-x-auto bg-gray-900 text-gray-100;
  }

  .code-container code {
    @apply font-mono text-sm leading-relaxed;
  }

  /* Highlight.js theme overrides for better dark theme */
  :global(.hljs) {
    @apply text-gray-100;
  }

  :global(.hljs-keyword) {
    @apply text-purple-400 font-semibold;
  }

  :global(.hljs-built_in) {
    @apply text-blue-400;
  }

  :global(.hljs-type) {
    @apply text-cyan-400;
  }

  :global(.hljs-literal) {
    @apply text-orange-400;
  }

  :global(.hljs-number) {
    @apply text-green-400;
  }

  :global(.hljs-regexp) {
    @apply text-red-400;
  }

  :global(.hljs-string) {
    @apply text-yellow-400;
  }

  :global(.hljs-subst) {
    @apply text-gray-300;
  }

  :global(.hljs-symbol) {
    @apply text-purple-300;
  }

  :global(.hljs-class) {
    @apply text-cyan-400 font-semibold;
  }

  :global(.hljs-function) {
    @apply text-blue-400;
  }

  :global(.hljs-title) {
    @apply text-blue-300;
  }

  :global(.hljs-params) {
    @apply text-gray-300;
  }

  :global(.hljs-comment) {
    @apply text-gray-500 italic;
  }

  :global(.hljs-doctag) {
    @apply text-gray-500;
  }

  :global(.hljs-meta) {
    @apply text-gray-400;
  }

  :global(.hljs-section) {
    @apply text-yellow-300 font-semibold;
  }

  :global(.hljs-tag) {
    @apply text-red-400;
  }

  :global(.hljs-name) {
    @apply text-red-300;
  }

  :global(.hljs-attr) {
    @apply text-orange-300;
  }

  :global(.hljs-attribute) {
    @apply text-orange-300;
  }

  :global(.hljs-variable) {
    @apply text-green-300;
  }

  :global(.hljs-bullet) {
    @apply text-gray-300;
  }

  :global(.hljs-code) {
    @apply text-gray-300;
  }

  :global(.hljs-emphasis) {
    @apply italic;
  }

  :global(.hljs-strong) {
    @apply font-bold;
  }

  :global(.hljs-formula) {
    @apply text-purple-300;
  }

  :global(.hljs-link) {
    @apply text-blue-300 underline;
  }

  :global(.hljs-quote) {
    @apply text-gray-400 italic;
  }

  :global(.hljs-selector-tag) {
    @apply text-purple-400;
  }

  :global(.hljs-selector-id) {
    @apply text-cyan-400;
  }

  :global(.hljs-selector-class) {
    @apply text-cyan-300;
  }

  :global(.hljs-selector-attr) {
    @apply text-orange-300;
  }

  :global(.hljs-selector-pseudo) {
    @apply text-purple-300;
  }

  :global(.hljs-template-tag) {
    @apply text-red-400;
  }

  :global(.hljs-template-variable) {
    @apply text-green-300;
  }

  :global(.hljs-addition) {
    @apply text-green-400 bg-green-900/20;
  }

  :global(.hljs-deletion) {
    @apply text-red-400 bg-red-900/20;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .code-container {
      @apply p-3 text-xs;
    }
    
    .code-header {
      @apply px-3 py-2;
    }
  }
</style>
