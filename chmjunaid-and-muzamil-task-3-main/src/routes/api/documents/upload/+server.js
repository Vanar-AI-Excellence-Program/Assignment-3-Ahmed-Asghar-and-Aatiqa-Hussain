import { json } from '@sveltejs/kit';
import { fullDocumentProcessor } from '$lib/services/documentProcessor.js';

export async function POST({ request, locals }) {
  try {
    // Get user session
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename') || file?.name || 'uploaded-file';
    const conversationId = formData.get('conversationId');

    if (!file || !(file instanceof File)) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate conversationId if provided
    if (conversationId) {
      const convId = parseInt(conversationId);
      if (isNaN(convId) || convId <= 0) {
        return json({ error: 'Invalid conversation ID' }, { status: 400 });
      }
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf'
    ];

    // Also check file extension as a backup
    const fileName = file.name || '';
    const fileExtension = fileName.toLowerCase().split('.').pop();
    const allowedExtensions = ['txt', 'pdf'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return json({ 
        error: 'Unsupported file type. Please upload TXT or PDF files only.' 
      }, { status: 400 });
    }

    console.log(`Processing upload for user ${session.user.id}: ${filename} (${file.type}) for conversation: ${conversationId || 'global'}`);

    // Convert file to buffer for processing
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create a file-like object with metadata
    const fileWithMetadata = {
      buffer: fileBuffer,
      name: filename,
      size: file.size,
      type: file.type || 'application/octet-stream'
    };

    // Process the document with full content (no chunking)
    const document = await fullDocumentProcessor.processDocumentFull(
      fileWithMetadata, 
      session.user.id, 
      conversationId ? parseInt(conversationId) : null
    );

    return json({
      success: true,
      documentId: document.id,
      docId: document.doc_id,
      message: 'Document uploaded and processed successfully as full content'
    });

  } catch (error) {
    console.error('Error in document upload:', error);
    
    return json({
      error: error.message || 'Failed to upload document'
    }, { status: 500 });
  }
}
