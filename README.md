# Weather & Search Agents - Mastra Sample

A sample application built with the [Mastra](https://mastra.ai) framework, demonstrating AI-powered agents, tools, and workflows with Test-Driven Development setup. Features both weather and search functionality.

## Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Add your API keys to .env:
   # OPENAI_API_KEY=your_openai_key
   # SERPER_API_KEY=your_serper_key  (get from https://serper.dev)
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Run Development Server**
   ```bash
   pnpm dev
   ```

4. **Run Tests**
   ```bash
   pnpm test
   ```

## Documentation

- **[Project Overview](docs/project-overview.md)** - Detailed project description and setup instructions
- **[Claude Code Guide](docs/CLAUDE.md)** - Instructions for Claude Code AI assistant
- **[TDD Guide](docs/TDD_EXAMPLE.md)** - Test-Driven Development workflow examples

## Architecture Overview

This project demonstrates:

- **Weather Agent**: Conversational AI assistant using OpenAI GPT-4o
- **Search Agent**: Intelligent search assistant for web and shopping queries  
- **Weather Tool**: Integration with Open-Meteo API for real-time weather data
- **Search Tools**: Web search and shopping search using Serper API
- **Weather Workflow**: Multi-step process for weather forecasting and activity planning
- **Search Workflow**: Multi-step process for search and result analysis
- **Test Suite**: Comprehensive testing setup with Vitest

## Key Features

- 🤖 AI-powered weather and search assistants
- 🔍 Web search and shopping search capabilities
- 🔧 Custom tools for API integration
- 🔄 Multi-step workflows
- ✅ Test-Driven Development setup
- 📝 TypeScript with strict mode
- 🎯 Zod schema validation
- 📊 Structured result analysis and insights

## Scripts

- `pnpm dev` - Start Mastra development server
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:ui` - Open visual test interface
- `pnpm test:coverage` - Generate coverage report

## Contributing

See [TDD Guide](docs/TDD_EXAMPLE.md) for development workflow using Test-Driven Development.