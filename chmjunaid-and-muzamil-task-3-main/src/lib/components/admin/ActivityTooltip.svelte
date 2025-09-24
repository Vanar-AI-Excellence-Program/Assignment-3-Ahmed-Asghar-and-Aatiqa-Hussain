<script lang="ts">
  export let activity;
  export let position = { x: 0, y: 0 };
  export let element;
  
  function formatMetadata(metadata) {
    if (!metadata) return null;
    
    // Handle common metadata fields
    const formatted = {};
    
    if (metadata.userAgent) {
      formatted['User Agent'] = metadata.userAgent;
    }
    
    if (metadata.previousValue && metadata.newValue) {
      formatted['Previous Value'] = metadata.previousValue;
      formatted['New Value'] = metadata.newValue;
    }
    
    if (metadata.targetUser) {
      formatted['Target User'] = metadata.targetUser;
    }
    
    if (metadata.conversationId) {
      formatted['Conversation ID'] = metadata.conversationId;
    }
    
    if (metadata.messageCount) {
      formatted['Message Count'] = metadata.messageCount;
    }
    
    // Add any other metadata fields
    Object.keys(metadata).forEach(key => {
      if (!formatted[key] && metadata[key] !== null && metadata[key] !== undefined) {
        formatted[key] = metadata[key];
      }
    });
    
    return Object.keys(formatted).length > 0 ? formatted : null;
  }
  
  $: formattedMetadata = formatMetadata(activity?.metadata);
  
  // Calculate tooltip position to avoid going off-screen
  $: tooltipStyle = (() => {
    if (!element) return '';
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = position.x + 10;
    let y = position.y - 10;
    
    // Adjust horizontal position if tooltip would go off-screen
    if (x + 320 > viewportWidth) {
      x = position.x - 330;
    }
    
    // Adjust vertical position if tooltip would go off-screen
    if (y + rect.height > viewportHeight) {
      y = position.y - rect.height - 10;
    }
    
    return `left: ${x}px; top: ${y}px;`;
  })();
</script>

{#if activity}
  <div 
    bind:this={element}
    class="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 max-w-sm pointer-events-none"
    style={tooltipStyle}
  >
    <!-- Activity Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <h4 class="text-white font-semibold text-sm">Activity Details</h4>
        <p class="text-xs text-gray-400 mt-1">
          {new Date(activity.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>
      </div>
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 ml-2">
        {activity.activityType}
      </span>
    </div>

    <!-- Activity Content -->
    <div class="space-y-3">
      <!-- User Information -->
      <div>
        <p class="text-xs font-medium text-gray-400 mb-1">User</p>
        <div class="flex items-center space-x-2">
          <div class="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <span class="text-xs font-medium text-white">
              {activity.userName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p class="text-white text-sm">{activity.userName || 'Unknown User'}</p>
            {#if activity.userEmail}
              <p class="text-xs text-gray-400">{activity.userEmail}</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <p class="text-xs font-medium text-gray-400 mb-1">Description</p>
        <p class="text-white text-sm">{activity.description}</p>
      </div>

      <!-- IP Address -->
      {#if activity.ipAddress}
        <div>
          <p class="text-xs font-medium text-gray-400 mb-1">IP Address</p>
          <p class="text-white text-sm font-mono">{activity.ipAddress}</p>
        </div>
      {/if}

      <!-- User Agent -->
      {#if activity.userAgent}
        <div>
          <p class="text-xs font-medium text-gray-400 mb-1">User Agent</p>
          <p class="text-white text-xs break-all">{activity.userAgent}</p>
        </div>
      {/if}

      <!-- Metadata -->
      {#if formattedMetadata}
        <div>
          <p class="text-xs font-medium text-gray-400 mb-2">Additional Information</p>
          <div class="space-y-1">
            {#each Object.entries(formattedMetadata) as [key, value]}
              <div class="flex justify-between items-start">
                <span class="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span class="text-xs text-white ml-2 text-right flex-1">
                  {#if typeof value === 'object'}
                    {JSON.stringify(value)}
                  {:else}
                    {value}
                  {/if}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Tooltip Arrow -->
    <div class="absolute -bottom-1 left-4 w-2 h-2 bg-gray-800 border-r border-b border-gray-600 transform rotate-45"></div>
  </div>
{/if}
