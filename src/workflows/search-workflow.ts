import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { webSearchTool, shoppingSearchTool } from '../tools/search-tool';

const llm = openai('gpt-4o');

const searchProcessingAgent = new Agent({
  name: 'Search Processing Agent',
  model: llm,
  instructions: `
    You are a search analysis expert who processes and synthesizes search results to provide comprehensive answers.

    Your role is to:
    - Analyze search results from multiple sources
    - Extract key insights and relevant information
    - Synthesize findings into a coherent, well-structured response
    - Identify the most credible and current sources
    - Highlight any conflicting information or gaps
    - Provide actionable insights based on the search findings

    Response Structure:
    📋 SUMMARY
    • Brief overview of findings
    • Key insights discovered

    🔍 DETAILED FINDINGS
    • Main points organized by topic/theme
    • Supporting evidence from sources
    • Current data and statistics when available

    🔗 KEY SOURCES
    • Most relevant and credible sources
    • Links to important references
    • Publication dates when available

    ⚠️ CONSIDERATIONS
    • Any limitations or gaps in information
    • Conflicting viewpoints if present
    • Recommendations for further research if needed

    Guidelines:
    - Prioritize recent and credible information
    - Present information objectively
    - Use clear, accessible language
    - Include specific data points and facts
    - Maintain source attribution
  `,
});

const searchResultSchema = z.object({
  query: z.string(),
  searchType: z.enum(['web', 'shopping']),
  results: z.array(z.object({
    title: z.string(),
    link: z.string(),
    snippet: z.string(),
    position: z.number(),
    source: z.enum(['web', 'shopping']),
  })),
  totalResults: z.number(),
  formattedSummary: z.string(),
  relatedQueries: z.array(z.string()).optional(),
});

const performSearch = createStep({
  id: 'perform-search',
  description: 'Performs web or shopping search based on the query type',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
    searchType: z.enum(['web', 'shopping']).describe('Type of search to perform'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results'),
  }),
  outputSchema: searchResultSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { query, searchType, maxResults = 10 } = inputData;

    let searchResult;
    
    if (searchType === 'shopping') {
      searchResult = await shoppingSearchTool.execute({ 
        context: { query, maxResults } 
      });
    } else {
      searchResult = await webSearchTool.execute({ 
        context: { query, maxResults } 
      });
    }

    return searchResult;
  },
});

const processSearchResults = createStep({
  id: 'process-search-results',
  description: 'Analyzes and synthesizes search results into comprehensive insights',
  inputSchema: searchResultSchema,
  outputSchema: z.object({
    processedResults: z.string(),
    keyInsights: z.array(z.string()),
    sourceCount: z.number(),
    searchType: z.enum(['web', 'shopping']),
  }),
  execute: async ({ inputData }) => {
    const searchData = inputData;

    if (!searchData) {
      throw new Error('Search data not found');
    }

    const prompt = `Based on the following search results for "${searchData.query}", provide a comprehensive analysis:

Search Type: ${searchData.searchType}
Number of Results: ${searchData.totalResults}
Related Queries: ${searchData.relatedQueries?.join(', ') || 'None'}

Search Results Summary:
${searchData.formattedSummary}

Individual Results:
${searchData.results.map((result, index) => 
  `${index + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.link}`
).join('\n\n')}

Please analyze these results and provide insights following your structured format.`;

    const response = await searchProcessingAgent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let processedText = '';
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      processedText += chunk;
    }

    // Extract key insights (simplified - could use more sophisticated parsing)
    const insightLines = processedText.split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^[•-]\s*/, ''))
      .slice(0, 5); // Top 5 insights

    return {
      processedResults: processedText,
      keyInsights: insightLines.length > 0 ? insightLines : ['Analysis completed'],
      sourceCount: searchData.totalResults,
      searchType: searchData.searchType,
    };
  },
});

const searchWorkflow = createWorkflow({
  id: 'search-workflow',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
    searchType: z.enum(['web', 'shopping']).optional().default('web').describe('Type of search to perform'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results'),
  }),
  outputSchema: z.object({
    processedResults: z.string(),
    keyInsights: z.array(z.string()),
    sourceCount: z.number(),
    searchType: z.enum(['web', 'shopping']),
  }),
})
  .then(performSearch)
  .then(processSearchResults);

searchWorkflow.commit();

export { searchWorkflow };