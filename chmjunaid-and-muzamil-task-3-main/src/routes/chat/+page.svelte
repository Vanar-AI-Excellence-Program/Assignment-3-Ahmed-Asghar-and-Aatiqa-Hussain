<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import EnhancedMessageRenderer from '$lib/components/EnhancedMessageRenderer.svelte';
  import DocumentUpload from '$lib/components/DocumentUpload.svelte';
  import ChatBubble from '$lib/components/chat/ChatBubble.svelte';
  import ChatInput from '$lib/components/chat/ChatInput.svelte';
  import ChatSidebar from '$lib/components/chat/ChatSidebar.svelte';
  import ChatHeader from '$lib/components/chat/ChatHeader.svelte';
  import LoadingIndicator from '$lib/components/chat/LoadingIndicator.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  
  /** @type {import('./$types').PageData} */
  export let data;
  
  interface Message {
    id: number;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    versionNumber: number;
    isEdited: boolean;
    parentId?: number;
    versionGroupId: string;
    isActive: boolean;
    isStreaming?: boolean;
    citations?: any[];
  }

  interface Conversation {
    id: number;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }

  let messages: Message[] = [];
  let conversations: Conversation[] = [];
  let currentConversationId: number | null = null;
  let inputMessage = '';
  let isLoading = false;
  let isStreaming = false;
  let chatContainer: HTMLElement;
  let showSidebar = false;
  
  // Message editing state
  let editingMessageId: number | null = null;
  let editingContent = '';
  
  // Version switching state
  let versionSwitching = false;
  let messageVersions = new Map<number, any[]>();
  let activeVersionIndices = new Map<number, number>();
  let versionLoading = new Map<number, boolean>();
  
  // Auto-scroll state management
  let shouldAutoScroll = true;
  let isUserScrolling = false;
  let scrollTimeout: NodeJS.Timeout;
  let previousMessageCount = 0;
  let showScrollToBottom = false;
  
  // Search and document upload state
  let showSearchModal = false;
  let showDocumentUpload = false;
  let uploadedDocuments = [];
  
  // Delete confirmation modal state
  let showDeleteModal = false;
  let conversationToDelete: number | null = null;
  let isDeleting = false;

  async function loadDocuments() {
    try {
      let url = '/api/documents';
      
      // If we have a current conversation, load only documents for that conversation
      if (currentConversationId) {
        url += `?conversationId=${currentConversationId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const documents = await response.json();
        uploadedDocuments = documents;
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  onMount(async () => {
    await loadConversations();
    await loadDocuments();

    // Add welcome message if no conversation is selected
    if (!currentConversationId) {
      messages = [
        {
          id: 0,
          type: 'bot',
          content: `# Welcome! 🤖

I'm your **AI assistant** powered by Google Gemini, ready to help you brainstorm, explain, or create.

How can I help you today?`,
          timestamp: new Date(),
          versionNumber: 1,
          isEdited: false,
          versionGroupId: 'welcome',
          isActive: true
        }
      ];
    }

    // Initialize auto-scroll
    previousMessageCount = messages.length;
  });

  // Cleanup function for timeouts
  function cleanup() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  }

  onDestroy(() => {
    cleanup();
  });

  // Smart auto-scroll function
  function scrollToBottom(smooth = true) {
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }

  // Check if user is at the bottom of the chat
  function isAtBottom() {
    if (!chatContainer) return true;
    const threshold = 50; // pixels from bottom
    return chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - threshold;
  }

  // Handle scroll events
  function handleScroll() {
    if (!chatContainer) return;
    
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Set user scrolling flag
    isUserScrolling = true;
    
    // Check if user is at bottom
    const atBottom = isAtBottom();
    
    // Update auto-scroll state
    shouldAutoScroll = atBottom;
    
    // Show/hide scroll to bottom button
    showScrollToBottom = !atBottom;
    
    // Clear user scrolling flag after a delay
    scrollTimeout = setTimeout(() => {
      isUserScrolling = false;
    }, 150);
  }

  // Auto-scroll reactive statement
  $: if (messages.length > 0 && chatContainer && shouldAutoScroll && !isUserScrolling) {
    // Only auto-scroll if new messages were added
    if (messages.length > previousMessageCount) {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
    }
    previousMessageCount = messages.length;
  }

  async function loadConversations() {
    try {
      const response = await fetch('/chat/api');
      if (response.ok) {
        const data = await response.json();
        conversations = data.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt)
        }));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  async function loadConversation(conversationId: number) {
    try {
      console.log('🔄 Loading conversation:', conversationId);
      currentConversationId = conversationId;
      
      // Load all messages for the conversation
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        console.log('📨 Loaded messages:', data.messages.length);
        messages = data.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          versionNumber: msg.versionNumber,
          isEdited: msg.isEdited,
          parentId: msg.parentId,
          versionGroupId: msg.versionGroupId,
          isActive: msg.isActive
        })) as Message[];
        console.log('📨 Mapped messages:', messages.length);
      }
      
      // Load documents for this conversation
      await loadDocuments();
      
      // Reset auto-scroll state when loading a conversation
      shouldAutoScroll = true;
      previousMessageCount = messages.length;
      
      // Scroll to bottom after loading
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }

  async function createNewConversation() {
    try {
      const response = await fetch('/chat/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      });
      
      if (response.ok) {
        const data = await response.json();
        await loadConversations();
        currentConversationId = data.conversation.id;
        messages = [];
        uploadedDocuments = []; // Clear documents for new conversation
        showSidebar = false;
        
        // Reset auto-scroll state for new conversation
        shouldAutoScroll = true;
        previousMessageCount = 0;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }

  function showDeleteConfirmation(conversationId: number) {
    conversationToDelete = conversationId;
    showDeleteModal = true;
  }
  
  async function confirmDeleteConversation() {
    if (!conversationToDelete) return;
    
    isDeleting = true;
    
    try {
      const response = await fetch('/chat/api', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversationToDelete })
      });
      
      if (response.ok) {
        await loadConversations();
        if (currentConversationId === conversationToDelete) {
          currentConversationId = null;
          messages = [
            {
              id: 0,
              type: 'bot',
              content: `# Welcome! 🤖

I'm your **AI assistant** powered by Google Gemini. I can help you with various tasks and now support rich text rendering!

## What I can do:
- Answer questions with **formatted text**
- Create \`code snippets\`
- Generate **tables** like GPT does:

| Feature | Status | Description |
|---------|--------|-------------|
| Text formatting | ✅ Enabled | Bold, italic, headers, lists |
| Tables | ✅ Enabled | Full markdown table support |
| Code highlighting | ✅ Enabled | Syntax highlighting for all languages |
| Lists | ✅ Enabled | Ordered and unordered lists |
| Blockquotes | ✅ Enabled | Quote formatting |
| Links | ✅ Enabled | Clickable links |

> **Tip:** Try asking me to create a table or format some text! I can render tables just like ChatGPT does.

How can I help you today?`,
              timestamp: new Date(),
              versionNumber: 1,
              isEdited: false,
              versionGroupId: 'welcome',
              isActive: true
            }
          ];
        }
        showDeleteModal = false;
        conversationToDelete = null;
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      isDeleting = false;
    }
  }
  
  function cancelDeleteConversation() {
    showDeleteModal = false;
    conversationToDelete = null;
    isDeleting = false;
  }

  async function sendMessage() {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    inputMessage = '';
    
    // Add user message
    messages = [...messages, {
      id: -Date.now(), // Temporary negative ID to avoid conflicts
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      versionNumber: 1,
      isEdited: false,
      versionGroupId: 'temp',
      isActive: true
    }];
    
    // Force scroll to bottom when user sends a message
    shouldAutoScroll = true;
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);

    isLoading = true;
    isStreaming = false;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversationId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Add initial bot message for streaming
      const botMessageIndex = messages.length;
      messages = [...messages, {
        id: -(Date.now() + 1), // Temporary negative ID to avoid conflicts
        type: 'bot',
        content: '',
        timestamp: new Date(),
        versionNumber: 1,
        isEdited: false,
        versionGroupId: 'temp',
        isActive: true,
        isStreaming: true
      }];

      // Start streaming indicator
      isStreaming = true;

      // Handle streaming response with ultra-smooth rendering
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
                  // Update immediately for character-by-character streaming
                  if (messages[botMessageIndex]) {
                    messages[botMessageIndex].content = accumulatedContent;
                    messages = [...messages]; // Trigger reactivity
                    if (shouldAutoScroll) {
                      requestAnimationFrame(() => {
                        scrollToBottom(false);
                      });
                    }
                  }
                } else if (data.type === 'complete') {
                  
                  // Final update with complete content
                  let finalContent = accumulatedContent;

                  // Add citations if available
                  if (data.citations && data.citations.length > 0) {
                    finalContent += '\n\n**Sources:**\n';
                    data.citations.forEach(citation => {
                      finalContent += `[${citation.index}] **${citation.documentId ? `Document ${citation.documentId}` : 'Source'}** (chunk ${citation.chunkIndex}): ${citation.content}\n\n`;
                    });
                  }

                  if (data.conversationId && !currentConversationId) {
                    currentConversationId = data.conversationId;
                    await loadConversations();
                  }
                  
                  // Single final update with all data
                  if (messages[botMessageIndex]) {
                    messages[botMessageIndex] = {
                      ...messages[botMessageIndex],
                      id: data.newAssistantReply?.id || messages[botMessageIndex].id,
                      content: finalContent,
                      isStreaming: false,
                      citations: data.citations || []
                    };
                    messages = [...messages]; // Trigger reactivity once
                  }
                  
                  // Final scroll to bottom
                  if (shouldAutoScroll) {
                    requestAnimationFrame(() => scrollToBottom(true));
                  }
                } else if (data.type === 'error') {
                  console.error('Streaming error:', data.error, data.details);
                  messages[botMessageIndex] = {
                    ...messages[botMessageIndex],
                    content: `Sorry, I encountered an error while generating a response. ${data.details || 'Please try again.'}`,
                    isStreaming: false
                  };
                  messages = [...messages];
                }
              } catch (parseError) {
                console.error('Error parsing streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      messages = [...messages, {
        id: -Date.now(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        versionNumber: 1,
        isEdited: false,
        versionGroupId: 'error',
        isActive: true
      }];
    } finally {
      isLoading = false;
      isStreaming = false;
    }
  }

  // Message editing functions
  function startEditing(message: Message) {
    if (message.type !== 'user') return;
    editingMessageId = message.id;
    editingContent = message.content;
  }

  function cancelEditing() {
    editingMessageId = null;
    editingContent = '';
  }

  async function saveEdit() {
    if (!editingContent.trim() || !editingMessageId) return;

    console.log('🔧 Starting edit for message ID:', editingMessageId);
    console.log('🔧 Current user:', data?.user);
    console.log('🔧 Current messages:', messages.map(m => ({ id: m.id, content: m.content.substring(0, 20) })));
    
    // Check if user is logged in
    if (!data?.user) {
      alert('You must be logged in to edit messages. Redirecting to login...');
      goto('/login');
      return;
    }
    
    const messageIndex = messages.findIndex(m => m.id === editingMessageId);
    if (messageIndex === -1) {
      console.log('❌ Message not found in local array');
      return;
    }

    const originalMessage = messages[messageIndex];
    const newContent = editingContent.trim();
    console.log('📝 Original message:', originalMessage);
    console.log('📝 New content:', newContent);

    // Don't save if content hasn't changed
    if (newContent === originalMessage.content) {
      console.log('⚠️ Content unchanged, canceling edit');
      cancelEditing();
      return;
    }
    
    console.log('✅ Content changed, proceeding with API call');

    isLoading = true;

    try {
      console.log('🌐 Making API call to edit message:', editingMessageId);
      const response = await fetch(`/api/messages/${editingMessageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });

      console.log('🌐 Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API error:', errorText);
        
        if (response.status === 401) {
          alert('Authentication error. Please log in again.');
          goto('/login');
          return;
        } else if (response.status === 403) {
          alert('You do not have permission to edit this message.');
          return;
        } else if (response.status === 404) {
          alert('Message not found.');
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      console.log('✅ API call successful, starting to read stream...');

      // Add initial bot message for streaming
      const botMessageIndex = messages.length;
      messages = [...messages, {
        id: -Date.now(),
        type: 'bot',
        content: '',
        timestamp: new Date(),
        versionNumber: 1,
        isEdited: false,
        versionGroupId: 'temp',
        isActive: true
      }];

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
                  // Update immediately for character-by-character streaming
                  if (messages[botMessageIndex]) {
                    messages[botMessageIndex].content = accumulatedContent;
                    messages = [...messages]; // Trigger reactivity
                    if (shouldAutoScroll) {
                      requestAnimationFrame(() => {
                        scrollToBottom(false);
                      });
                    }
                  }
                } else if (data.type === 'complete') {
                  console.log('✅ Edit completed, updating message...');
                  // Update the temporary message with real data instead of reloading
                  if (data.newAssistantReply && messages[botMessageIndex]) {
                    messages[botMessageIndex] = {
                      ...messages[botMessageIndex],
                      id: data.newAssistantReply.id,
                      content: accumulatedContent,
                      isStreaming: false
                    };
                    messages = [...messages];
                  }
                } else if (data.type === 'error') {
                  console.error('Streaming error:', data.error);
                  messages[botMessageIndex] = {
                    ...messages[botMessageIndex],
                    content: 'Sorry, I encountered an error while generating a response. Please try again.'
                  };
                  messages = [...messages];
                }
              } catch (parseError) {
                console.error('Error parsing streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Error editing message:', error);
      
      let errorMessage = 'Sorry, I encountered an error while editing. Please try again.';
      
      // Handle rate limiting
      if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      }
      
      // Add error message
      messages = [...messages, {
        id: Date.now(),
        type: 'bot',
        content: errorMessage,
        timestamp: new Date(),
        versionNumber: 1,
        isEdited: false,
        versionGroupId: 'error',
        isActive: true
      }];
    } finally {
      isLoading = false;
      isStreaming = false;
      cancelEditing();
    }
  }

  // Sidebar event handlers
  function handleSidebarCreate() {
    createNewConversation();
  }

  function handleSidebarSelect(event: CustomEvent) {
    loadConversation(event.detail.id);
  }

  function handleSidebarDelete(event: CustomEvent) {
    showDeleteConfirmation(event.detail.id);
  }

  function handleSidebarToggle() {
    showSidebar = !showSidebar;
  }

  function handleHeaderToggleSidebar() {
    showSidebar = !showSidebar;
  }

  // Input event handlers
  function handleInputSend() {
    sendMessage();
  }

  function handleInputDocumentUpload() {
    showDocumentUpload = true;
  }

  // Chat bubble event handlers
  async function handleBubbleRegenerate(event: CustomEvent) {
    const assistantMessageId = event.detail.messageId as number;
    const assistantIndex = messages.findIndex(m => m.id === assistantMessageId);
    if (assistantIndex === -1) return;

    const assistantMessage = messages[assistantIndex];
    if (assistantMessage.type !== 'bot' || !assistantMessage.parentId) return;

    const userMessageId = assistantMessage.parentId;

    isLoading = true;
    isStreaming = true;

    // Add placeholder streaming bot message at the end
    const botMessageIndex = messages.length;
    messages = [...messages, {
      id: -Date.now(),
      type: 'bot',
      content: '',
      timestamp: new Date(),
      versionNumber: 1,
      isEdited: false,
      versionGroupId: 'temp',
      isActive: true,
      isStreaming: true
    }];

    // Force scroll to bottom
    shouldAutoScroll = true;
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const response = await fetch(`/api/messages/${userMessageId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          for (const line of text.split('\n')) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === 'chunk') {
                accumulatedContent += data.content;
                if (messages[botMessageIndex]) {
                  messages[botMessageIndex].content = accumulatedContent;
                  if (shouldAutoScroll) requestAnimationFrame(() => scrollToBottom(false));
                }
              } else if (data.type === 'complete') {
                const deactivated = (data.deactivatedMessages || []) as number[];
                const reply = data.regeneratedAssistantReply;

                // Filter out deactivated messages
                if (deactivated.length > 0) {
                  messages = messages.filter(m => !deactivated.includes(m.id));
                }

                // Finalize the new assistant message
                if (reply) {
                  let finalContent = reply.content;
                  if (data.citations && data.citations.length > 0) {
                    finalContent += '\n\n**Sources:**\n';
                    data.citations.forEach((c: any) => {
                      finalContent += `[${c.index}] ${c.content}\n`;
                    });
                  }
                  messages[botMessageIndex] = {
                    id: reply.id,
                    type: 'bot',
                    content: finalContent,
                    timestamp: new Date(reply.createdAt),
                    versionNumber: reply.versionNumber,
                    isEdited: reply.isEdited,
                    parentId: reply.parentId,
                    versionGroupId: reply.versionGroupId,
                    isActive: reply.isActive,
                    citations: data.citations || []
                  } as any;
                }

                messages = [...messages];
              } else if (data.type === 'error') {
                messages[botMessageIndex] = {
                  ...messages[botMessageIndex],
                  content: 'Sorry, I encountered an error while regenerating. Please try again.',
                  isStreaming: false
                } as any;
                messages = [...messages];
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Regenerate error:', error);
      messages = [...messages, {
        id: -Date.now(),
        type: 'bot',
        content: 'Sorry, I encountered an error while regenerating. Please try again.',
        timestamp: new Date(),
        versionNumber: 1,
        isEdited: false,
        versionGroupId: 'error',
        isActive: true
      }];
    } finally {
      isLoading = false;
      isStreaming = false;
    }
  }

  function handleBubbleCopy(event: CustomEvent) {
    const messageId = event.detail.messageId;
    console.log('Message copied:', messageId);
    // You can add toast notification here if needed
  }

  async function handleBubbleSwitchVersion(event: CustomEvent) {
    const { messageId, direction } = event.detail as { messageId: number; direction: 'prev' | 'next' };
    if (!messageId || !direction) return;

    try {
      // Request server to switch active version within the group
      const res = await fetch(`/api/messages/${messageId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });
      if (!res.ok) return;

      // Reload active messages for current conversation
      if (currentConversationId) {
        await loadConversation(currentConversationId);
      }
    } catch (err) {
      console.error('Switch version error:', err);
    }
  }


</script>

<svelte:head>
  <title>Chat - AI Assistant</title>
</svelte:head>

<!-- Main Chat Layout -->
<div class="h-screen bg-gray-900 flex">
  <!-- Sidebar -->
  <ChatSidebar
    {conversations}
    {currentConversationId}
    {showSidebar}
    on:create={handleSidebarCreate}
    on:select={handleSidebarSelect}
    on:delete={handleSidebarDelete}
    on:toggle={handleSidebarToggle}
  />

  <!-- Main Chat Area -->
  <div class="flex-1 flex flex-col bg-gray-900 relative">
    <!-- Chat Header -->
    <ChatHeader on:toggleSidebar={handleHeaderToggleSidebar} />

    <!-- Messages Container -->
    <main 
      bind:this={chatContainer}
      on:scroll={handleScroll}
      class="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-900 relative"

      aria-label="Chat messages"
      aria-live="polite"
    >
      <!-- Messages -->
      {#each messages as message, index}
        <div class="message-enter" style="animation-delay: {index * 50}ms">
          <ChatBubble
            {message}
            isEditing={editingMessageId === message.id}
            bind:editingContent={editingContent}
            onEdit={() => startEditing(message)}
            onSave={saveEdit}
            onCancel={cancelEditing}
            on:regenerate={handleBubbleRegenerate}
            on:switchVersion={handleBubbleSwitchVersion}
            on:copy={handleBubbleCopy}
          >
                        <EnhancedMessageRenderer
              content={message.content}
                          isStreaming={isStreaming && message === messages[messages.length - 1]}
                        />
          </ChatBubble>
        </div>
      {/each}
                  
      <!-- Loading Indicator - Only show when not streaming -->
      {#if isLoading && !isStreaming}
        <LoadingIndicator
          isStreaming={false}
          streamedContent={''}
        />
                  {/if}
    </main>

    <!-- Floating Scroll to Bottom Button -->
    {#if showScrollToBottom}
                <button
        on:click={() => scrollToBottom(true)}
        class="fixed bottom-24 right-6 relative p-3 bg-gray-800/90 backdrop-blur-sm text-gray-400 hover:text-white rounded-full transition-all duration-300 focus:outline-none z-40 group
               bg-gray-800/90 hover:bg-gray-700/90
               border border-gray-600/30 hover:border-gray-500/50
               shadow-[0_6px_18px_rgba(0,0,0,0.5),0_3px_6px_rgba(0,0,0,0.2)]
               hover:shadow-[0_8px_24px_rgba(0,0,0,0.7),0_4px_8px_rgba(0,0,0,0.3)]
               active:shadow-[0_3px_12px_rgba(0,0,0,0.6),0_1px_3px_rgba(0,0,0,0.2)]
               hover:transform hover:scale-110 hover:-translate-y-1
               active:transform active:scale-95 active:translate-y-0
               before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-gray-600/20 before:to-gray-700/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
               animate-pulse"
        aria-label="Scroll to bottom"
        title="Scroll to bottom"
      >
        <svg class="w-5 h-5 relative z-10 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                </button>
          {/if}

    <!-- Chat Input -->
    <ChatInput
          bind:value={inputMessage}
          disabled={isLoading}
      isLoading={isLoading}
      onSend={handleInputSend}
      onDocumentUpload={handleInputDocumentUpload}
    />
  </div>
</div>

<!-- Document Upload Modal -->
<DocumentUpload
  bind:isOpen={showDocumentUpload}
  conversationId={currentConversationId}
  on:close={() => showDocumentUpload = false}
  on:upload-complete={(event) => {
    console.log('Documents uploaded:', event.detail);
    // Show success message
    const successMessage: Message = {
      id: -(Date.now() + 1),
      type: 'bot',
      content: `✅ **Documents uploaded successfully!**\n\nI've processed ${event.detail.documents.length} document(s) and they're now available for context-aware responses in this conversation.`,
      timestamp: new Date(),
      versionNumber: 1,
      isEdited: false,
      versionGroupId: 'upload-success',
      isActive: true
    };
    messages = [...messages, successMessage];
    // Refresh document list
    loadDocuments();
    showDocumentUpload = false;
  }}
/>

<!-- Delete Conversation Modal -->
<Modal
  bind:isOpen={showDeleteModal}
  title="Delete Conversation"
  description="Are you sure you want to delete this conversation? This action cannot be undone and all messages in this conversation will be permanently lost."
  confirmText="Delete Conversation"
  cancelText="Cancel"
  confirmVariant="danger"
  loading={isDeleting}
  on:confirm={confirmDeleteConversation}
  on:cancel={cancelDeleteConversation}
  on:close={cancelDeleteConversation}
>
  <div class="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
    <svg class="w-6 h-6 text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>
    <div>
      <p class="text-red-400 font-medium text-sm">This action is permanent</p>
      <p class="text-gray-400 text-xs mt-1">All messages and data associated with this conversation will be deleted forever.</p>
    </div>
  </div>
</Modal>

<style>
  /* Custom scrollbar for messages container */
  main::-webkit-scrollbar {
    width: 8px;
  }
  
  main::-webkit-scrollbar-track {
    background: transparent;
  }
  
  main::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  
  main::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.5);
  }
  
  /* Focus styles for better accessibility */
  *:focus-visible {
    outline: none;
  }
  
  /* Smooth transitions */
  * {
    transition: all 0.2s ease;
  }
  
  /* Enhanced background pattern */
  .bg-gray-900 {
    background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  }
  
  /* Message container enhancements */
  main {
    background: linear-gradient(180deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.4) 100%);
  }
  
  /* Floating button animation */
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-2px);
    }
  }
  
  button[aria-label="Scroll to bottom"] {
    animation: float 3s ease-in-out infinite;
  }

  button[aria-label="Scroll to bottom"]:hover {
    animation: none;
  }

  /* Message entrance animation */
  .message-enter {
    animation: slideInUp 0.5s ease-out forwards;
    opacity: 0;
    transform: translateY(20px);
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Smooth page transitions */
  * {
    transition-property: transform, opacity, box-shadow, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Enhanced background gradient animation */
  .bg-gray-900 {
    background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%);
    background-size: 200% 200%;
    animation: gradientShift 20s ease infinite;
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  /* Subtle hover effects for chat container */
  main:hover {
    background: linear-gradient(180deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.5) 100%);
  }

  /* Loading state animations */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>



