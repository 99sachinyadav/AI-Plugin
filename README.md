# Contextly – AI Browser Companion (Phase 1)

**Contextly** is a production-quality Chrome browser extension (Manifest V3) and AI companion designed for seamless web research, coding assistance, and content exploration.

Contextly introduces dual interaction paradigms:
1. **General Chat**: Ask any coding, research, writing, or analysis question without needing webpage content.
2. **Contextual Chat**: Select text anywhere on the web, right-click **"Ask Contextly"**, and engage in grounded, anti-hallucination conversations powered by structured context sources.

---

## 🌟 Key Features

- **Chrome Side Panel Experience**: Opens directly in Chrome's dedicated side panel (`chrome.sidePanel` API), allowing users to read articles and chat side-by-side without context switching.
- **Context Menus Integration**: Highlight any text on any webpage, right-click, and select **"Ask Contextly"** to immediately capture the selected text, page title, and URL into a structured conversation context.
- **Multi-Context Chaining**: Append multiple selections from different pages or sections into one conversation, and delete individual context sources anytime.
- **Strict Grounding & Anti-Hallucination**: Contextual mode instructs the model to strictly ground answers in the provided sources. If context is insufficient, it explicitly communicates that general AI knowledge is being used.
- **Provider-Agnostic Abstraction Layer**: Pluggable provider architecture with native support for:
  - **Google Gemini** (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`)
  - **DeepSeek AI** (`deepseek-chat`, `deepseek-reasoner`)
  - **OpenAI** (`gpt-4o`, `gpt-4o-mini`)
- **Real-Time Streaming**: Low-latency token-by-token streaming powered by Server-Sent Events (SSE) with abort/stop generation capability.
- **Sleek SaaS UI**: Built with React, Tailwind CSS, Lucide icons, rich Markdown rendering, syntax-highlighted code blocks with one-click copy, and conversation history management.
- **Resilient Persistence**: MongoDB with Mongoose models, backed by an automatic memory fallback layer so developers can test and develop without mandatory database setup.

---

## 📁 Project Structure

```
AI-Chatbot/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts               # Centralized configuration & environment loader
│   │   ├── controllers/
│   │   │   ├── chat.controller.ts          # SSE streaming & standard chat handlers
│   │   │   ├── conversation.controller.ts  # Conversation CRUD & context management
│   │   │   └── provider.controller.ts      # Active provider & model listings
│   │   ├── middleware/
│   │   │   ├── error.middleware.ts         # Centralized error & validation handler
│   │   │   └── rateLimiter.middleware.ts   # Express rate limiter for chat endpoints
│   │   ├── models/
│   │   │   ├── User.ts              # User & anonymous session schema
│   │   │   ├── Conversation.ts      # Conversation & ContextSource schemas
│   │   │   └── Message.ts           # Chat messages & token metadata schema
│   │   ├── providers/
│   │   │   ├── AIProvider.interface.ts # Standard provider interface & stream contracts
│   │   │   ├── GeminiProvider.ts    # Google Gemini implementation
│   │   │   ├── DeepSeekProvider.ts  # DeepSeek OpenAI-compatible adapter
│   │   │   ├── OpenAIProvider.ts    # OpenAI adapter
│   │   │   └── AIProviderFactory.ts # Pluggable factory & dynamic switching
│   │   ├── routes/
│   │   │   ├── chat.routes.ts       # /api/chat & /api/chat/stream
│   │   │   ├── conversation.routes.ts # /api/conversations endpoints
│   │   │   └── provider.routes.ts   # /api/providers endpoints
│   │   ├── services/
│   │   │   ├── ai.service.ts        # Grounding prompts & provider streaming
│   │   │   └── conversation.service.ts # Persistence layer with memory fallback
│   │   ├── tests/
│   │   │   ├── provider.test.ts     # Provider factory & switching tests
│   │   │   ├── context.test.ts      # Grounding prompt & anti-hallucination tests
│   │   │   ├── conversation.test.ts # Conversation & context CRUD tests
│   │   │   └── chat.test.ts         # API integration & SSE streaming tests
│   │   ├── app.ts                   # Express app configuration & middleware
│   │   └── server.ts                # Server startup & graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── extension/
│   ├── public/
│   │   ├── manifest.json            # Chrome Extension Manifest V3
│   │   ├── sidepanel.html           # Side panel HTML entrypoint
│   │   └── icons/                   # Contextly toolbar & store icons (16, 32, 48, 128)
│   ├── src/
│   │   ├── background/
│   │   │   └── serviceWorker.ts     # Service worker: context menus & side panel triggers
│   │   ├── content/
│   │   │   └── contentScript.ts     # Webpage content reader
│   │   ├── sidepanel/
│   │   │   ├── components/
│   │   │   │   ├── Header.tsx           # Contextly branding, engine badge, controls
│   │   │   │   ├── ModeSelector.tsx     # General vs Contextual tab switcher
│   │   │   │   ├── ProviderSelector.tsx # Engine/model selector dropdown
│   │   │   │   ├── ContextCard.tsx      # Active structured context sources & removal
│   │   │   │   ├── MessageList.tsx      # Message feed, empty states & starter prompts
│   │   │   │   ├── MessageItem.tsx      # Markdown, syntax highlighter, copy actions
│   │   │   │   ├── ChatInput.tsx        # Auto-grow input, keyboard shortcuts & stop button
│   │   │   │   └── ConversationDrawer.tsx # Conversation history drawer & management
│   │   │   ├── hooks/
│   │   │   │   └── useChat.ts           # State machine, SSE parser, context listeners
│   │   │   ├── services/
│   │   │   │   ├── api.ts               # Client API & SSE streaming reader
│   │   │   │   └── storage.ts           # Chrome storage abstraction (sessions, cache)
│   │   │   ├── types/
│   │   │   │   └── index.ts             # Shared frontend interfaces
│   │   │   ├── App.tsx                  # Side panel layout & root component
│   │   │   ├── main.tsx                 # React DOM mount point
│   │   │   └── index.css                # Tailwind CSS & custom styling
│   │   ├── vite.config.ts           # Multi-entry Vite bundler for MV3
│   │   ├── tailwind.config.js
│   │   └── package.json
│
├── package.json                     # Monorepo root scripts
└── README.md                        # Documentation
```

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*

# Database Configuration
MONGO_URI=mongodb://127.0.0.1:27017/contextly

# AI Provider Configuration ('gemini' | 'deepseek' | 'openai')
AI_PROVIDER=gemini

# Provider API Keys
GEMINI_API_KEY=your_gemini_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Default Models
GEMINI_MODEL=gemini-1.5-flash
DEEPSEEK_MODEL=deepseek-chat
OPENAI_MODEL=gpt-4o-mini

# Security & Limits
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000
MAX_CONTEXT_CHAR_LIMIT=12000
```

> **Switching Providers:**
> Change `AI_PROVIDER=deepseek` or `AI_PROVIDER=openai` in `.env` and restart the backend. No frontend changes or database migrations are required!

---

## 🚀 Local Setup Instructions

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher, tested on v24.14.0)
- **npm** (v9.0.0 or higher)
- **Google Chrome** browser (v114+ with Side Panel API support)
- *(Optional)* Local MongoDB or MongoDB Atlas URI (if omitted, Contextly seamlessly uses in-memory persistence).

### 2. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run automated tests
npm test

# Build and start the backend development server
npm run dev
```

The backend server starts on `http://localhost:5000`:
- Health check: `http://localhost:5000/api/health`
- Registered providers: `http://localhost:5000/api/providers`

### 3. Extension Setup & Build

```bash
# Navigate to extension directory
cd ../extension

# Install dependencies
npm install

# Build extension for Chrome
npm run build
```

This compiles the production extension into `extension/dist/`:
- `manifest.json`
- `sidepanel.html`
- `background.js`
- `content.js`
- `icons/`

---

## 🧩 Chrome Extension Installation

1. Open Google Chrome and go to `chrome://extensions/`.
2. In the top-right corner, enable **Developer mode**.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `extension/dist` folder inside this repository:
   ```
   c:\Users\LENOVO\Desktop\AI-Chatbot\extension\dist
   ```
5. **Contextly** will appear in your Chrome extensions list with its toolbar icon.
6. Click the Extensions puzzle icon in Chrome and pin **Contextly** for quick access.

---

## 🎯 Verification & User Workflows

### 1. General Chat Mode
1. Click the Contextly icon in the browser toolbar.
2. The side panel opens on the right side of Chrome.
3. Verify the status indicator says **Online** (green dot).
4. Select the **General Chat** tab.
5. Type any question (e.g., *"Explain how JavaScript event loops work with code examples"*).
6. Press `Enter`. Watch the response stream smoothly in real-time with syntax-highlighted code blocks.
7. Click the **Copy** button on any code block or response.

### 2. Contextual Chat Mode (Selected Webpage Text)
1. Navigate to any website (e.g. Wikipedia, MDN, news article, or blog).
2. Highlight a sentence or paragraph with your mouse.
3. Right-click the selection and choose **"Ask Contextly"**.
4. Contextly opens in the side panel:
   - Captures the selected snippet, webpage title, and URL.
   - Automatically switches to **Contextual** mode.
   - Displays the grounded source card with link and preview.
5. Ask a question regarding the text (e.g., *"What is the main finding discussed here?"*).
6. Contextly answers strictly based on the text.
7. Ask an out-of-scope question (e.g., *"What is the weather in Paris?"*):
   - Contextly clearly states that the provided text does not contain this information and clarifies that it is answering using general AI knowledge.

### 3. Multi-Context Chaining & Removal
1. Highlight another paragraph on the same or a different webpage.
2. Right-click and choose **"Ask Contextly"**.
3. The new snippet is appended as an additional context source.
4. Click the `×` icon on any individual context card to remove it from the conversation.

### 4. Switching Providers
1. Use the **AI Engine** dropdown in the header to switch between Gemini, DeepSeek, and OpenAI.
2. Or change `AI_PROVIDER=deepseek` in `backend/.env`.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and active AI provider status |
| `GET` | `/api/providers` | List available providers and configuration status |
| `POST` | `/api/conversations` | Create a new general or contextual conversation |
| `GET` | `/api/conversations?sessionId=...` | List conversations by session identifier |
| `GET` | `/api/conversations/:id` | Get conversation details with full message history |
| `DELETE` | `/api/conversations/:id` | Delete conversation and associated messages |
| `POST` | `/api/conversations/:id/context` | Append a new context source to an existing chat |
| `DELETE` | `/api/conversations/:id/context/:contextId` | Remove a specific context source |
| `POST` | `/api/chat/stream` | Stream tokens using Server-Sent Events (SSE) |
| `POST` | `/api/chat` | Non-streaming standard JSON chat response |

---

## 🔒 Security & Engineering Best Practices

- **Zero Key Leakage**: AI provider API keys exist solely in the backend `.env` file. The Chrome extension never has access to provider API keys.
- **Untrusted Input Sanitation**: Webpage selections are treated as untrusted data and delimited with strict boundaries in the system prompt.
- **Rate Limiting**: Built-in `express-rate-limit` prevents spam or token exhaustion.
- **Payload & Context Size Caps**: `MAX_CONTEXT_CHAR_LIMIT` bounds context size to prevent prompt injection or token bloat.
- **Minimal Manifest Permissions**: Only requests `sidePanel`, `contextMenus`, `storage`, and `activeTab`. Does not request unnecessary host permissions.

---

## 🧪 Testing Results

Automated unit and integration test suite (`npm test` in `backend`):
```
 ✓ src/tests/context.test.ts (3 tests)
 ✓ src/tests/provider.test.ts (5 tests)
 ✓ src/tests/conversation.test.ts (6 tests)
 ✓ src/tests/chat.test.ts (5 tests)

Test Files  4 passed (4)
     Tests  19 passed (19)
```

---

## 🔮 Phase 2 Roadmap

- **Knowledge Vault**: Save and organize selected snippets into personal collections across browsing sessions.
- **Vector RAG**: Embed full webpage articles into a vector index for multi-page semantic retrieval.
- **User Authentication**: Optional Google/GitHub OAuth identity sync alongside anonymous sessions.
