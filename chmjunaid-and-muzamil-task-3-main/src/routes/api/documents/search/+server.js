import { json } from '@sveltejs/kit';
import { documentProcessor } from '$lib/services/documentProcessor.js';

export async function POST({ request, locals }) {
  try {
    // Get user session
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, limit = 5, threshold = 0.7 } = await request.json();

    if (!query || typeof query !== 'string') {
      return json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`Document search for user ${session.user.id}: "${query}"`);

    // Search documents across all conversations for the user
    const results = await documentProcessor.searchDocuments(
      query,
      session.user.id,
      null, // conversationId - null means search across all conversations
      limit,
      threshold
    );

    return json({
      success: true,
      results: results.map(result => ({
        id: result.id,
        content: result.content,
        documentId: result.documentId,
        chunkIndex: result.chunkIndex,
        metadata: result.metadata,
        similarity: result.similarity
      })),
      totalResults: results.length
    });

  } catch (error) {
    console.error('Error in document search:', error);
    
    return json({
      error: error.message || 'Failed to search documents'
    }, { status: 500 });
  }
}

export async function GET({ url, locals }) {
  try {
    // Get user session
    const session = await getServerSession(locals.auth);
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const threshold = parseFloat(url.searchParams.get('threshold') || '0.7');

    if (!query) {
      return json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    console.log(`Document search for user ${session.user.id}: "${query}"`);

    // Search documents across all conversations for the user
    const results = await documentProcessor.searchDocuments(
      query,
      session.user.id,
      null, // conversationId - null means search across all conversations
      limit,
      threshold
    );

    return json({
      success: true,
      results: results.map(result => ({
        id: result.id,
        content: result.content,
        documentId: result.documentId,
        chunkIndex: result.chunkIndex,
        metadata: result.metadata,
        similarity: result.similarity
      })),
      totalResults: results.length
    });

  } catch (error) {
    console.error('Error in document search:', error);
    
    return json({
      error: error.message || 'Failed to search documents'
    }, { status: 500 });
  }
}
