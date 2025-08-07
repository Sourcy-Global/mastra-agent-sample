# Search Agent Usage Examples

This document demonstrates how to use the Search Agent in your Mastra application.

## Basic Usage

The Search Agent provides two main types of search functionality:

### Web Search
For finding current information, news, and general queries:

```typescript
import { searchAgent } from './src/mastra/agents/search-agent';

// Example: Research a topic
const result = await searchAgent.stream([
  {
    role: 'user',
    content: 'Find the latest information about artificial intelligence breakthroughs in 2024'
  }
]);
```

### Shopping Search
For finding products, prices, and shopping information:

```typescript
// Example: Product research
const result = await searchAgent.stream([
  {
    role: 'user', 
    content: 'Find the best laptops under $1000 with good reviews'
  }
]);
```

## Using the Search Workflow

The search workflow provides structured processing of search results:

```typescript
import { searchWorkflow } from './src/mastra/workflows/search-workflow';

// Web search with analysis
const webResults = await searchWorkflow.execute({
  query: 'climate change impact 2024',
  searchType: 'web',
  maxResults: 15
});

// Shopping search with analysis
const shoppingResults = await searchWorkflow.execute({
  query: 'wireless earbuds noise cancelling',
  searchType: 'shopping', 
  maxResults: 20
});
```

## Direct Tool Usage

You can also use the search tools directly:

```typescript
import { webSearchTool, shoppingSearchTool } from './src/mastra/tools/search-tool';

// Direct web search
const webSearch = await webSearchTool.execute({
  context: {
    query: 'latest tech news',
    maxResults: 10
  }
});

// Direct shopping search
const shoppingSearch = await shoppingSearchTool.execute({
  context: {
    query: 'iPhone 15 Pro Max',
    maxResults: 15
  }
});
```

## Response Formats

### Web Search Response
```typescript
{
  query: string,
  results: Array<{
    title: string,
    link: string,
    snippet: string,
    position: number,
    source: 'web'
  }>,
  totalResults: number,
  searchType: 'web',
  formattedSummary: string,
  relatedQueries?: string[]
}
```

### Shopping Search Response
```typescript
{
  query: string,
  results: Array<{
    title: string,
    link: string,
    snippet: string, // includes price and rating
    position: number,
    source: 'shopping'
  }>,
  totalResults: number,
  searchType: 'shopping',
  formattedSummary: string
}
```

### Search Workflow Output
```typescript
{
  processedResults: string,    // Formatted analysis
  keyInsights: string[],       // Key takeaways
  sourceCount: number,         // Number of sources analyzed  
  searchType: 'web' | 'shopping'
}
```

## Best Practices

1. **Choose the Right Search Type**: Use web search for information and news, shopping search for products
2. **Limit Results**: Use appropriate maxResults values (5-15 for web, 10-25 for shopping)
3. **Handle Errors**: Always implement error handling for network issues or API limits
4. **Use Workflows**: For complex analysis, prefer workflows over direct tool usage
5. **Rate Limiting**: Be mindful of API rate limits when making multiple requests

## Error Handling

The search tools include built-in error handling:

```typescript
// Errors are gracefully handled and returned in the response
const result = await webSearchTool.execute({
  context: { query: 'test', maxResults: 10 }
});

if (result.formattedSummary.includes('Error')) {
  console.log('Search failed:', result.formattedSummary);
}
```

## Integration with Other Agents

The search functionality can be easily integrated with other agents or workflows:

```typescript
// Example: Combine weather and search for travel planning
const weather = await weatherAgent.stream([...]);
const attractions = await searchAgent.stream([
  { role: 'user', content: 'Find tourist attractions in Paris' }
]);
```