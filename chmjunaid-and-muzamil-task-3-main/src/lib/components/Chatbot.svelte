<script lang="ts">
  import { onMount } from 'svelte';
  import EnhancedMessageRenderer from './EnhancedMessageRenderer.svelte';
  
  let messages: Array<{type: 'user' | 'bot', content: string, timestamp: Date}> = [];
  let inputMessage = '';
  let isLoading = false;
  let isStreaming = false;
  let isOpen = false;
  let chatContainer: HTMLElement;

  onMount(() => {
    // Add welcome message
    messages = [
      {
        type: 'bot',
        content: 'Hello! I\'m your AI assistant powered by Google Gemini. How can I help you today?',
        timestamp: new Date()
      }
    ];
  });

  async function sendMessage() {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    inputMessage = '';
    
    // Add user message
    messages = [...messages, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }];

    isLoading = true;
    isStreaming = false;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Add initial bot message for streaming
      const botMessageIndex = messages.length;
      messages = [...messages, {
        type: 'bot',
        content: '',
        timestamp: new Date()
      }];

      // Start streaming indicator
      isStreaming = true;

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                
                if (data.type === 'chunk') {
                  accumulatedContent += data.content;
                  
                  // Update immediately for smooth streaming
                  messages[botMessageIndex] = {
                    ...messages[botMessageIndex],
                    content: accumulatedContent
                  };
                  messages = [...messages]; // Trigger reactivity
                  
                  // Small delay to make streaming visible
                  await new Promise(resolve => setTimeout(resolve, 10));
                } else if (data.type === 'complete') {
                  break;
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Streaming error');
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Ensure final content is set
      if (accumulatedContent) {
        messages[botMessageIndex] = {
          ...messages[botMessageIndex],
          content: accumulatedContent
        };
        messages = [...messages];
      }

    } catch (error) {
      console.error('Chat error:', error);
      messages = [...messages, {
        type: 'bot',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        timestamp: new Date()
      }];
    } finally {
      isLoading = false;
      isStreaming = false;
      // Scroll to bottom
      setTimeout(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
  }

  function clearChat() {
    messages = [
      {
        type: 'bot',
        content: 'Hello! I\'m your AI assistant powered by Google Gemini. How can I help you today?',
        timestamp: new Date()
      }
    ];
  }
</script>

<!-- Chatbot Toggle Button -->
<button
  on:click={toggleChat}
  class="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full p-4 shadow-professional-lg transition-all duration-200 hover:scale-110"
  title="Open AI Chatbot"
>
  {#if isOpen}
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  {:else}
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
    </svg>
  {/if}
</button>

<!-- Chatbot Interface -->
{#if isOpen}
  <div class="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-gray-800 rounded-xl shadow-professional-lg border border-gray-700 flex flex-col">
    <!-- Header -->
    <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-t-xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold">AI Assistant</h3>
            <p class="text-xs text-orange-100">Powered by Gemini</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            on:click={clearChat}
            class="p-1 hover:bg-white/20 rounded transition-colors"
            title="Clear chat"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div 
      bind:this={chatContainer}
      class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900"
    >
      {#each messages as message}
        <div class="flex {message.type === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-xs lg:max-w-md">
            <div class="rounded-lg px-4 py-2 {message.type === 'user' ? 'message-user' : 'message-bot'}">
              {#if message.type === 'user'}
                <p class="text-sm">
                  {message.content}
                </p>
              {:else}
                <EnhancedMessageRenderer 
                  content={message.content} 
                  isStreaming={isStreaming && message === messages[messages.length - 1]}
                />
              {/if}
              <p class="text-xs {message.type === 'user' ? 'text-orange-100' : 'text-gray-400'} mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      {/each}
      
      {#if isLoading && !isStreaming}
        <div class="flex justify-start">
          <div class="max-w-xs lg:max-w-md">
            <div class="message-bot px-4 py-2">
              <div class="flex items-center space-x-2">
                <div class="loading-dots">
                  <div class="loading-dot"></div>
                  <div class="loading-dot"></div>
                  <div class="loading-dot"></div>
                </div>
                <span class="text-sm text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-gray-700 bg-gray-800">
      <div class="flex space-x-2">
        <input
          type="text"
          bind:value={inputMessage}
          on:keypress={handleKeyPress}
          placeholder="Type your message..."
          class="input-field flex-1 text-sm"
          disabled={isLoading}
        />
        <button
          on:click={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          class="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}
