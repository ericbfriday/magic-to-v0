# Magic MCP Server

Production-ready Model Context Protocol (MCP) server with Hono.js REST API and comprehensive authentication. A complete drop-in replacement for [@21st-dev/magic](https://github.com/21st-dev/magic-mcp) with added REST API capabilities, multiple authentication methods, and enterprise-ready features.

## Features

### Core Functionality
- **UI Component Generation**: AI-powered creation of modern React UI components
- **Component Library**: Access to curated component library from 21st.dev
- **Component Refinement**: Improve and enhance existing UI components
- **Logo Search**: Search and convert company logos to JSX/TSX/SVG format
- **Real-time Previews**: Interactive browser-based component generation

### Server Modes
- **STDIO Mode**: Original MCP protocol over standard input/output
- **HTTP Mode**: RESTful API with comprehensive endpoints
- **Dual Mode**: Run both STDIO and HTTP simultaneously (default)

### Authentication Methods
- **API Keys**: Header-based (`x-api-key`) and query parameter (`?api_key=`) support
- **OIDC/OAuth 2.0**: Full OpenID Connect support with JWT validation
- **Basic HTTP Auth**: Username/password authentication

### Production Features
- Comprehensive error handling and logging
- Request/response validation with Zod
- CORS configuration for cross-origin requests
- Health check endpoints for monitoring
- TypeScript with strict type safety
- Docker support for containerized deployment

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Authentication Setup](#authentication-setup)
- [API Documentation](#api-documentation)
- [MCP Tool Documentation](#mcp-tool-documentation)
- [Deployment](#deployment)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- 21st.dev API key ([Get one here](https://21st.dev/magic))

### Install from npm

```bash
npm install -g @magic-mcp/server
```

### Install from source

```bash
git clone https://github.com/yourusername/magic-mcp-server.git
cd magic-mcp-server
npm install
npm run build
```

## Quick Start

### 1. Configure Environment

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` and set at least:
```env
API_KEY=your-21st-dev-api-key
AUTH_API_KEYS=your-secure-api-key
```

### 2. Start the Server

#### Dual Mode (Default - Both HTTP and STDIO)
```bash
npm start
```

#### HTTP API Mode Only
```bash
npm run start:http
```

#### STDIO Mode Only (Original MCP)
```bash
npm run start:stdio
```

### 3. Test the Server

#### Test HTTP API
```bash
curl -X POST http://localhost:3000/api/create-ui \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secure-api-key" \
  -d '{
    "message": "Create a dark mode toggle button",
    "searchQuery": "dark mode button",
    "absolutePathToCurrentFile": "/path/to/file.tsx",
    "absolutePathToProjectDirectory": "/path/to/project",
    "standaloneRequestQuery": "dark mode toggle button component"
  }'
```

#### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

#### Test MCP STDIO (using MCP Inspector)
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | number | `3000` | HTTP server port |
| `HOST` | string | `0.0.0.0` | HTTP server host |
| `SERVER_MODE` | enum | `dual` | Server mode: `http`, `stdio`, or `dual` |
| `API_KEY` | string | - | 21st.dev Magic API key |
| `BASE_URL` | string | `https://magic.21st.dev` | 21st.dev API base URL |
| `DEBUG` | boolean | `false` | Enable debug mode (uses localhost:3005) |
| `AUTH_ENABLED` | boolean | `true` | Enable/disable authentication |
| `AUTH_METHODS` | string | `api-key` | Comma-separated auth methods |
| `AUTH_API_KEYS` | string | - | Comma-separated valid API keys |
| `LOG_LEVEL` | enum | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | enum | `json` | Log format: `json` or `pretty` |

For complete list of environment variables, see [.env.example](.env.example).

### Server Modes

#### HTTP Mode
Pure REST API server without STDIO functionality.
```bash
SERVER_MODE=http npm start
```

Use cases:
- Remote access via HTTP
- Microservices architecture
- Load-balanced deployments

#### STDIO Mode
Original MCP protocol over standard input/output.
```bash
SERVER_MODE=stdio npm start
```

Use cases:
- Local MCP client integration
- IDE extensions
- Command-line tools

#### Dual Mode (Recommended)
Runs both HTTP and STDIO servers simultaneously.
```bash
SERVER_MODE=dual npm start
```

Use cases:
- Maximum flexibility
- Support both local and remote clients
- Development and testing

## Authentication Setup

### API Key Authentication

The simplest authentication method. API keys can be provided via header or query parameter.

#### Setup

1. Generate secure API keys:
```bash
# On Linux/macOS
openssl rand -hex 32

# On Windows (PowerShell)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

2. Configure in `.env`:
```env
AUTH_ENABLED=true
AUTH_METHODS=api-key
AUTH_API_KEYS=key1,key2,key3
```

#### Usage

Via header:
```bash
curl -H "x-api-key: your-api-key" http://localhost:3000/api/create-ui
```

Via query parameter:
```bash
curl "http://localhost:3000/api/create-ui?api_key=your-api-key"
```

### OIDC/OAuth 2.0 Authentication

Full OpenID Connect support with JWT token validation.

#### Setup

1. Configure your OIDC provider (Auth0, Okta, Keycloak, etc.)

2. Configure in `.env`:
```env
AUTH_ENABLED=true
AUTH_METHODS=oidc
OIDC_ISSUER=https://your-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_AUDIENCE=your-api-audience
```

#### Usage

```bash
curl -H "Authorization: Bearer your-jwt-token" \
  http://localhost:3000/api/create-ui
```

#### Supported OIDC Providers

- **Auth0**: Set `OIDC_ISSUER=https://YOUR_DOMAIN.auth0.com`
- **Okta**: Set `OIDC_ISSUER=https://YOUR_DOMAIN.okta.com/oauth2/default`
- **Keycloak**: Set `OIDC_ISSUER=https://YOUR_DOMAIN/auth/realms/YOUR_REALM`
- **Azure AD**: Set `OIDC_ISSUER=https://login.microsoftonline.com/YOUR_TENANT/v2.0`

### Basic HTTP Authentication

Username/password authentication with SHA-256 password hashing.

#### Setup

1. Generate password hashes:
```bash
# Linux/macOS
echo -n 'yourpassword' | sha256sum

# Windows (PowerShell)
$password = "yourpassword"
$hasher = [System.Security.Cryptography.SHA256]::Create()
$hash = $hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($password))
[System.BitConverter]::ToString($hash).Replace("-","").ToLower()
```

2. Configure in `.env`:
```env
AUTH_ENABLED=true
AUTH_METHODS=basic
BASIC_AUTH_USERS={"admin":"5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8","user":"e606e38b0d8c19b24cf0ee3808183162ea7cd63ff7912dbb22b5e803286b4446"}
```

#### Usage

```bash
curl -u admin:password http://localhost:3000/api/create-ui
```

### Multiple Authentication Methods

You can enable multiple authentication methods simultaneously. The server will try each method until one succeeds.

```env
AUTH_METHODS=api-key,oidc,basic
```

Clients can then use any of the configured authentication methods.

## API Documentation

### Base URL
```
http://localhost:3000
```

### Common Headers
```
Content-Type: application/json
x-api-key: your-api-key (for API key auth)
Authorization: Bearer token (for OIDC auth)
Authorization: Basic base64 (for Basic auth)
```

### Response Format

All endpoints return JSON in this format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Endpoints

#### Health Check

##### GET `/health`
Basic health check

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T12:00:00.000Z",
  "uptime": 12345.678
}
```

##### GET `/health/detailed`
Detailed health with configuration info

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "mode": "dual",
  "auth": {
    "enabled": true,
    "methods": ["api-key", "oidc"]
  },
  "timestamp": "2025-01-11T12:00:00.000Z",
  "uptime": 12345.678
}
```

#### Create UI Component

##### POST `/api/create-ui`
Generate a new UI component through browser interaction with 21st.dev

**Request Body:**
```json
{
  "message": "Create a responsive pricing table",
  "searchQuery": "pricing table",
  "absolutePathToCurrentFile": "/path/to/file.tsx",
  "absolutePathToProjectDirectory": "/path/to/project",
  "standaloneRequestQuery": "responsive pricing table component with 3 tiers"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "type": "text",
        "text": "// Component code here\n\n## Shadcn/ui instructions\n..."
      }
    ]
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

**Notes:**
- Opens a browser window to 21st.dev/magic-chat
- Waits for user to generate component
- Returns component code with shadcn/ui integration instructions
- Timeout: 10 minutes (600000ms)

#### Fetch UI Component

##### POST `/api/fetch-ui`
Fetch component inspiration from 21st.dev library

**Request Body:**
```json
{
  "message": "Show me login form examples",
  "searchQuery": "login form"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "type": "text",
        "text": "// Component previews and examples"
      }
    ]
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

#### Refine UI Component

##### POST `/api/refine-ui`
Refine and improve an existing UI component

**Request Body:**
```json
{
  "userMessage": "Make it more modern with better animations",
  "absolutePathToRefiningFile": "/path/to/component.tsx",
  "fileContent": "// Optional: existing component code",
  "context": "The button needs hover effects and smooth transitions"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "type": "text",
        "text": "// Refined component code"
      }
    ]
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

**Notes:**
- If `fileContent` is not provided, the server will read from `absolutePathToRefiningFile`
- `context` should describe specific improvements needed

#### Logo Search

##### POST `/api/logo-search`
Search for company logos and convert to JSX/TSX/SVG

**Request Body:**
```json
{
  "queries": ["github", "discord", "slack"],
  "format": "TSX"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "icons": [
      {
        "icon": "GithubIcon",
        "code": "const GithubIcon: React.FC = () => (<svg>...</svg>)"
      }
    ],
    "notFound": [
      {
        "icon": "unknowncompany",
        "alternatives": [
          "Search for SVG version on the official website",
          "Check other icon libraries (e.g., heroicons, lucide)"
        ]
      }
    ],
    "setup": "1. Add these icons to your project:\n..."
  },
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

**Formats:**
- `JSX`: JavaScript React component
- `TSX`: TypeScript React component
- `SVG`: Raw SVG markup

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Validation error - Invalid request data |
| 401 | Authentication error - Missing or invalid credentials |
| 403 | Authorization error - Access denied |
| 404 | Not found |
| 500 | Internal server error |
| 502 | External service error (21st.dev API failure) |
| 504 | Timeout error |

## MCP Tool Documentation

When running in STDIO mode, the server exposes MCP tools compatible with the original @21st-dev/magic server.

### Available Tools

#### `21st_magic_component_builder`
Create new UI components through browser interaction

**Input Schema:**
```typescript
{
  message: string;
  searchQuery: string;
  absolutePathToCurrentFile: string;
  absolutePathToProjectDirectory: string;
  standaloneRequestQuery: string;
}
```

**Usage in MCP Client:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "21st_magic_component_builder",
    "arguments": {
      "message": "Create a modal dialog",
      "searchQuery": "modal",
      "absolutePathToCurrentFile": "/path/to/file.tsx",
      "absolutePathToProjectDirectory": "/path/to/project",
      "standaloneRequestQuery": "modal dialog component"
    }
  }
}
```

#### `21st_magic_component_inspiration`
Fetch component inspiration from library

**Input Schema:**
```typescript
{
  message: string;
  searchQuery: string;
}
```

#### `21st_magic_component_refiner`
Refine existing UI components

**Input Schema:**
```typescript
{
  userMessage: string;
  absolutePathToRefiningFile: string;
  context: string;
}
```

#### `logo_search`
Search and convert company logos

**Input Schema:**
```typescript
{
  queries: string[];
  format: 'JSX' | 'TSX' | 'SVG';
}
```

### MCP Configuration

#### Cursor IDE
Add to `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "magic": {
      "command": "node",
      "args": ["/path/to/magic-mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "your-21st-dev-api-key"
      }
    }
  }
}
```

#### Windsurf
Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "magic": {
      "command": "node",
      "args": ["/path/to/magic-mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "your-21st-dev-api-key"
      }
    }
  }
}
```

#### Claude Desktop
Add to `~/.claude/mcp_config.json`:
```json
{
  "mcpServers": {
    "magic": {
      "command": "node",
      "args": ["/path/to/magic-mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "your-21st-dev-api-key"
      }
    }
  }
}
```

## Deployment

### Docker

#### Build Image
```bash
docker build -t magic-mcp-server .
```

#### Run Container
```bash
docker run -d \
  --name magic-mcp \
  -p 3000:3000 \
  --env-file .env \
  magic-mcp-server
```

#### Docker Compose
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  magic-mcp:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run:
```bash
docker-compose up -d
```

### Kubernetes

Create `deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: magic-mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: magic-mcp
  template:
    metadata:
      labels:
        app: magic-mcp
    spec:
      containers:
      - name: magic-mcp
        image: magic-mcp-server:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: magic-mcp-secrets
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: magic-mcp-service
spec:
  selector:
    app: magic-mcp
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f deployment.yaml
```

### systemd Service

Create `/etc/systemd/system/magic-mcp.service`:
```ini
[Unit]
Description=Magic MCP Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/magic-mcp-server
EnvironmentFile=/opt/magic-mcp-server/.env
ExecStart=/usr/bin/node /opt/magic-mcp-server/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable magic-mcp
sudo systemctl start magic-mcp
sudo systemctl status magic-mcp
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name magic-mcp.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/yourusername/magic-mcp-server.git
cd magic-mcp-server

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Build project
npm run build
```

### Development Commands

```bash
# Watch mode with auto-rebuild
npm run dev

# Watch mode - HTTP only
npm run dev:http

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Testing
npm test
npm run test:watch

# Debug with MCP Inspector
npm run debug
```

### Project Structure

```
src/
├── index.ts                 # Main entry point
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   ├── config.ts           # Configuration management
│   ├── logger.ts           # Structured logging
│   ├── errors.ts           # Custom error classes
│   ├── validation.ts       # Zod schemas
│   └── http-client.ts      # HTTP client for 21st.dev
├── middleware/
│   ├── auth.ts             # Auth orchestrator
│   ├── api-key-auth.ts     # API key authentication
│   ├── basic-auth.ts       # Basic authentication
│   └── oidc-auth.ts        # OIDC authentication
├── services/
│   ├── callback-server.ts  # HTTP callback server
│   ├── ui-service.ts       # UI operations service
│   └── logo-service.ts     # Logo search service
├── routes/
│   ├── health.ts           # Health check endpoints
│   ├── create-ui.ts        # POST /api/create-ui
│   ├── fetch-ui.ts         # POST /api/fetch-ui
│   ├── refine-ui.ts        # POST /api/refine-ui
│   └── logo-search.ts      # POST /api/logo-search
└── server/
    ├── hono-server.ts      # Hono.js HTTP server
    └── mcp-server.ts       # MCP STDIO server
```

### Adding New Endpoints

1. Create route handler in `src/routes/`:
```typescript
import { Hono } from 'hono';
import { myService } from '../services/my-service.js';

export const myRoute = new Hono();

myRoute.post('/api/my-endpoint', async (c) => {
  const body = await c.req.json();
  const result = await myService.doSomething(body);
  return c.json({ success: true, data: result });
});
```

2. Register route in `src/server/hono-server.ts`:
```typescript
import { myRoute } from '../routes/my-route.js';

app.route('/', myRoute);
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

Example test:
```typescript
import { describe, expect, test } from '@jest/globals';
import { uiService } from '../services/ui-service.js';

describe('UiService', () => {
  test('creates UI component', async () => {
    const result = await uiService.createUi({
      message: 'Create button',
      searchQuery: 'button',
      // ... other fields
    });

    expect(result.content).toBeDefined();
  });
});
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Change the port in `.env`: `PORT=3001`
- Or kill the process using the port:
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Authentication Failed
```
401 Unauthorized: Authentication failed
```

**Solutions:**
- Verify API key is correct
- Check header/query parameter name
- For OIDC: Verify token is valid and not expired
- For Basic: Verify password hash is correct

#### 21st.dev API Error
```
502 Bad Gateway: 21st.dev API request failed
```

**Solutions:**
- Verify your 21st.dev API key is valid
- Check if 21st.dev service is accessible
- Review API usage limits
- Check network connectivity

#### Callback Server Timeout
```
504 Gateway Timeout: Operation timed out
```

**Solutions:**
- Increase timeout: `CALLBACK_TIMEOUT=900000` (15 minutes)
- Check if browser window opened successfully
- Verify 21st.dev website is accessible
- Check firewall rules for localhost communication

#### Module Not Found
```
Error: Cannot find module './utils/config.js'
```

**Solution:**
- Rebuild the project: `npm run build`
- Clear dist folder: `npm run clean && npm run build`
- Check all imports use `.js` extension (required for ES modules)

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

Run with Node.js debugging:
```bash
node --inspect dist/index.js
```

Use MCP Inspector for STDIO debugging:
```bash
npm run debug
```

### Logs

View logs in pretty format:
```bash
LOG_FORMAT=pretty npm start
```

View logs in JSON format (for log aggregation):
```bash
LOG_FORMAT=json npm start
```

### Health Checks

Check server health:
```bash
# Basic health
curl http://localhost:3000/health

# Detailed health
curl http://localhost:3000/health/detailed

# Readiness probe
curl http://localhost:3000/health/ready

# Liveness probe
curl http://localhost:3000/health/live
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/magic-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/magic-mcp-server/discussions)
- **Original Project**: [@21st-dev/magic](https://github.com/21st-dev/magic-mcp)

## Acknowledgments

This project is a drop-in replacement and enhancement of [@21st-dev/magic](https://github.com/21st-dev/magic-mcp) created by [21st.dev](https://21st.dev). All credit for the original MCP tool functionality goes to the 21st.dev team.
