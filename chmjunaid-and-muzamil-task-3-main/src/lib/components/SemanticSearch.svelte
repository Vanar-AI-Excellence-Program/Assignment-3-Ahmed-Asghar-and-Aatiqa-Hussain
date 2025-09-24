<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from './ui/Button.svelte';
  import { Input } from './ui/Input.svelte';
  import { Card } from './ui/Card.svelte';

  const dispatch = createEventDispatcher();

  export let placeholder = 'Search your conversations...';
  export let conversationId = null;
  export let threshold = 0.7;
  export let limit = 10;

  let query = '';
  let results = [];
  let loading = false;
  let error = null;

  async function performSearch() {
    if (!query.trim()) {
      results = [];
      return;
    }

    loading = true;
    error = null;

    try {
      const params = new URLSearchParams({
        q: query,
        threshold: threshold.toString(),
        limit: limit.toString()
      });

      if (conversationId) {
        params.append('conversationId', conversationId.toString());
      }

      const response = await fetch(`/api/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      results = data.results || [];
      
      dispatch('search', { results, query, totalResults: data.totalResults });
    } catch (err) {
      error = err.message;
      results = [];
      dispatch('error', { error: err.message });
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      performSearch();
    }
  }

  function clearSearch() {
    query = '';
    results = [];
    error = null;
    dispatch('clear');
  }

  $: if (query.trim() === '') {
    results = [];
  }
</script>

<div class="semantic-search">
  <div class="search-input-container">
    <Input
      bind:value={query}
      {placeholder}
      on:keypress={handleKeyPress}
      disabled={loading}
    />
    <div class="search-actions">
      <Button 
        on:click={performSearch} 
        disabled={loading || !query.trim()}
        variant="primary"
      >
        {loading ? 'Searching...' : 'Search'}
      </Button>
      {results.length > 0 && (
        <Button on:click={clearSearch} variant="secondary">
          Clear
        </Button>
      )}
    </div>
  </div>

  {#if error}
    <div class="error-message">
      <p>❌ {error}</p>
    </div>
  {/if}

  {#if results.length > 0}
    <div class="search-results">
      <h3>Search Results ({results.length})</h3>
      
      {#each results as result}
        <Card class="result-card">
          <div class="result-header">
            <span class="result-role {result.role}">
              {result.role === 'user' ? '👤 You' : '🤖 AI'}
            </span>
            <span class="result-similarity">
              {(result.similarity * 100).toFixed(1)}% match
            </span>
          </div>
          
          <div class="result-content">
            <p>{result.content}</p>
          </div>
          
          <div class="result-footer">
            <small>
              Conversation ID: {result.conversationId} • 
              {new Date(result.createdAt).toLocaleDateString()}
            </small>
          </div>
        </Card>
      {/each}
    </div>
  {:else if query.trim() && !loading && !error}
    <div class="no-results">
      <p>No similar messages found. Try adjusting your search terms or lowering the similarity threshold.</p>
    </div>
  {/if}

  {#if results.length > 0}
    <div class="search-settings">
      <label>
        Similarity Threshold:
        <input 
          type="range" 
          min="0.1" 
          max="1.0" 
          step="0.1" 
          bind:value={threshold}
          on:change={performSearch}
        />
        {threshold}
      </label>
    </div>
  {/if}
</div>

<style>
  .semantic-search {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .search-input-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: flex-end;
  }

  .search-actions {
    display: flex;
    gap: 0.5rem;
  }

  .error-message {
    background-color: #fee;
    border: 1px solid #fcc;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #c33;
  }

  .search-results {
    margin-top: 1rem;
  }

  .search-results h3 {
    margin-bottom: 1rem;
    color: #333;
  }

  .result-card {
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .result-role {
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .result-role.user {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .result-role.assistant {
    background-color: #dcfce7;
    color: #166534;
  }

  .result-similarity {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .result-content {
    margin-bottom: 0.5rem;
  }

  .result-content p {
    margin: 0;
    line-height: 1.5;
    color: #374151;
  }

  .result-footer {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .no-results {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    border: 1px dashed #d1d5db;
  }

  .search-settings {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .search-settings label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
  }

  .search-settings input[type="range"] {
    width: 150px;
  }
</style>
