import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { env } from '$env/dynamic/private';
import { createEmbedding } from './embedding.js';
import { findSimilarConversations } from './repositories/embeddingRepository.js';
import { documentProcessor } from './services/documentProcessor.js';

export async function generateAIResponse(prompt) {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key');
  }
  const google = createGoogleGenerativeAI({ apiKey });
  const { text } = await generateText({
    model: google('gemini-1.5-flash'),
    prompt
  });
  return text;
}

export async function* generateAIResponseStream(prompt) {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key');
  }
  const google = createGoogleGenerativeAI({ apiKey });
  const stream = await streamText({
    model: google('gemini-1.5-flash'),
    prompt
  });
  
  for await (const chunk of stream.textStream) {
    yield chunk;
  }
}

/**
 * Generate AI response with context from similar conversations
 * @param {string} prompt - The user prompt
 * @param {number} userId - The user ID for finding similar conversations
 * @param {number} conversationId - The current conversation ID
 * @returns {Promise<string>} - The AI response
 */
export async function generateAIResponseWithContext(prompt, userId, conversationId = null) {
  try {
    // Find similar conversations to provide context
    const similarConversations = await findSimilarConversations(prompt, userId, 0.6, 3);
    
    let contextPrompt = prompt;
    
    if (similarConversations.length > 0) {
      const contextInfo = similarConversations
        .map(conv => `Similar conversation "${conv.title}" (similarity: ${conv.similarity.toFixed(2)})`)
        .join('\n');
      
      contextPrompt = `Based on the following context from similar conversations:\n${contextInfo}\n\nUser question: ${prompt}\n\nPlease provide a helpful response that takes into account the context from similar conversations.`;
    }
    
    return await generateAIResponse(contextPrompt);
  } catch (error) {
    console.error('Error generating AI response with context:', error);
    // Fallback to regular response if embedding service fails
    return await generateAIResponse(prompt);
  }
}

/**
 * Generate AI response stream with context from similar conversations
 * @param {string} prompt - The user prompt
 * @param {number} userId - The user ID for finding similar conversations
 * @param {number} conversationId - The current conversation ID
 * @returns {AsyncGenerator<string>} - The AI response stream
 */
export async function* generateAIResponseStreamWithContext(prompt, userId, conversationId = null) {
  try {
    // Find similar conversations to provide context
    const similarConversations = await findSimilarConversations(prompt, userId, 0.6, 3);
    
    let contextPrompt = prompt;
    
    if (similarConversations.length > 0) {
      const contextInfo = similarConversations
        .map(conv => `Similar conversation "${conv.title}" (similarity: ${conv.similarity.toFixed(2)})`)
        .join('\n');
      
      contextPrompt = `Based on the following context from similar conversations:\n${contextInfo}\n\nUser question: ${prompt}\n\nPlease provide a helpful response that takes into account the context from similar conversations.`;
    }
    
    yield* generateAIResponseStream(contextPrompt);
  } catch (error) {
    console.error('Error generating AI response stream with context:', error);
    // Fallback to regular response if embedding service fails
    yield* generateAIResponseStream(prompt);
  }
}

/**
 * Generate AI response with RAG (Retrieval-Augmented Generation)
 * @param {string} prompt - The user prompt
 * @param {number} userId - The user ID for finding relevant documents
 * @param {number} conversationId - The current conversation ID
 * @returns {Promise<string>} - The AI response
 */
export async function generateAIRAGResponse(prompt, userId, conversationId = null) {
  try {
    // Find relevant document chunks
    const relevantChunks = await documentProcessor.searchDocuments(prompt, userId, conversationId, 3, 0.6);
    
    let contextPrompt = prompt;
    
    if (relevantChunks.length > 0) {
      const contextInfo = relevantChunks
        .map((chunk, index) => `Document chunk ${index + 1} (similarity: ${chunk.similarity.toFixed(2)}):\n${chunk.content}`)
        .join('\n\n');
      
      contextPrompt = `Based on the following relevant document content:\n\n${contextInfo}\n\nUser question: ${prompt}\n\nPlease provide a helpful response based on the document content above. If the documents don't contain relevant information, provide a general helpful response.`;
    }
    
    return await generateAIResponse(contextPrompt);
  } catch (error) {
    console.error('Error generating AI RAG response:', error);
    // Fallback to regular response if document search fails
    return await generateAIResponse(prompt);
  }
}

/**
 * Generate AI response stream with RAG (Retrieval-Augmented Generation)
 * @param {string} prompt - The user prompt
 * @param {number} userId - The user ID for finding relevant documents
 * @param {number} conversationId - The current conversation ID
 * @returns {AsyncGenerator<string>} - The AI response stream
 */
export async function* generateAIRAGResponseStream(prompt, userId, conversationId = null) {
  try {
    // Find relevant document chunks
    const relevantChunks = await documentProcessor.searchDocuments(prompt, userId, conversationId, 3, 0.6);
    
    let contextPrompt = prompt;
    
    if (relevantChunks.length > 0) {
      const contextInfo = relevantChunks
        .map((chunk, index) => `Document chunk ${index + 1} (similarity: ${chunk.similarity.toFixed(2)}):\n${chunk.content}`)
        .join('\n\n');
      
      contextPrompt = `Based on the following relevant document content:\n\n${contextInfo}\n\nUser question: ${prompt}\n\nPlease provide a helpful response based on the document content above. If the documents don't contain relevant information, provide a general helpful response.`;
    }
    
    yield* generateAIResponseStream(contextPrompt);
  } catch (error) {
    console.error('Error generating AI RAG response stream:', error);
    // Fallback to regular response if document search fails
    yield* generateAIResponseStream(prompt);
  }
}


