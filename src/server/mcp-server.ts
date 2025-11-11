/**
 * Original MCP STDIO server for compatibility
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { uiService } from '../services/ui-service.js';
import { logoService } from '../services/logo-service.js';
import {
  createUiSchema,
  fetchUiSchema,
  refineUiSchema,
  logoSearchSchema,
} from '../utils/validation.js';
import { promises as fs } from 'fs';

/**
 * MCP Tool definitions
 */
const TOOLS = [
  {
    name: '21st_magic_component_builder',
    description: `Use this tool when the user requests a new UI component—e.g., mentions /ui, /21 /21st, or asks for a button, input, dialog, table, form, banner, card, or other React component.
This tool ONLY returns the text snippet for that UI component.
After calling this tool, you must edit or add files to integrate the snippet into the codebase.`,
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Full users message',
        },
        searchQuery: {
          type: 'string',
          description:
            "Generate a search query for 21st.dev (library for searching UI components) to find a UI component that matches the user's message. Must be a two-four words max or phrase",
        },
        absolutePathToCurrentFile: {
          type: 'string',
          description:
            'Absolute path to the current file to which we want to apply changes',
        },
        absolutePathToProjectDirectory: {
          type: 'string',
          description: 'Absolute path to the project root directory',
        },
        standaloneRequestQuery: {
          type: 'string',
          description:
            "You need to formulate what component user wants to create, based on his message, possible chat history and a place where he makes the request. Extract additional context about what should be done to create a ui component/page based on the user's message, search query, and conversation history, files. Don't hallucinate and be on point.",
        },
      },
      required: [
        'message',
        'searchQuery',
        'absolutePathToCurrentFile',
        'absolutePathToProjectDirectory',
        'standaloneRequestQuery',
      ],
    },
  },
  {
    name: '21st_magic_component_inspiration',
    description: `Use this tool when the user wants to see component, get inspiration, or /21st fetch data and previews from 21st.dev. This tool returns the JSON data of matching components without generating new code. This tool ONLY returns the text snippet for that UI component.
After calling this tool, you must edit or add files to integrate the snippet into the codebase.`,
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Full users message',
        },
        searchQuery: {
          type: 'string',
          description:
            "Search query for 21st.dev (library for searching UI components) to find a UI component that matches the user's message. Must be a two-four words max or phrase",
        },
      },
      required: ['message', 'searchQuery'],
    },
  },
  {
    name: '21st_magic_component_refiner',
    description: `Use this tool when the user requests to re-design/refine/improve current UI component with /ui or /21 commands,
or when context is about improving, or refining UI for a React component or molecule (NOT for big pages).
This tool improves UI of components and returns redesigned version of the component and instructions on how to implement it.`,
    inputSchema: {
      type: 'object',
      properties: {
        userMessage: {
          type: 'string',
          description: "Full user's message about UI refinement",
        },
        absolutePathToRefiningFile: {
          type: 'string',
          description: 'Absolute path to the file that needs to be refined',
        },
        context: {
          type: 'string',
          description:
            'Extract the specific UI elements and aspects that need improvement based on user messages, code, and conversation history. Identify exactly which components (buttons, forms, modals, etc.) the user is referring to and what aspects (styling, layout, responsiveness, etc.) they want to enhance. Do not include generic improvements - focus only on what the user explicitly mentions or what can be reasonably inferred from the available context. If nothing specific is mentioned or you cannot determine what needs improvement, return an empty string.',
        },
      },
      required: ['userMessage', 'absolutePathToRefiningFile', 'context'],
    },
  },
  {
    name: 'logo_search',
    description: `Search and return logos in specified format (JSX, TSX, SVG).
Supports single and multiple logo searches with category filtering.
Can return logos in different themes (light/dark) if available.

When to use this tool:
1. When user types "/logo" command (e.g., "/logo GitHub")
2. When user asks to add a company logo that's not in the local project

Example queries:
- Single company: ["discord"]
- Multiple companies: ["discord", "github", "slack"]
- Specific brand: ["microsoft office"]
- Command style: "/logo GitHub" -> ["github"]
- Request style: "Add Discord logo to the project" -> ["discord"]

Format options:
- TSX: Returns TypeScript React component
- JSX: Returns JavaScript React component
- SVG: Returns raw SVG markup

Each result includes:
- Component name (e.g., DiscordIcon)
- Component code
- Import instructions`,
    inputSchema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'List of company names to search for logos',
        },
        format: {
          type: 'string',
          enum: ['JSX', 'TSX', 'SVG'],
          description: 'Output format',
        },
      },
      required: ['queries', 'format'],
    },
  },
];

/**
 * Create and configure MCP server
 */
export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'magic-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('MCP: Listing tools');
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info('MCP: Tool called', { name, args });

    try {
      switch (name) {
        case '21st_magic_component_builder': {
          const validated = createUiSchema.parse(args);
          const result = await uiService.createUi(validated);
          return {
            content: [{ type: 'text' as const, text: result }],
          };
        }

        case '21st_magic_component_inspiration': {
          const validated = fetchUiSchema.parse(args);
          const result = await uiService.fetchUi(validated);
          return {
            content: [{ type: 'text' as const, text: result }],
          };
        }

        case '21st_magic_component_refiner': {
          const validated = refineUiSchema.parse(args);
          const fileContent = await fs.readFile(
            validated.absolutePathToRefiningFile,
            'utf-8'
          );
          const result = await uiService.refineUi(validated, fileContent);
          return {
            content: [{ type: 'text' as const, text: result }],
          };
        }

        case 'logo_search': {
          const validated = logoSearchSchema.parse(args);
          const result = await logoService.searchLogos(validated);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error('MCP: Tool execution failed', error, { name, args });
      throw error;
    }
  });

  // Handle server errors
  server.onerror = (error) => {
    logger.error('MCP: Server error', error);
  };

  return server;
}

/**
 * Start MCP STDIO server
 */
export async function startMCPServer(): Promise<void> {
  logger.info('Starting MCP STDIO server');

  const server = createMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  logger.info('MCP STDIO server started');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('MCP: Received SIGINT, shutting down');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('MCP: Received SIGTERM, shutting down');
    await server.close();
    process.exit(0);
  });
}
