# UI Provider Guide

Complete guide to choosing and configuring UI component generation providers in Magic MCP Server.

---

## Table of Contents

- [Overview](#overview)
- [Available Providers](#available-providers)
- [Quick Start](#quick-start)
- [Provider Comparison](#provider-comparison)
- [Magic UI Provider](#magic-ui-provider)
- [v0.dev Provider](#v0dev-provider)
- [Switching Providers](#switching-providers)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Overview

Magic MCP Server supports two UI component generation providers, allowing you to choose the best solution for your workflow:

1. **Magic UI** (21st.dev) - Interactive browser-based component generation
2. **v0** (v0.dev) - Direct API-based component generation with preview URLs

Both providers generate high-quality React components with shadcn/ui integration, but they differ in their approach and features.

---

## Available Providers

### Magic UI (21st.dev)

**Type**: Interactive browser-based generation
**Best For**: Visual designers, interactive workflows, real-time feedback
**Requires**: 21st.dev API key, browser access

**Key Features**:
- Interactive component design in browser
- Real-time visual feedback
- Automatic shadcn/ui detection
- No per-request costs beyond 21st.dev subscription

### v0 (v0.dev)

**Type**: Direct API-based generation
**Best For**: Automation, CI/CD, headless environments, iterative refinements
**Requires**: v0.dev API key

**Key Features**:
- No browser required
- Preview URLs for live testing
- Session continuity with chat history
- File arrays with structured component code
- Suitable for automated workflows

---

## Quick Start

### Step 1: Choose Your Provider

Decide which provider best fits your workflow:

- **Choose Magic UI if you want**:
  - Interactive visual design
  - Real-time browser feedback
  - Lower operational costs

- **Choose v0 if you want**:
  - Automated generation
  - Headless/CI environments
  - Preview URLs
  - Session-based refinements

### Step 2: Get API Key

**For Magic UI**:
1. Visit [21st.dev/magic](https://21st.dev/magic)
2. Sign up for an account
3. Copy your API key

**For v0**:
1. Visit [v0.dev/chat/settings/keys](https://v0.dev/chat/settings/keys)
2. Sign up for an account
3. Generate an API key

### Step 3: Configure Environment

Edit your `.env` file:

**For Magic UI** (default):
```env
UI_PROVIDER=magic
API_KEY=your-21st-dev-api-key
```

**For v0**:
```env
UI_PROVIDER=v0
V0_API_KEY=your-v0-api-key
```

### Step 4: Start Server

```bash
npm start
```

The server will automatically use your configured provider for all UI operations.

---

## Provider Comparison

### Feature Matrix

| Feature | Magic UI | v0 |
|---------|----------|-----|
| **Generation Method** | Browser-based | Direct API |
| **Browser Required** | ✅ Yes (create) | ❌ No |
| **Preview URLs** | ❌ No | ✅ Yes |
| **Session Continuity** | ❌ No | ✅ Yes |
| **File Arrays** | ❌ No | ✅ Yes |
| **Chat History** | ❌ No | ✅ Yes |
| **Headless/CI Compatible** | ❌ No | ✅ Yes |
| **Real-time Visual Feedback** | ✅ Yes | ❌ No |
| **Setup Complexity** | Low | Low |
| **Per-Request Cost** | Included | Yes |
| **Best For** | Interactive design | Automation |

### Use Case Recommendations

| Use Case | Recommended Provider | Why |
|----------|---------------------|-----|
| **Local Development** | Magic UI | Interactive visual feedback |
| **CI/CD Pipeline** | v0 | No browser required |
| **Headless Server** | v0 | API-only, no browser |
| **Iterative Refinements** | v0 | Session continuity |
| **Visual Design Work** | Magic UI | Real-time browser preview |
| **Automated Scripts** | v0 | Scriptable API calls |
| **Team Collaboration** | v0 | Preview URLs for sharing |
| **Cost-Sensitive** | Magic UI | No per-request costs |

---

## Magic UI Provider

### Overview

Magic UI uses the 21st.dev platform for interactive, browser-based component generation. This approach provides real-time visual feedback and interactive design capabilities.

### How It Works

1. **Server opens browser** to 21st.dev Magic Chat
2. **You interact** with the AI in your browser
3. **Component is generated** based on your conversation
4. **Server receives** the component via callback
5. **API returns** the component code

### Setup

#### 1. Get API Key

Visit [21st.dev/magic](https://21st.dev/magic) and sign up for an account to get your API key.

#### 2. Configure Environment

```env
# Provider selection
UI_PROVIDER=magic

# Magic UI configuration
API_KEY=your-21st-dev-api-key
BASE_URL=https://magic.21st.dev

# For local development (optional)
DEBUG=false
```

#### 3. Verify Configuration

```bash
npm start
```

Look for:
```
{"level":"info","message":"Creating UI provider","type":"magic"}
{"level":"info","message":"Starting dual-mode server"}
```

### Usage

#### Creating Components

When you call `POST /api/create-ui`, the server:
1. Opens your default browser to 21st.dev
2. Waits for you to complete the component design
3. Receives the component via callback
4. Returns the component code

```bash
curl -X POST http://localhost:3000/api/create-ui \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "message": "Create a pricing table",
    "searchQuery": "pricing table",
    "absolutePathToCurrentFile": "/path/to/file.tsx",
    "absolutePathToProjectDirectory": "/path/to/project",
    "standaloneRequestQuery": "modern pricing table component"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "text": "import { Card } from '@/components/ui/card';\n\n...",
    "provider": "magic"
  },
  "timestamp": "2025-01-11T..."
}
```

### Advantages

- ✅ **Interactive Design**: Real-time visual feedback
- ✅ **Cost Effective**: No per-request charges
- ✅ **Visual Verification**: See component before receiving code
- ✅ **Iterative Design**: Modify in real-time during generation

### Limitations

- ❌ **Requires Browser**: Not suitable for headless environments
- ❌ **No Preview URLs**: Can't share preview with team
- ❌ **No Session Continuity**: Each refinement is independent
- ❌ **Timeout Risk**: 10-minute timeout if browser left open

### Troubleshooting

**Problem**: Browser doesn't open
- **Solution**: Check that you have a default browser configured
- **Solution**: Verify firewall isn't blocking localhost connections

**Problem**: Timeout error
- **Solution**: Complete component design within 10 minutes
- **Solution**: Increase timeout: `CALLBACK_TIMEOUT=900000` (15 min)

**Problem**: "API key not configured" error
- **Solution**: Verify `API_KEY` in `.env`
- **Solution**: Restart server after configuration changes

---

## v0.dev Provider

### Overview

v0 uses the v0.dev Platform API for direct, API-based component generation. This approach is ideal for automation, headless environments, and workflows requiring preview URLs or session continuity.

### How It Works

1. **Server makes API call** to v0.dev
2. **AI generates component** instantly
3. **Server receives** component code and preview URL
4. **API returns** the component with metadata

### Setup

#### 1. Get API Key

1. Visit [v0.dev/chat/settings/keys](https://v0.dev/chat/settings/keys)
2. Sign up or log in to your v0.dev account
3. Generate a new API key
4. Copy the key (you won't be able to see it again)

#### 2. Configure Environment

```env
# Provider selection
UI_PROVIDER=v0

# v0 configuration
V0_API_KEY=your-v0-api-key
```

#### 3. Verify Configuration

```bash
npm start
```

Look for:
```
{"level":"info","message":"Creating UI provider","type":"v0"}
{"level":"info","message":"v0 provider ready"}
```

### Usage

#### Creating Components

```bash
curl -X POST http://localhost:3000/api/create-ui \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "message": "Create a pricing table",
    "searchQuery": "pricing table",
    "absolutePathToCurrentFile": "/path/to/file.tsx",
    "absolutePathToProjectDirectory": "/path/to/project",
    "standaloneRequestQuery": "modern pricing table component"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "text": "import { Card } from '@/components/ui/card';\n\n...",
    "previewUrl": "https://v0.dev/chat/abc123",
    "sessionId": "abc123",
    "provider": "v0"
  },
  "timestamp": "2025-01-11T..."
}
```

#### Refining with Session Continuity

Use the `sessionId` from the previous response to continue the conversation:

```bash
curl -X POST http://localhost:3000/api/refine-ui \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "userMessage": "Add a dark mode toggle",
    "absolutePathToRefiningFile": "/path/to/file.tsx",
    "context": "Add dark mode support",
    "sessionId": "abc123"
  }'
```

The refinement will continue in the same chat session, allowing the AI to remember previous context.

### Advantages

- ✅ **No Browser Required**: Perfect for headless/CI environments
- ✅ **Preview URLs**: Share live previews with team
- ✅ **Session Continuity**: Iterative refinements with chat history
- ✅ **File Arrays**: Structured component file information
- ✅ **Fast Generation**: No browser interaction needed
- ✅ **Automation Friendly**: API-only, scriptable

### Limitations

- ❌ **Per-Request Costs**: Charged per API call
- ❌ **No Visual Feedback**: Can't see component during generation
- ❌ **Requires Subscription**: v0.dev account with API access

### Preview URLs

v0 provides preview URLs that link to the v0.dev chat interface where you can:
- View the component live
- Test interactivity
- Copy individual files
- Continue the conversation
- Share with team members

Example: `https://v0.dev/chat/abc123`

### Session Continuity

The `sessionId` enables powerful iterative workflows:

1. **Generate initial component** → Get `sessionId`
2. **Refine component** → Pass `sessionId` to maintain context
3. **Continue refining** → Use same `sessionId` for multiple iterations

This allows the AI to remember previous changes and context, resulting in more coherent refinements.

### Troubleshooting

**Problem**: "v0 provider selected but not configured"
- **Solution**: Set `V0_API_KEY` in `.env`
- **Solution**: Verify API key is correct

**Problem**: "API connection failed"
- **Solution**: Check internet connection
- **Solution**: Verify v0.dev service status
- **Solution**: Ensure API key is valid

**Problem**: "Invalid or expired token"
- **Solution**: Generate new API key at v0.dev/chat/settings/keys
- **Solution**: Update `V0_API_KEY` in `.env`

---

## Switching Providers

### How to Switch

Switching between providers is simple and requires no code changes:

1. **Update `.env`**:
   ```env
   # Switch to v0
   UI_PROVIDER=v0
   V0_API_KEY=your-v0-key

   # Or switch to Magic UI
   UI_PROVIDER=magic
   API_KEY=your-magic-key
   ```

2. **Restart server**:
   ```bash
   npm start
   ```

3. **Verify in logs**:
   ```
   {"level":"info","message":"Creating UI provider","type":"v0"}
   ```

### Runtime Switching

Provider selection happens at server startup. To switch providers:

1. Stop the server (Ctrl+C)
2. Update `UI_PROVIDER` in `.env`
3. Start the server again

**Note**: Hot-reloading of provider configuration is not currently supported.

### Gradual Migration

You can test both providers by:

1. **Running multiple server instances**:
   ```bash
   # Terminal 1: Magic UI on port 3000
   UI_PROVIDER=magic PORT=3000 npm start

   # Terminal 2: v0 on port 3001
   UI_PROVIDER=v0 PORT=3001 npm start
   ```

2. **Compare results** side-by-side
3. **Choose preferred provider** for production

---

## Best Practices

### General Recommendations

1. **Use Environment Variables**: Never hardcode API keys
2. **Version Control**: Add `.env` to `.gitignore`
3. **Monitor Costs**: Track API usage for v0 provider
4. **Test Both**: Try both providers to find your preference

### For Magic UI

1. **Complete Designs Quickly**: 10-minute timeout on browser sessions
2. **Close Browser After**: Don't leave callback sessions open
3. **Use for Interactive Work**: Best for design-focused workflows

### For v0

1. **Leverage Session IDs**: Use for iterative refinements
2. **Share Preview URLs**: Collaborate with team via preview links
3. **Automate Workflows**: Integrate into CI/CD pipelines
4. **Monitor Costs**: Track API usage and set budgets

### Security

1. **Protect API Keys**: Never expose in client-side code
2. **Use Auth Methods**: Configure `AUTH_API_KEYS` for server access
3. **Rotate Keys Regularly**: Update API keys periodically
4. **Limit Access**: Use environment-based key management

---

## Troubleshooting

### Configuration Issues

**Error**: "Configuration validation failed: Magic UI provider selected but not configured"
```bash
# Solution: Set API key
echo "API_KEY=your-key" >> .env
```

**Error**: "Configuration validation failed: v0 provider selected but not configured"
```bash
# Solution: Set v0 API key
echo "V0_API_KEY=your-key" >> .env
```

### Provider-Specific Issues

**Magic UI: Browser doesn't open**
1. Check default browser settings
2. Verify localhost isn't blocked
3. Check firewall settings

**v0: API connection failed**
1. Verify internet connection
2. Check v0.dev service status
3. Validate API key format

### Performance Issues

**Slow generation with Magic UI**
- Expected: Browser interaction adds latency
- Solution: Switch to v0 for faster automation

**Rate limiting with v0**
- Check v0.dev rate limits
- Implement backoff/retry logic
- Consider upgrading v0 plan

### Getting Help

1. **Check Logs**: Set `LOG_LEVEL=debug` for detailed output
2. **Review Documentation**: See [README.md](README.md)
3. **Test Provider Status**: Use `/health/detailed` endpoint
4. **Report Issues**: GitHub Issues for bug reports

---

## FAQ

### General Questions

**Q: Can I use both providers simultaneously?**
A: Not in the same server instance. You can run multiple server instances on different ports, each with a different provider.

**Q: Do providers affect MCP tool functionality?**
A: No. All MCP tools work identically with both providers. The provider choice is transparent to MCP clients.

**Q: Can I switch providers without code changes?**
A: Yes. Provider switching only requires updating environment variables and restarting the server.

**Q: Which provider is recommended?**
A: **Magic UI** for interactive design work. **v0** for automation and headless environments.

### Magic UI Questions

**Q: Why does Magic UI require a browser?**
A: Magic UI uses 21st.dev's interactive chat interface, which requires browser interaction for the AI-assisted design process.

**Q: Can I use Magic UI in CI/CD?**
A: Not recommended. Use v0 for headless/CI environments.

**Q: What's the timeout for Magic UI?**
A: 10 minutes (600 seconds) by default. Configurable via `CALLBACK_TIMEOUT`.

### v0 Questions

**Q: How much does v0 cost?**
A: Pricing varies by v0.dev plan. Check [v0.dev/pricing](https://v0.dev/pricing) for details.

**Q: Can I use v0 preview URLs offline?**
A: No. Preview URLs link to live v0.dev chat interface and require internet access.

**Q: How long are session IDs valid?**
A: Session IDs are tied to v0.dev chat sessions. They remain valid as long as the chat exists on v0.dev.

**Q: What's the rate limit for v0 API?**
A: Rate limits depend on your v0.dev plan. Contact v0.dev support for specific limits.

### Migration Questions

**Q: Will switching providers affect existing components?**
A: No. Generated components are standard React code. Provider choice only affects the generation process.

**Q: Can I migrate from Magic UI to v0 gradually?**
A: Yes. Generate new components with v0 while keeping existing Magic UI components.

**Q: Do I need both API keys?**
A: No. Only configure the API key for your chosen provider.

---

## Additional Resources

- [README.md](README.md) - Complete server documentation
- [API.md](API.md) - API reference with examples
- [21st.dev Documentation](https://21st.dev/docs) - Magic UI provider
- [v0.dev Documentation](https://v0.dev/docs) - v0 provider
- [HYBRID_PROVIDER_IMPLEMENTATION.md](HYBRID_PROVIDER_IMPLEMENTATION.md) - Technical implementation details

---

**Last Updated**: 2025-01-11
**Server Version**: 1.0.0
**Supported Providers**: Magic UI (21st.dev), v0 (v0.dev)
