# Project Coding Instructions

## Core Principles

1. **No Unnecessary Abstractions**: Avoid creating wrapper functions or abstraction layers that provide no meaningful logic or value. If a function is just doing simple data transformation or passing parameters to another function, use the original function directly instead.

2. **Direct Core Library Usage**: Use core Mastra functions like `createStep()` and `createWorkflow()` directly rather than creating custom wrapper functions like `createSimpleAgentStep()` or `createSimpleWorkflow()`.

3. **Agents as Source of Truth**: The `@src/agents/` folder contains the definitive agent definitions. Workflows should import and reuse these agents rather than re-initializing them.

4. **Minimal Utilities**: Only keep utility functions that contain actual business logic or complex transformations. Simple data transformations should be done inline.

## Folder Structure Guidelines

- `@src/agents/` - Single source of truth for all agent definitions
- `@src/workflows/` - Workflow orchestration, reusing agents from @src/agents/
- `@src/tools/` - Tool definitions and search utilities
- `@src/utils/` - Only complex utilities with actual logic (schemas, response processing, etc.)
- `@src/api/` - API integrations

## What NOT to Create

- Wrapper functions around core Mastra functions
- Factory classes or factory functions for simple object creation
- Abstraction layers that don't add meaningful functionality
- Helper functions that just pass parameters through

## What TO Keep in Utils

- Complex business logic functions
- Schema definitions
- Functions with actual processing logic (like `processAgentResponse`)
- Configuration objects with complex logic

## What NOT to Put in Utils

- Simple string templates (prompt builders should be inline in workflows)
- Basic object creators
- Simple data transformations

## Example of Good vs Bad

❌ **Bad** - Unnecessary wrapper:
```typescript
export function createSimpleWorkflow(config) {
  let workflow = createWorkflow(config)
  // just chaining steps...
  return workflow
}
```

✅ **Good** - Direct usage:
```typescript
let workflow = createWorkflow({
  id: 'my-workflow',
  inputSchema,
  outputSchema
})
```

❌ **Bad** - Simple string template in utils:
```typescript
export const promptBuilders = {
  somePrompt: (input) => `Process ${input.data} with ${input.options}`
}
```

✅ **Good** - Inline prompt in workflow:
```typescript
const prompt = `Process ${inputData.data} with ${inputData.options}`
```

❌ **Bad** - Simple data transformation:
```typescript
export function createAgentConfig(name, instructions) {
  return { name, instructions }
}
```

✅ **Good** - Inline object creation:
```typescript
new Agent({
  name: 'My Agent',
  instructions: 'Do something...'
})
```