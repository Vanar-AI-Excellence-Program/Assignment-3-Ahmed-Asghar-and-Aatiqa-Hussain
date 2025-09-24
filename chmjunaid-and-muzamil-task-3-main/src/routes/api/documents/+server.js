import { json } from '@sveltejs/kit';
import { getDocumentsByUserId, getDocumentsByConversationId } from '$lib/repositories/documentRepository.js';

export async function GET({ locals, url }) {
  try {
    // Get user session
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = url.searchParams.get('conversationId');

    let documents;
    
    if (conversationId) {
      // Get documents for specific conversation
      const convId = parseInt(conversationId);
      if (isNaN(convId) || convId <= 0) {
        return json({ error: 'Invalid conversation ID' }, { status: 400 });
      }
      documents = await getDocumentsByConversationId(convId, userId);
    } else {
      // Get all user's documents (global scope)
      documents = await getDocumentsByUserId(userId);
    }

    return json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return json({
      error: error.message || 'Failed to fetch documents'
    }, { status: 500 });
  }
}
