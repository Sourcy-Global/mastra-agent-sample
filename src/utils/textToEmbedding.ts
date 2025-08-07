/**
 * Text to embedding conversion utility using OpenAI embeddings API
 */

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    total_tokens: number;
  };
}

/**
 * Generate embeddings for the given text using OpenAI embeddings API
 * @param text The text to convert to embeddings
 * @returns Promise resolving to embedding vector (array of numbers)
 */
export async function getEmbeddings(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text input is required and cannot be empty');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.trim(),
        model: 'text-embedding-3-small' // Using the latest embedding model
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data: EmbeddingResponse = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No embedding data received from OpenAI API');
    }

    return data.data[0].embedding;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
    throw new Error('Failed to generate embeddings: Unknown error');
  }
}