# Magic MCP Server API Documentation

Complete API reference for the Magic MCP Server REST API.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health Checks](#health-checks)
  - [UI Operations](#ui-operations)
  - [Logo Search](#logo-search)

## Overview

**Base URL:** `http://localhost:3000` (default)

**Content Type:** `application/json`

**API Version:** `1.0.0`

## Authentication

The API supports three authentication methods. At least one method must be used for all API requests (except health checks).

### Method 1: API Key (Header)

```http
GET /api/endpoint HTTP/1.1
Host: localhost:3000
x-api-key: your-api-key-here
Content-Type: application/json
```

### Method 2: API Key (Query Parameter)

```http
GET /api/endpoint?api_key=your-api-key-here HTTP/1.1
Host: localhost:3000
Content-Type: application/json
```

### Method 3: Bearer Token (OIDC/OAuth 2.0)

```http
GET /api/endpoint HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Method 4: Basic Authentication

```http
GET /api/endpoint HTTP/1.1
Host: localhost:3000
Authorization: Basic YWRtaW46cGFzc3dvcmQ=
Content-Type: application/json
```

## Request/Response Format

### Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

### Error Response

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    // Optional additional error details
  },
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request data (validation error) |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid authentication but access denied |
| 404 | Not Found | Endpoint or resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | External service (21st.dev) error |
| 504 | Gateway Timeout | Request timeout |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Access denied |
| `NOT_FOUND` | Resource not found |
| `EXTERNAL_SERVICE_ERROR` | External API error |
| `TIMEOUT_ERROR` | Operation timeout |

### Example Error Response

```json
{
  "success": false,
  "error": "Validation failed for request body",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [
      {
        "field": "searchQuery",
        "message": "String must contain at least 1 character(s)"
      }
    ]
  },
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

## Rate Limiting

Currently, rate limiting is not enforced by this server. However, the upstream 21st.dev API may have its own rate limits. Check their documentation for details.

## Endpoints

### Health Checks

Health check endpoints do not require authentication.

#### GET `/health`

Basic health check endpoint.

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T12:34:56.789Z",
  "uptime": 12345.678
}
```

**cURL Example:**
```bash
curl http://localhost:3000/health
```

---

#### GET `/health/detailed`

Detailed health information including configuration.

**Response 200:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "mode": "dual",
  "auth": {
    "enabled": true,
    "methods": ["api-key", "oidc"]
  },
  "config": {
    "baseUrl": "https://magic.21st.dev"
  },
  "timestamp": "2025-01-11T12:34:56.789Z",
  "uptime": 12345.678
}
```

**cURL Example:**
```bash
curl http://localhost:3000/health/detailed
```

---

#### GET `/health/ready`

Kubernetes readiness probe endpoint.

**Response 200:**
```json
{
  "ready": true,
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

---

#### GET `/health/live`

Kubernetes liveness probe endpoint.

**Response 200:**
```json
{
  "alive": true,
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

---

### UI Operations

All UI endpoints require authentication.

#### POST `/api/create-ui`

Generate a new UI component using the configured UI provider (Magic UI or v0.dev).

**Request Body:**
```json
{
  "message": "Create a responsive pricing table with 3 tiers",
  "searchQuery": "pricing table",
  "absolutePathToCurrentFile": "/Users/username/project/src/components/Pricing.tsx",
  "absolutePathToProjectDirectory": "/Users/username/project",
  "standaloneRequestQuery": "responsive pricing table component with 3 tiers, annual and monthly toggle"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Full user message describing the desired component |
| `searchQuery` | string | Yes | 2-4 word search query for 21st.dev component library |
| `absolutePathToCurrentFile` | string | Yes | Absolute path to the file where component will be added |
| `absolutePathToProjectDirectory` | string | Yes | Absolute path to the project root directory |
| `standaloneRequestQuery` | string | Yes | Detailed description of the component to create |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "text": "import { Card } from '@/components/ui/card';\n\nexport function PricingTable() {\n  return (\n    // Component code here\n  );\n}\n\n## Shadcn/ui instructions\n...",
    "previewUrl": "https://v0.dev/chat/abc123",
    "provider": "v0"
  },
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

**Response Fields:**

| Field | Type | Present | Description |
|-------|------|---------|-------------|
| `text` | string | Always | Component code with integration instructions |
| `previewUrl` | string | v0 only | Live preview URL (v0.dev chat interface) |
| `provider` | string | Always | Active provider: `magic` or `v0` |

**Behavior:**

**Magic UI Provider** (default):
1. Server opens browser window to `http://21st.dev/magic-chat`
2. User interacts with 21st.dev to generate component
3. Component data sent back via callback server
4. Server returns component code

**v0.dev Provider**:
1. Server makes direct API call to v0.dev Platform API
2. Component generated instantly via AI
3. Server returns component code with preview URL

**Timeout:** 10 minutes (600000ms) - Magic UI only

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/create-ui \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "message": "Create a responsive pricing table with 3 tiers",
    "searchQuery": "pricing table",
    "absolutePathToCurrentFile": "/path/to/file.tsx",
    "absolutePathToProjectDirectory": "/path/to/project",
    "standaloneRequestQuery": "responsive pricing table with 3 tiers"
  }'
```

**Errors:**
- `400`: Invalid request data
- `401`: Authentication required
- `502`: 21st.dev API error
- `504`: Timeout waiting for component generation

---

#### POST `/api/fetch-ui`

Fetch UI component inspiration and examples from 21st.dev library without generating new code.

**Request Body:**
```json
{
  "message": "Show me examples of modern login forms",
  "searchQuery": "login form"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Full user message describing what to search for |
| `searchQuery` | string | Yes | 2-4 word search query for component library |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "text": "Here are some modern login form examples:\n\n1. **Minimal Login Form**\n   - Email/password fields\n   - Social login buttons\n   - Forgot password link\n\n2. **Two-Column Login**\n   - Left: Brand/image\n   - Right: Login form\n\n[Additional examples and code snippets]",
    "previewUrl": "https://v0.dev/chat/abc123",
    "provider": "v0"
  },
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

**Response Fields:**

| Field | Type | Present | Description |
|-------|------|---------|-------------|
| `text` | string | Always | Component examples and inspiration |
| `previewUrl` | string | v0 only | Live preview URL (v0.dev chat interface) |
| `provider` | string | Always | Active provider: `magic` or `v0` |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/fetch-ui \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "message": "Show me examples of modern login forms",
    "searchQuery": "login form"
  }'
```

**Errors:**
- `400`: Invalid request data
- `401`: Authentication required
- `502`: 21st.dev API error

---

#### POST `/api/refine-ui`

Refine and improve an existing UI component.

**Request Body:**
```json
{
  "userMessage": "Make the button more modern with hover effects",
  "absolutePathToRefiningFile": "/Users/username/project/src/components/Button.tsx",
  "fileContent": "// Optional: existing component code\nexport function Button() {\n  return <button>Click me</button>;\n}",
  "context": "The button needs smooth hover transitions and a modern gradient background"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userMessage` | string | Yes | Description of desired improvements |
| `absolutePathToRefiningFile` | string | Yes | Absolute path to the file to refine |
| `fileContent` | string | No | Existing component code (if not provided, reads from file) |
| `context` | string | Yes | Specific aspects to improve (styling, layout, etc.) |
| `sessionId` | string | No | Session ID from previous v0 response (enables chat continuity) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "text": "import { motion } from 'framer-motion';\n\nexport function Button() {\n  return (\n    <motion.button\n      whileHover={{ scale: 1.05 }}\n      className=\"bg-gradient-to-r from-blue-500 to-purple-600...\"\n    >\n      Click me\n    </motion.button>\n  );\n}\n\n## Changes Made:\n1. Added Framer Motion for animations\n2. Implemented gradient background\n...",
    "previewUrl": "https://v0.dev/chat/abc123",
    "sessionId": "abc123",
    "provider": "v0"
  },
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

**Response Fields:**

| Field | Type | Present | Description |
|-------|------|---------|-------------|
| `text` | string | Always | Refined component code with change description |
| `previewUrl` | string | v0 only | Live preview URL (v0.dev chat interface) |
| `sessionId` | string | v0 only | Session ID for continued refinements (v0.dev chat ID) |
| `provider` | string | Always | Active provider: `magic` or `v0` |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/refine-ui \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "userMessage": "Make the button more modern with hover effects",
    "absolutePathToRefiningFile": "/path/to/Button.tsx",
    "context": "Needs smooth transitions and gradient background"
  }'
```

**Notes:**
- If `fileContent` is not provided, server will attempt to read from `absolutePathToRefiningFile`
- File reading only works when server has filesystem access to the specified path

**Errors:**
- `400`: Invalid request data or unable to read file
- `401`: Authentication required
- `502`: 21st.dev API error

---

### Logo Search

#### POST `/api/logo-search`

Search for company logos and convert them to JSX/TSX/SVG format.

**Request Body:**
```json
{
  "queries": ["github", "discord", "slack", "notion"],
  "format": "TSX"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `queries` | string[] | Yes | Array of company names to search (1-10 items) |
| `format` | enum | Yes | Output format: `JSX`, `TSX`, or `SVG` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "icons": [
      {
        "icon": "GithubIcon",
        "code": "const GithubIcon: React.FC = () => (\n  <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"currentColor\">\n    <path d=\"M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z\"/>\n  </svg>\n)"
      },
      {
        "icon": "DiscordIcon",
        "code": "const DiscordIcon: React.FC = () => (\n  <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"currentColor\">\n    <!-- SVG path data -->\n  </svg>\n)"
      }
    ],
    "notFound": [
      {
        "icon": "unknowncompany",
        "alternatives": [
          "Search for SVG version on the official website",
          "Check other icon libraries (e.g., heroicons, lucide)",
          "Request SVG file from the user"
        ]
      }
    ],
    "setup": "1. Add these icons to your project:\n   GithubIcon.tsx\n   DiscordIcon.tsx\n2. Import and use like this:\n```tsx\nimport { GithubIcon, DiscordIcon } from '@/icons';\n```"
  },
  "timestamp": "2025-01-11T12:34:56.789Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `icons` | array | Successfully found and converted logos |
| `icons[].icon` | string | Component name (e.g., "GithubIcon") |
| `icons[].code` | string | Complete component code in requested format |
| `notFound` | array | Logos that could not be found |
| `notFound[].icon` | string | Search query that failed |
| `notFound[].alternatives` | string[] | Suggested alternatives |
| `setup` | string | Setup and usage instructions |

**Format Examples:**

**JSX:**
```javascript
function GithubIcon() { return (<svg>...</svg>) }
```

**TSX:**
```typescript
const GithubIcon: React.FC = () => (<svg>...</svg>)
```

**SVG:**
```xml
<svg width="24" height="24" viewBox="0 0 24 24">...</svg>
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/logo-search \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "queries": ["github", "discord", "slack"],
    "format": "TSX"
  }'
```

**Logo Source:**
Logos are fetched from [SVGL](https://svgl.app/), a free SVG logo library.

**Errors:**
- `400`: Invalid request data (invalid format, too many queries, etc.)
- `401`: Authentication required
- `502`: SVGL API error

---

## Pagination

Currently, pagination is not supported. All data is returned in a single response.

## Versioning

API version is included in the response for informational purposes. Breaking changes will be announced in advance.

Current version: `1.0.0`

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/magic-mcp-server/issues
- Documentation: https://github.com/yourusername/magic-mcp-server

## Changelog

### v1.0.0 (2025-01-11)
- Initial release
- Four main endpoints: create-ui, fetch-ui, refine-ui, logo-search
- Three authentication methods: API key, OIDC, Basic auth
- Health check endpoints
- Docker support
