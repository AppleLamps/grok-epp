# 🌐 Website Functionality Guide

Complete guide to how your Collections Chatbot website works.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React Frontend (Next.js App)                │  │
│  │  • Chat Interface (page.tsx)                          │  │
│  │  • Message Input (ChatInput.tsx)                      │  │
│  │  • Message Display (ChatMessage.tsx)                  │  │
│  └────────────────────┬──────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │ HTTP POST /api/chat
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTE                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         /app/api/chat/route.ts                        │  │
│  │  • Receives user messages                             │  │
│  │  • Formats request for xAI API                        │  │
│  │  • Sends to Responses API                             │  │
│  │  • Parses response & citations                        │  │
│  └────────────────────┬──────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │ HTTPS POST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   xAI RESPONSES API                          │
│                https://api.x.ai/v1/responses                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • Receives query with file_search tool               │  │
│  │  • Searches collection documents                      │  │
│  │  • Generates response with Grok model                 │  │
│  │  • Returns answer with citations                      │  │
│  └────────────────────┬──────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  xAI COLLECTIONS                             │
│     Collection: collection_b357d27a-6e14-42e2-ac02-...      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • 483+ PDF documents                                 │  │
│  │  • Vector embeddings for semantic search             │  │
│  │  • Document metadata & file IDs                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### 1. User Sends Message

**File**: `app/page.tsx` (lines 22-77)

```typescript
const handleSendMessage = async (content: string) => {
  // 1. Create user message object
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: new Date(),
  }
  
  // 2. Add to messages state
  setMessages((prev) => [...prev, userMessage])
  
  // 3. Send to API route
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [...messages, userMessage] })
  })
}
```

**What happens**:
- User types message and presses Enter or clicks Send
- Message is added to the chat UI immediately
- All conversation history + new message sent to API

---

### 2. API Route Processes Request

**File**: `app/api/chat/route.ts` (lines 5-93)

```typescript
export async function POST(request: NextRequest) {
  // 1. Extract messages from request
  const { messages } = await request.json()
  
  // 2. Get API key from environment
  const apiKey = process.env.XAI_API_KEY
  
  // 3. Call xAI Responses API
  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-1212',
      input: messages,
      tools: [{
        type: 'file_search',
        vector_store_ids: [COLLECTION_ID],
        max_num_results: 10,
      }],
    }),
  })
}
```

**What happens**:
- Receives conversation history
- Validates API key exists
- Formats request for xAI API
- Includes file_search tool with collection ID
- Sends to xAI Responses API

---

### 3. xAI API Searches Collection

**External Service**: xAI Responses API

**Request Format**:
```json
{
  "model": "grok-4-1-fast-reasoning",
  "input": [
    { "role": "user", "content": "What documents mention Epstein?" }
  ],
  "tools": [{
    "type": "file_search",
    "vector_store_ids": ["collection_b357d27a-6e14-42e2-ac02-d9d8ae9533a2"],
    "max_num_results": 10
  }]
}
```

**What happens**:
1. **Semantic Search**: Converts query to embeddings
2. **Vector Search**: Finds most relevant documents in collection
3. **Context Building**: Retrieves top 10 matching document chunks
4. **LLM Generation**: Grok generates answer using document context
5. **Citation Tracking**: Tracks which documents were used

---

### 4. API Route Parses Response

**File**: `app/api/chat/route.ts` (lines 46-85)

```typescript
// Extract content from Responses API format
if (data.output && Array.isArray(data.output)) {
  const assistantMessages = data.output.filter(
    (msg: any) => msg.role === 'assistant'
  )
  
  const lastMessage = assistantMessages[assistantMessages.length - 1]
  
  // Get content
  content = lastMessage.content
  
  // Extract citations from annotations
  if (lastMessage.annotations) {
    lastMessage.annotations.forEach((annotation: any) => {
      if (annotation.type === 'file_citation') {
        const fileName = annotation.file_citation.file_name
        citations.push(fileName)
      }
    })
  }
}

return NextResponse.json({ content, citations })
```

**What happens**:
- Parses complex API response structure
- Extracts assistant's message content
- Finds file citations in annotations
- Returns clean JSON to frontend

---

### 5. Frontend Displays Response

**File**: `app/page.tsx` (lines 54-64)

```typescript
const assistantMessage: Message = {
  id: (Date.now() + 1).toString(),
  role: 'assistant',
  content: data.content,
  citations: data.citations,
  timestamp: new Date(),
}

setMessages((prev) => [...prev, assistantMessage])
```

**File**: `components/ChatMessage.tsx`

```typescript
export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={styles.messageAssistant}>
      <div className={styles.content}>
        {message.content}
      </div>
      {message.citations && (
        <div className={styles.citations}>
          <p>Sources:</p>
          {message.citations.map((citation, index) => (
            <div key={index}>{citation}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**What happens**:
- Creates assistant message object
- Adds to messages state
- React re-renders with new message
- Citations displayed below message
- Auto-scrolls to bottom

---

## 🎨 UI Components

### Main Page (`app/page.tsx`)

**Responsibilities**:
- Manages conversation state
- Handles message sending
- Auto-scrolls to latest message
- Shows loading indicator
- Error handling

**Key Features**:
- Empty state with icon when no messages
- Loading dots animation while waiting
- Smooth scroll to new messages

---

### Chat Input (`components/ChatInput.tsx`)

**Responsibilities**:
- Text input with auto-resize
- Enter key to send (Shift+Enter for new line)
- Send button with disabled state
- Input validation

**Key Features**:
```typescript
const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}
```

---

### Chat Message (`components/ChatMessage.tsx`)

**Responsibilities**:
- Display user and assistant messages
- Show message content
- Display citations
- Show timestamp

**Styling**:
- User messages: Right-aligned, blue
- Assistant messages: Left-aligned, gray
- Citations: Separate section with sources
- Timestamps: Small, subtle

---

## 🔐 Environment Variables

### `.env.local` (Next.js Website)

```env
XAI_API_KEY=xai-your-api-key-here
```

**Used by**:
- `app/api/chat/route.ts` via `process.env.XAI_API_KEY`

**Security**:
- ✅ Gitignored (never committed)
- ✅ Server-side only (not exposed to browser)
- ✅ Loaded automatically by Next.js

---

### `.env` (Python Upload Script)

```env
XAI_API_KEY=xai-your-api-key-here
XAI_MANAGEMENT_API_KEY=xai-token-your-management-key-here
COLLECTION_ID=collection_b357d27a-6e14-42e2-ac02-d9d8ae9533a2
```

**Used by**:
- `upload_files.py` for uploading documents

**Note**: Management API key is NOT needed for the website, only for uploads.

---

## 🎯 Key Configuration Points

### 1. Collection ID

**Location**: `app/api/chat/route.ts` (line 3)

```typescript
const COLLECTION_ID = 'collection_b357d27a-6e14-42e2-ac02-d9d8ae9533a2'
```

**To change**: Edit this constant to use a different collection.

---

### 2. Model Selection

**Location**: `app/api/chat/route.ts` (line 25)

```typescript
model: 'grok-4-1-fast-reasoning'
```

**Why this model?**
- ⚡ **Fast**: Optimized for quick responses
- 🧠 **Reasoning**: Built-in reasoning capabilities
- 📚 **Large Context**: 2M token context window (2,000,000 tokens)
- 💰 **Cost-Effective**: $0.20/M input, $0.50/M output tokens
- 🎯 **Rate Limits**: 4M tokens/min, 480 requests/min

**Available models**:
- `grok-4-1-fast-reasoning` (current, recommended for speed + reasoning)
- `grok-4-1-fast-non-reasoning` (faster, no reasoning)
- `grok-4-fast-reasoning` (alternative fast model)
- Check xAI docs for latest models

---

### 3. Search Results Limit

**Location**: `app/api/chat/route.ts` (line 34)

```typescript
max_num_results: 10
```

**Adjust**: Increase for more context, decrease for faster responses.

---

### 4. Timeout Configuration

**Location**: Can add to fetch call

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds

const response = await fetch('https://api.x.ai/v1/responses', {
  signal: controller.signal,
  // ... other options
})
```

---

## 🐛 Debugging

### Enable Debug Logging

**File**: `app/api/chat/route.ts` (line 47)

```typescript
console.log('xAI Response:', JSON.stringify(data, null, 2))
```

**View logs**:
- Terminal where `npm run dev` is running
- Browser DevTools Console (F12)

---

### Common Issues

#### 1. "XAI_API_KEY not set"

**Check**:
```powershell
# View .env.local
Get-Content .env.local
```

**Fix**: Ensure file exists and key is set without quotes.

---

#### 2. No citations returned

**Possible causes**:
- Documents don't match query
- Collection is empty
- API response format changed

**Debug**:
```typescript
console.log('Full API response:', data)
console.log('Annotations:', lastMessage.annotations)
```

---

#### 3. Slow responses

**Possible causes**:
- Large collection (483+ documents)
- Complex query requiring multiple searches
- Network latency

**Solutions**:
- Reduce `max_num_results`
- Use more specific queries
- Add loading indicators (already implemented)

---

## 📊 Performance Considerations

### Frontend Optimization

1. **React State Management**: Using `useState` for messages
2. **Auto-scroll**: Only triggers on new messages
3. **Loading States**: Prevents duplicate requests
4. **Error Boundaries**: Graceful error handling

### API Optimization

1. **Streaming**: Not currently implemented (could add)
2. **Caching**: Could cache common queries
3. **Rate Limiting**: Not implemented (consider for production)

---

## 🚀 Production Deployment

### Vercel Deployment

1. **Environment Variables**:
   - Add `XAI_API_KEY` in Vercel dashboard
   - Never commit `.env.local`

2. **Build Configuration**:
   - Next.js automatically optimizes for production
   - Static pages pre-rendered
   - API routes run as serverless functions

3. **Performance**:
   - CDN for static assets
   - Edge functions for API routes
   - Automatic HTTPS

---

## 🔄 Future Enhancements

### Potential Features

1. **Streaming Responses**: Show response as it generates
2. **Message History**: Persist conversations in localStorage
3. **Export Chat**: Download conversation as PDF/text
4. **Voice Input**: Speech-to-text for queries
5. **Document Preview**: Show document snippets in citations
6. **Multi-Collection**: Switch between collections
7. **User Authentication**: Add login system
8. **Rate Limiting**: Prevent API abuse
9. **Analytics**: Track usage patterns
10. **Custom Prompts**: System prompts for different use cases

---

## 📚 Related Documentation

- **[QUICKSTART.md](./QUICKSTART.md)**: Get started in 5 minutes
- **[STATUS.md](./STATUS.md)**: Current project status
- **[README.md](./README.md)**: Project overview
- **[SETUP.md](./SETUP.md)**: Detailed setup instructions
- **[UPLOAD_README.md](./UPLOAD_README.md)**: Document upload guide

---

## ✅ Summary

Your website is a **modern, production-ready chatbot** that:

✅ Uses Next.js 14 with App Router  
✅ Integrates with xAI Responses API  
✅ Searches 483+ documents in your collection  
✅ Displays responses with citations  
✅ Has a clean, responsive UI  
✅ Includes proper error handling  
✅ Is ready for Vercel deployment  

**Just run `npm install` and you're ready to go!** 🚀
