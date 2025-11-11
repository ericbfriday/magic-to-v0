# Getting Started Guide

Quick start guide to get your Magic MCP Server up and running in minutes.

## Prerequisites

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **21st.dev API Key** ([Get one here](https://21st.dev/magic))

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Hono.js (web framework)
- @modelcontextprotocol/sdk (MCP support)
- Zod (validation)
- jose (JWT validation)
- and more...

## Step 2: Configure Environment

### 2.1 Copy Environment Template

```bash
cp .env.example .env
```

### 2.2 Edit Configuration

Open `.env` and configure these essential settings:

#### Minimum Required Configuration:
```env
# Your 21st.dev API key (required)
API_KEY=your-21st-dev-api-key-here

# Authentication (required if AUTH_ENABLED=true)
AUTH_ENABLED=true
AUTH_METHODS=api-key
AUTH_API_KEYS=generate-a-secure-key-here
```

#### Generate Secure API Key:

**Linux/macOS:**
```bash
openssl rand -hex 32
```

**Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### 2.3 Optional Configuration

```env
# Server settings
PORT=3000
SERVER_MODE=dual  # 'http', 'stdio', or 'dual'

# Logging
LOG_LEVEL=info    # 'debug', 'info', 'warn', 'error'
LOG_FORMAT=json   # 'json' or 'pretty'
```

## Step 3: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Step 4: Start the Server

### Option A: Dual Mode (Recommended)
Runs both HTTP API and MCP STDIO simultaneously.

```bash
npm start
```

You should see:
```
[2025-01-11T12:00:00.000Z] INFO: Starting Magic MCP Server v1.0.0
[2025-01-11T12:00:00.000Z] INFO: Server mode: dual
[2025-01-11T12:00:00.000Z] INFO: HTTP server listening on http://0.0.0.0:3000
[2025-01-11T12:00:00.000Z] INFO: STDIO server ready
```

### Option B: HTTP Mode Only
For REST API access only.

```bash
npm run start:http
```

### Option C: STDIO Mode Only
For MCP protocol only (no HTTP).

```bash
npm run start:stdio
```

## Step 5: Test the Server

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T12:00:00.000Z",
  "uptime": 12.345
}
```

### Test API Endpoint

#### 5.1 Test Create UI (Quick Test)

```bash
curl -X POST http://localhost:3000/api/create-ui \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "message": "Create a simple button",
    "searchQuery": "button",
    "absolutePathToCurrentFile": "/tmp/test.tsx",
    "absolutePathToProjectDirectory": "/tmp",
    "standaloneRequestQuery": "simple button component"
  }'
```

**Note:** This will open a browser window to 21st.dev. Complete the UI generation in the browser.

#### 5.2 Test Logo Search

```bash
curl -X POST http://localhost:3000/api/logo-search \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "queries": ["github"],
    "format": "TSX"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "icons": [
      {
        "icon": "GithubIcon",
        "code": "const GithubIcon: React.FC = () => (..."
      }
    ],
    ...
  }
}
```

## Step 6: Use with MCP Clients

### Cursor IDE

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "magic": {
      "command": "node",
      "args": ["/absolute/path/to/magic-to-v0/dist/index.js"],
      "env": {
        "API_KEY": "your-21st-dev-api-key",
        "SERVER_MODE": "stdio"
      }
    }
  }
}
```

Restart Cursor and you'll have access to the `/ui` command!

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "magic": {
      "command": "node",
      "args": ["/absolute/path/to/magic-to-v0/dist/index.js"],
      "env": {
        "API_KEY": "your-21st-dev-api-key",
        "SERVER_MODE": "stdio"
      }
    }
  }
}
```

### Claude Desktop

Add to `~/.claude/mcp_config.json`:

```json
{
  "mcpServers": {
    "magic": {
      "command": "node",
      "args": ["/absolute/path/to/magic-to-v0/dist/index.js"],
      "env": {
        "API_KEY": "your-21st-dev-api-key",
        "SERVER_MODE": "stdio"
      }
    }
  }
}
```

## Development Mode

### Watch Mode with Auto-Rebuild

```bash
npm run dev
```

This will:
1. Watch for file changes in `src/`
2. Automatically rebuild
3. Restart the server

### Debug Mode

```bash
npm run debug
```

This opens the MCP Inspector for debugging STDIO communication.

## Docker Deployment

### Build Docker Image

```bash
docker build -t magic-mcp-server .
```

### Run Container

```bash
docker run -d \
  --name magic-mcp \
  -p 3000:3000 \
  -e API_KEY=your-21st-dev-key \
  -e AUTH_API_KEYS=your-secure-key \
  magic-mcp-server
```

### Using Docker Compose

```bash
# Edit docker-compose.yml and add your .env file
docker-compose up -d
```

## Troubleshooting

### Problem: Port 3000 already in use

**Solution 1:** Change port in `.env`
```env
PORT=3001
```

**Solution 2:** Kill the process
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problem: "Module not found" errors

**Solution:** Rebuild the project
```bash
npm run clean
npm run build
```

### Problem: Authentication failed

**Solution:** Check your API key in the request
```bash
# Make sure you're using the correct header
curl -H "x-api-key: YOUR_KEY" ...

# Or query parameter
curl "http://localhost:3000/api/endpoint?api_key=YOUR_KEY"
```

### Problem: Browser doesn't open for create-ui

**Solution:**
1. Check if `open` package is installed
2. Make sure you're on a system with a browser
3. For servers without browsers, use Docker with X11 forwarding or use the HTTP API from a machine with a browser

### Problem: TypeScript errors

**Solution:** Check Node.js version
```bash
node --version  # Should be >= 18.0.0
```

## Next Steps

### 1. Read the Documentation
- **README.md** - Full documentation
- **API.md** - API reference
- **IMPLEMENTATION_SUMMARY.md** - Technical details

### 2. Configure Authentication
Set up OIDC or Basic auth if needed (see README.md → Authentication Setup)

### 3. Set Up Monitoring
Configure health check endpoints with your monitoring system

### 4. Deploy to Production
- Use Docker/Kubernetes
- Set up reverse proxy (nginx)
- Configure TLS/SSL
- Set up log aggregation

### 5. Integrate with Your Workflow
- Add to your IDE (Cursor, Windsurf, etc.)
- Create custom scripts
- Build CI/CD pipelines

## Quick Reference

### Common Commands

```bash
# Development
npm install           # Install dependencies
npm run build         # Build project
npm start            # Start server
npm run dev          # Development mode
npm test             # Run tests

# Docker
docker build -t magic-mcp-server .
docker run -p 3000:3000 magic-mcp-server
docker-compose up -d

# Debugging
npm run debug        # MCP Inspector
npm run type-check   # TypeScript check
npm run lint         # Lint code
```

### Environment Variables Quick Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_KEY` | Yes | - | 21st.dev API key |
| `PORT` | No | 3000 | HTTP server port |
| `SERVER_MODE` | No | dual | Server mode |
| `AUTH_ENABLED` | No | true | Enable auth |
| `AUTH_METHODS` | No | api-key | Auth methods |
| `AUTH_API_KEYS` | If auth | - | Valid API keys |
| `LOG_LEVEL` | No | info | Log level |

### API Endpoints Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/create-ui` | POST | Create component |
| `/api/fetch-ui` | POST | Fetch inspiration |
| `/api/refine-ui` | POST | Refine component |
| `/api/logo-search` | POST | Search logos |

## Getting Help

- **Documentation**: [README.md](README.md), [API.md](API.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/magic-mcp-server/issues)
- **Original Project**: [@21st-dev/magic](https://github.com/21st-dev/magic-mcp)

---

🎉 **Congratulations!** You've successfully set up your Magic MCP Server.

For detailed information, see the full [README.md](README.md).
