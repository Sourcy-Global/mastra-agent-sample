/**
 * Cohere API integration for reranking functionality
 */

interface CohereReRankResult {
  index: number;
  relevance_score?: number;
}

interface CohereAPI {
  reRank(query: string, documents: string[], topK?: number): Promise<CohereReRankResult[] | Error>;
}

class CohereService implements CohereAPI {
  private apiKey: string;
  private baseUrl: string = 'https://api.cohere.ai/v1';

  constructor() {
    this.apiKey = process.env.COHERE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('COHERE_API_KEY not set. Reranking will use fallback behavior.');
    }
  }

  async reRank(query: string, documents: string[], topK: number = 10): Promise<CohereReRankResult[]> {
    // If no API key, return documents in original order
    if (!this.apiKey) {
      return documents.slice(0, topK).map((_, index) => ({ index }));
    }

    try {
      const response = await fetch(`${this.baseUrl}/rerank`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          documents,
          top_k: topK,
          model: 'rerank-english-v3.0'
        })
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Cohere rerank error:', error);
      // Fallback: return documents in original order
      return documents.slice(0, topK).map((_, index) => ({ index }));
    }
  }
}

const cohere = new CohereService();
export default cohere;