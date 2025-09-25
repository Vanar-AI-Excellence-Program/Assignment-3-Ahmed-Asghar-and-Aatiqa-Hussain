<script lang="ts">
  import { chatStore } from "$lib/stores/chatStore";
  import EnhancedMessageRenderer from "$lib/components/EnhancedMessageRenderer.svelte";

  export let message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    parentId?: string;
    versionGroupId?: string;
    versionNumber?: number;
    isEdited?: boolean;
    isActive?: boolean;
    citations?: Array<{ documentTitle?: string; documentSource?: string; score: number }>;
  };

  let showVersions = false;
  let versions: any[] = [];
  let isLoadingVersions = false;
  let showEditForm = false;
  let editedContent = message.content;
  let versionsLoaded = false;

  $: maybeLoadVersions = (async () => {
    if (!versionsLoaded) {
      try {
        isLoadingVersions = true;
        versions = await chatStore.getMessageVersions(message.id);
        versionsLoaded = true;
      } catch (e) {
        // no-op
      } finally {
        isLoadingVersions = false;
      }
    }
  })();

  const handleRegenerate = async () => {
    if (message.role === "user") {
      try {
        await chatStore.regenerateMessage(message.id);
      } catch (error) {
        console.error("Error regenerating message:", error);
      }
    }
  };

  const handleShowVersions = async () => {
    isLoadingVersions = true;
    try {
      versions = await chatStore.getMessageVersions(message.id);
      showVersions = true;
    } catch (error) {
      console.error("Error loading versions:", error);
    } finally {
      isLoadingVersions = false;
    }
  };

  const handleSwitchVersion = async (targetMessageId?: string, direction?: "next" | "prev") => {
    try {
      await chatStore.switchMessageVersion(message.id, targetMessageId, direction);
      // Refresh versions to reflect new active state and keep panel open
      versions = await chatStore.getMessageVersions(message.id);
      showVersions = true;
    } catch (error) {
      console.error("Error switching version:", error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      // You could add a toast notification here
    } catch (error) {
      console.error("Error copying message:", error);
    }
  };

  const handleEdit = () => {
    showEditForm = true;
    editedContent = message.content;
  };

  const handleSaveEdit = async () => {
    try {
      await chatStore.editMessage(message.id, editedContent);
      showEditForm = false;
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  const handleCancelEdit = () => {
    showEditForm = false;
    editedContent = message.content;
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
</script>

<div class="group relative">
  <!-- Message Container -->
  <div class="flex gap-4 p-4 hover:bg-gray-800/30 transition-colors {message.role === 'user' ? 'justify-end' : ''}">
    <!-- Message Content -->
    <div class="max-w-[80%] min-w-0 {message.role === 'user' ? 'ml-auto' : ''}">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-sm font-medium text-white">
          {message.role === 'user' ? 'You' : 'ShieldBot'}
        </span>
        <span class="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
        {#if message.versionNumber && message.versionNumber > 1}
          <span class="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
            v{message.versionNumber}
          </span>
        {/if}
        {#if message.isEdited}
          <span class="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
            edited
          </span>
        {/if}
      </div>
      
      <div class="prose prose-invert max-w-none rounded-2xl px-4 py-3 {message.role === 'user' ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-gray-700/40 border border-gray-600/60'}">
        {#if showEditForm && message.role === 'user'}
          <div class="space-y-3">
            <textarea
              bind:value={editedContent}
              class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Edit your message..."
            ></textarea>
            <div class="flex gap-2">
              <button
                on:click={handleSaveEdit}
                class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Save
              </button>
              <button
                on:click={handleCancelEdit}
                class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        {:else}
          <EnhancedMessageRenderer content={message.content} isStreaming={false} citations={message.citations || []} />
        {/if}
      </div>

      {#if versions && versions.length > 0}
        <div class="mt-2 flex items-center justify-center gap-3 text-xs text-gray-300">
          <button
            on:click={() => handleSwitchVersion(undefined, 'prev')}
            class="px-2 py-1 rounded hover:bg-gray-700/60"
            aria-label="Previous version"
            title="Previous version"
          >
            ←
          </button>
          <span>
            {(versions.findIndex(v => v.isActive) + 1) || 1} / {versions.length}
          </span>
          <button
            on:click={() => handleSwitchVersion(undefined, 'next')}
            class="px-2 py-1 rounded hover:bg-gray-700/60"
            aria-label="Next version"
            title="Next version"
          >
            →
          </button>
          {#if versions.length === 1}
            <span class="text-gray-500">not versioned yet</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Action Buttons -->
    <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <div class="flex gap-1">
        {#if message.role === 'user'}
          <!-- Edit button for user messages -->
          <button
            on:click={handleEdit}
            class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            title="Edit message"
            aria-label="Edit message"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <!-- Regenerate button for user messages -->
          <button
            on:click={handleRegenerate}
            class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            title="Regenerate AI response"
            aria-label="Regenerate AI response"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        {/if}

            {#if message.role === 'assistant'}
              <!-- Copy button for assistant messages -->
          <button
            on:click={handleCopy}
            class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            title="Copy message"
            aria-label="Copy message"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        {/if}

            <!-- Versions button for BOTH roles (user can also have versions after edit) -->
            <button
              on:click={handleShowVersions}
              class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              title="View message versions"
              aria-label="View message versions"
              disabled={isLoadingVersions}
            >
              {#if isLoadingVersions}
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              {/if}
            </button>
      </div>
    </div>
  </div>

  <!-- Versions Dropdown -->
  {#if showVersions && versions.length > 0}
    <div class="ml-12 mb-4 bg-gray-800/50 border border-gray-600 rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-white">Message Versions</h4>
        <button
          on:click={() => showVersions = false}
          class="text-gray-400 hover:text-white"
          aria-label="Close versions"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Arrow Navigation -->
      <div class="flex items-center justify-between mb-3">
        <button
          on:click={() => handleSwitchVersion(undefined, 'prev')}
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
          title="Previous version"
          aria-label="Previous version"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <span class="text-sm text-gray-400">
          {versions.findIndex(v => v.isActive) + 1} of {versions.length}
        </span>
        
        <button
          on:click={() => handleSwitchVersion(undefined, 'next')}
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
          title="Next version"
          aria-label="Next version"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div class="space-y-2">
        {#each versions as version}
          <button
            on:click={() => handleSwitchVersion(version.id)}
            class="w-full text-left p-3 rounded-lg transition-colors {version.isActive ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-gray-700/50'}"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="text-sm text-white truncate">
                  {version.content.substring(0, 100)}{version.content.length > 100 ? '...' : ''}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  Version {version.versionNumber} • {formatTime(version.timestamp)}
                  {#if version.isEdited}
                    • Edited
                  {/if}
                </div>
              </div>
              {#if version.isActive}
                <div class="text-blue-300 text-xs">Active</div>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
