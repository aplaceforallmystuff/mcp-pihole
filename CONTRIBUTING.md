# Contributing to MCP Pi-hole

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/aplaceforallmystuff/mcp-pihole.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development

```bash
# Run in development mode (auto-reloads on changes)
npm run watch

# Build for production
npm run build

# Test the built version
node dist/index.js
```

## Adding New Tools

To add a new Pi-hole API tool:

1. **Add the API method** to `src/pihole-client.ts`:

```typescript
async yourNewMethod(param: string): Promise<YourResponseType> {
  return this.request<YourResponseType>('/your/endpoint', {
    method: 'POST',
    body: JSON.stringify({ param }),
  });
}
```

2. **Add the tool definition** to the `TOOLS` array in `src/index.ts`:

```typescript
{
  name: "pihole_your_tool",
  description: "What this tool does",
  inputSchema: {
    type: "object" as const,
    properties: {
      param: {
        type: "string",
        description: "Parameter description",
      },
    },
    required: ["param"],
  },
}
```

3. **Add the handler** in the `CallToolRequestSchema` handler switch statement:

```typescript
case "pihole_your_tool": {
  const param = (args as { param: string }).param;
  const result = await pihole.yourNewMethod(param);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
```

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Keep functions focused and well-named
- Add JSDoc comments for complex functions

## Submitting Changes

1. Ensure your code builds: `npm run build`
2. Commit with clear messages describing the change
3. Push to your fork
4. Open a Pull Request with:
   - Clear description of what changed
   - Any relevant issue numbers
   - Screenshots/examples if applicable

## Reporting Issues

When reporting issues, please include:

- Node.js version
- Operating system
- Pi-hole version
- Steps to reproduce
- Expected vs actual behavior
- Any error messages

## Questions?

Open an issue for any questions about contributing.
