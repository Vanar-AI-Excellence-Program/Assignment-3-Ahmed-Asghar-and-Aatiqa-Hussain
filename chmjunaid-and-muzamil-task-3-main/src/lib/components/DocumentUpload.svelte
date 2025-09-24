<script>
  import { createEventDispatcher } from 'svelte';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let conversationId = null; // Add conversationId prop

  let files = [];
  let uploading = false;
  let uploadProgress = {};
  let error = null;
  let success = null;
  let isDragOver = false;

  function handleFileSelect(event) {
    const selectedFiles = Array.from(event.target.files);
    addFiles(selectedFiles);
  }

  function addFiles(fileList) {
    const validFiles = fileList.filter(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['txt', 'pdf'].includes(extension);
    });

    if (validFiles.length !== fileList.length) {
      error = 'Some files were skipped. Only .txt and .pdf files are supported.';
      setTimeout(() => error = null, 5000);
    }

    const newFiles = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));

    files = [...files, ...newFiles];
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    isDragOver = true;
  }

  function handleDragEnter(event) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleDrop(event) {
    event.preventDefault();
    isDragOver = false;
    const droppedFiles = Array.from(event.dataTransfer.files);
    addFiles(droppedFiles);
  }

  function removeFile(index) {
    files = files.filter((_, i) => i !== index);
  }

  async function uploadDocuments() {
    if (files.length === 0) return;

    uploading = true;
    error = null;
    success = null;
    uploadProgress = {};

    try {
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        
        // Update status
        files[i].status = 'uploading';
        files = [...files];

        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('filename', fileData.name);
        
        // Add conversationId if provided
        if (conversationId) {
          formData.append('conversationId', conversationId.toString());
        }

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${fileData.name}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Update status
        files[i].status = 'completed';
        files[i].documentId = result.documentId;
        files = [...files];

        uploadProgress[fileData.name] = 100;
      }

      success = `Successfully uploaded ${files.length} document(s)`;
      dispatch('upload-complete', { documents: files });
      
      // Clear files after successful upload
      setTimeout(() => {
        files = [];
        success = null;
      }, 3000);

    } catch (err) {
      error = err.message;
      // Mark remaining files as failed
      files.forEach((fileData, i) => {
        if (fileData.status === 'uploading') {
          files[i].status = 'failed';
        }
      });
      files = [...files];
    } finally {
      uploading = false;
    }
  }

  function closeModal() {
    dispatch('close');
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'uploading':
        return '📤';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '📄';
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'pending':
        return 'text-gray-400';
      case 'uploading':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={closeModal} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeModal(); }} role="button" tabindex="0" aria-label="Close modal">
    <div class="modal-content" on:click|stopPropagation on:keydown={(e) => { if (e.key === 'Escape') closeModal(); }} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <div class="modal-header">
        <h2 id="modal-title">📄 Upload Documents</h2>
        <button class="close-btn" on:click={closeModal} aria-label="Close modal">×</button>
      </div>

      <div class="upload-section">
        <div 
          class="file-drop-zone {isDragOver ? 'drag-over' : ''}"
          on:dragover={handleDragOver}
          on:dragenter={handleDragEnter}
          on:dragleave={handleDragLeave}
          on:drop={handleDrop}
          role="button"
          tabindex="0"
          on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input').click(); }}
        >
          <input
            type="file"
            multiple
            accept=".txt,.pdf"
            on:change={handleFileSelect}
            id="file-input"
            class="hidden"
          />
          <label for="file-input" class="drop-zone-label">
            <div class="drop-zone-content">
              <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p class="text-lg font-medium text-gray-600">Drop files here or click to browse</p>
              <p class="text-sm text-gray-500">Supports: TXT, PDF files</p>
            </div>
          </label>
        </div>

        {#if files.length > 0}
          <div class="file-list">
            <h3 class="text-lg font-semibold mb-3">Selected Files ({files.length})</h3>
            
            {#each files as fileData, index}
              <Card class="file-item">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <span class="text-xl">{getStatusIcon(fileData.status)}</span>
                    <div>
                      <p class="font-medium text-gray-900">{fileData.name}</p>
                      <p class="text-sm text-gray-500">{formatFileSize(fileData.size)}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-2">
                    <span class="text-sm {getStatusColor(fileData.status)}">
                      {fileData.status}
                    </span>
                    {#if fileData.status === 'pending'}
                      <button
                        on:click={() => removeFile(index)}
                        class="text-red-500 hover:text-red-700"
                        aria-label="Remove file"
                        title="Remove file"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    {/if}
                  </div>
                </div>
              </Card>
            {/each}

            <div class="upload-actions">
              <Button
                on:click={uploadDocuments}
                disabled={uploading || files.length === 0}
                variant="primary"
                class="w-full"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} Document(s)`}
              </Button>
            </div>
          </div>
        {/if}

        {#if error}
          <div class="error-message">
            <p>❌ {error}</p>
          </div>
        {/if}

        {#if success}
          <div class="success-message">
            <p>✅ {success}</p>
          </div>
        {/if}
      </div>

      <div class="info-section">
        <h3 class="text-lg font-semibold mb-2">How it works:</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="info-item">
            <div class="info-icon">📄</div>
            <h4>1. Upload</h4>
            <p>Upload your documents (TXT, MD, PDF, DOC, DOCX)</p>
          </div>
          <div class="info-item">
            <div class="info-icon">✂️</div>
            <h4>2. Process</h4>
            <p>Documents are chunked and embedded using AI</p>
          </div>
          <div class="info-item">
            <div class="info-icon">🔍</div>
            <h4>3. Search</h4>
            <p>Use semantic search to find relevant content</p>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #374151;
  }

  .modal-header h2 {
    margin: 0;
    color: #f9fafb;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 24px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    color: #f3f4f6;
    background: rgba(75, 85, 99, 0.3);
  }

  .upload-section {
    margin-bottom: 24px;
  }

  .file-drop-zone {
    border: 2px dashed #4b5563;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
    transition: all 0.2s ease;
    margin-bottom: 20px;
  }

  .file-drop-zone:hover,
  .file-drop-zone.drag-over {
    border-color: #ff6b35;
    background: rgba(255, 107, 53, 0.05);
  }

  .file-drop-zone.drag-over {
    border-style: solid;
    background: rgba(255, 107, 53, 0.1);
  }

  .drop-zone-label {
    cursor: pointer;
    display: block;
  }

  .drop-zone-content {
    color: #9ca3af;
  }

  .file-list {
    margin-top: 20px;
  }

  .file-item {
    margin-bottom: 12px;
    background: #111827;
    border: 1px solid #374151;
  }

  .upload-actions {
    margin-top: 20px;
  }

  .error-message {
    background-color: #fee;
    border: 1px solid #fcc;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 1rem;
    color: #c33;
  }

  .success-message {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 1rem;
    color: #166534;
  }

  .info-section {
    background: #111827;
    border: 1px solid #374151;
    border-radius: 8px;
    padding: 20px;
  }

  .info-section h3 {
    color: #f3f4f6;
    margin-bottom: 16px;
  }

  .info-item {
    text-align: center;
    color: #9ca3af;
  }

  .info-icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }

  .info-item h4 {
    color: #f3f4f6;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .info-item p {
    font-size: 0.875rem;
    line-height: 1.4;
  }
</style>
