# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` or `pnpm dev` (runs `mastra dev`)
- **Install dependencies**: `pnpm install` (preferred package manager based on README)
- **TypeScript compilation**: Uses `tsc` with ES2022 target and bundler module resolution

## Testing Commands

- **Run tests**: `npm test` or `pnpm test` (runs Vitest in watch mode)
- **Run tests once**: `npm run test:run` or `pnpm test:run`
- **Test with UI**: `npm run test:ui` or `pnpm test:ui` (opens Vitest UI in browser)
- **Watch mode**: `npm run test:watch` or `pnpm test:watch`
- **Coverage report**: `npm run test:coverage` or `pnpm test:coverage`

## Environment Setup

Required environment variables (copy `.env.example` to `.env`):
- `OPENAI_API_KEY`: OpenAI API key for the AI models used by agents and workflows
- `SERPER_API_KEY`: Serper API key for search functionality (get from https://serper.dev)
- `SERPER_API_URL`: Serper API URL (default: https://google.serper.dev)

## Project Architecture

This is a Mastra framework application that demonstrates agent implementations with the following structure:

### Core Architecture
- **Mastra Instance** (`src/mastra/index.ts`): Central configuration that registers agents, workflows, and logging
- **Agent-Based System**: Uses OpenAI GPT-4o models for natural language processing
- **Tool Integration**: Custom tools for external API interactions
- **Workflow Engine**: Multi-step processes with defined input/output schemas

### Key Components

**Weather Agent** (`src/mastra/agents/index.ts`):
- Conversational weather assistant using OpenAI GPT-4o
- Integrates with weather tool for real-time data
- Handles location queries and weather information requests

**Weather Tool** (`src/mastra/tools/index.ts`):
- Fetches current weather data from Open-Meteo API
- Geocoding integration for location resolution
- Structured output schema with temperature, humidity, wind data
- Weather condition mapping from numerical codes

**Search Tools** (`src/mastra/tools/search-tool.ts`):
- Web search tool using Serper API for current information
- Shopping search tool for product and pricing information
- Structured output with results, summaries, and related queries
- Error handling and graceful fallbacks

**Weather Agent** (`src/mastra/agents/index.ts`):
- Conversational weather assistant using OpenAI GPT-4o
- Integrates with weather tool for real-time data
- Handles location queries and weather information requests

**Search Agent** (`src/mastra/agents/search-agent.ts`):
- Intelligent search assistant for web and shopping queries
- Uses both web search and shopping search tools
- Provides comprehensive results with source attribution
- Suggests alternative search terms when needed

**Weather Workflow** (`src/mastra/workflows/index.ts`):
- Two-step process: `fetchWeather` → `planActivities`
- Fetches weather forecast and generates activity recommendations
- Uses a specialized agent for activity planning
- Streams responses with formatted output structure

**Search Workflow** (`src/mastra/workflows/search-workflow.ts`):
- Two-step process: `performSearch` → `processSearchResults`
- Supports both web and shopping search types
- Analyzes and synthesizes search results into insights
- Provides structured output with key findings

### Technical Details

**Dependencies**:
- `@mastra/core`: Core framework functionality
- `@mastra/loggers`: Pino-based logging
- `@ai-sdk/openai`: OpenAI integration
- `zod`: Schema validation and type safety
- `axios`: HTTP client for API requests
- `dotenv`: Environment variable management

**Testing Framework**:
- `vitest`: Fast test runner with native TypeScript support
- `@vitest/ui`: Web-based test runner interface
- Test files located in `__tests__` directories alongside source code
- Global test utilities and Node.js environment configured

**TypeScript Configuration**:
- ES2022 target with strict mode enabled
- Bundler module resolution
- Source files in `src/`, output to `dist/`
- Excludes `node_modules`, `dist`, and `.mastra` directories

**API Integrations**:
- Open-Meteo Geocoding API for location resolution
- Open-Meteo Weather API for forecast data
- Serper API for web search and shopping search functionality
- OpenAI API for natural language processing

The application demonstrates Mastra's capabilities for building AI-powered agents with external tool integration and multi-step workflows. It includes both weather and search functionality, showcasing different types of agent interactions and data processing patterns.