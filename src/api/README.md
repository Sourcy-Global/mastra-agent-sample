# API Module

This module contains reusable API wrappers for external services used by the sourcing agents.

## Setup

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Serper API (for web search functionality)
SERPER_API_KEY=your_serper_api_key_here
SERPER_API_URL=https://google.serper.dev

# Other configuration
NODE_ENV=development
```

### Getting a Serper API Key

1. Visit [Serper.dev](https://serper.dev)
2. Sign up for an account
3. Get your API key from the dashboard
4. Add it to your `.env` file

## Available APIs

### Serper API (`serper.ts`)

A wrapper for the Serper Google Search API that provides:

- Web search functionality
- Formatted results for LLM consumption
- Error handling and retry logic
- TypeScript types for all responses

#### Usage

```typescript
import { serperAPI } from './api/serper.js'

// Simple search
const results = await serperAPI.searchQuery('Apple Inc', 5)

// Get formatted results for LLM
const formattedResults = await serperAPI.getFormattedResults('iPhone 15', 3)
```

## Testing

Run the API test to verify your setup:

```bash
# Test the Serper API
node --loader ts-node/esm src/api/serper.test.ts
```

## Integration with Agents

The research tool in the demand agent uses this API wrapper to gather current market information and industry data for sourcing decisions.
