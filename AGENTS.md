# AGENTS.md

## Project Context
MCP (Model Context Protocol) server for Rector rules - helps users discover and configure PHP refactoring rules.

## Build, Lint, and Test Commands
- **Python**: `pytest tests/` for all tests, `pytest tests/test_file.py::test_name` for single test
- **TypeScript**: `npm test` for all tests, `npm test -- testName` for single test
- **Install**: `pip install -e .` (Python) or `npm install` (TypeScript)
- **Lint**: `ruff check .` (Python) or `npm run lint` (TypeScript)
- **Type check**: `mypy .` (Python) or `npm run typecheck` (TypeScript)

## Code Style Guidelines
- **MCP Tools**: Each tool should have clear name, description, and input schema following MCP spec
- **Rector Context**: Reference official Rector documentation and rule sets when implementing
- **Imports**: Group stdlib, third-party, MCP SDK, and local imports separately
- **Types**: Use strict typing (Python type hints / TypeScript interfaces) for all MCP handlers
- **Naming**: snake_case for Python, camelCase for TypeScript; tool names use kebab-case
- **Error Handling**: Catch and return structured errors via MCP error responses
- **Validation**: Validate all user inputs before processing Rector rules
- **Testing**: Test each MCP tool handler independently with mock Rector rule data
- **Documentation**: Document each tool's purpose, inputs, and example Rector rules it helps configure
