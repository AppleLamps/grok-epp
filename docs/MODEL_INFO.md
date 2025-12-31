# 🤖 Model Information

**Current Model**: `grok-4-1-fast-reasoning`

---

## 📊 Model Specifications

### Performance Characteristics

| Metric | Value |
|--------|-------|
| **Model Name** | `grok-4-1-fast-reasoning` |
| **Context Window** | 2,000,000 tokens (2M) |
| **Input Rate Limit** | 4M tokens/minute |
| **Request Rate Limit** | 480 requests/minute |
| **Reasoning** | ✅ Enabled |
| **Vision** | ✅ Supported |
| **Function Calling** | ✅ Supported |

### Pricing

| Type | Cost |
|------|------|
| **Input Tokens** | $0.20 per million tokens |
| **Output Tokens** | $0.50 per million tokens |

**Example Cost Calculation**:
- 1,000 queries with 500 input tokens each = 500,000 tokens
- Average response of 200 tokens = 200,000 tokens
- **Total Cost**: (0.5M × $0.20) + (0.2M × $0.50) = **$0.20**

---

## 🎯 Why This Model?

### 1. ⚡ **Speed**
- Optimized for fast responses
- Perfect for interactive chat applications
- Low latency for real-time conversations

### 2. 🧠 **Reasoning Capabilities**
- Built-in reasoning for complex queries
- Better understanding of document context
- More accurate answers from your collection

### 3. 📚 **Large Context Window**
- 2M tokens = ~1.5 million words
- Can handle extensive conversation history
- Processes multiple documents simultaneously

### 4. 💰 **Cost-Effective**
- Competitive pricing at $0.20/M input tokens
- Efficient for production use
- Lower cost than many alternatives

### 5. 🎯 **High Rate Limits**
- 4M tokens/minute input
- 480 requests/minute
- Suitable for multiple concurrent users

---

## 🔄 Alternative Models

If you need to change the model, here are alternatives:

### For Maximum Speed (No Reasoning)
```typescript
model: 'grok-4-1-fast-non-reasoning'
```
- **Context**: 2M tokens
- **Rate**: 4M tpm, 480 rpm
- **Cost**: $0.20/$0.50 per M tokens
- **Use Case**: When speed is critical and reasoning isn't needed

### For Standard Performance
```typescript
model: 'grok-4-fast-reasoning'
```
- **Context**: 2M tokens
- **Rate**: 4M tpm, 480 rpm
- **Cost**: $0.20/$0.50 per M tokens
- **Use Case**: Alternative fast model with reasoning

### For Maximum Context (Slower)
```typescript
model: 'grok-4-0709'
```
- **Context**: 256K tokens
- **Rate**: 2M tpm, 480 rpm
- **Cost**: $3.00/$15.00 per M tokens
- **Use Case**: When you need maximum accuracy (higher cost)

---

## 🛠️ How to Change the Model

**File**: `app/api/chat/route.ts`

**Line**: ~25

**Current**:
```typescript
body: JSON.stringify({
  model: 'grok-4-1-fast-reasoning',
  input: messages.map((msg: any) => ({
    role: msg.role,
    content: msg.content,
  })),
  tools: [
    {
      type: 'file_search',
      vector_store_ids: [COLLECTION_ID],
      max_num_results: 10,
    },
  ],
}),
```

**To Change**:
1. Open `app/api/chat/route.ts`
2. Find line with `model: 'grok-4-1-fast-reasoning'`
3. Replace with desired model name
4. Save file
5. Restart dev server (`npm run dev`)

---

## 📈 Performance Expectations

### Response Times (Typical)

| Query Type | Expected Time |
|------------|---------------|
| **Simple Query** | 1-3 seconds |
| **Document Search** | 2-5 seconds |
| **Complex Reasoning** | 3-8 seconds |
| **Multi-Document Analysis** | 5-10 seconds |

### Factors Affecting Speed

1. **Collection Size**: 483+ documents = moderate search time
2. **Query Complexity**: More complex queries take longer
3. **Number of Results**: `max_num_results: 10` is balanced
4. **Network Latency**: Your internet connection speed
5. **API Load**: xAI server load (usually minimal)

---

## 🎯 Optimization Tips

### 1. Adjust Max Results

**Current**: `max_num_results: 10`

**For Faster Responses**:
```typescript
max_num_results: 5  // Fewer documents to process
```

**For More Comprehensive Answers**:
```typescript
max_num_results: 20  // More context, slower response
```

### 2. Use Streaming (Future Enhancement)

Currently not implemented, but could add:
```typescript
stream: true  // Get responses as they're generated
```

### 3. Implement Caching

For common queries, cache responses:
```typescript
// Pseudo-code
const cacheKey = hashQuery(query)
if (cache.has(cacheKey)) {
  return cache.get(cacheKey)
}
```

---

## 📊 Usage Monitoring

### Track Your Usage

1. **xAI Console**: [console.x.ai](https://console.x.ai)
   - View token usage
   - Monitor costs
   - Check rate limits

2. **Add Logging** (Optional):
```typescript
// In app/api/chat/route.ts
console.log('Tokens used:', data.usage)
console.log('Cost estimate:', {
  input: data.usage.prompt_tokens * 0.20 / 1_000_000,
  output: data.usage.completion_tokens * 0.50 / 1_000_000
})
```

---

## 🔐 Rate Limit Handling

### Current Limits
- **4M tokens/minute**: Very generous for most use cases
- **480 requests/minute**: ~8 requests/second

### If You Hit Limits

Add retry logic:
```typescript
const maxRetries = 3
let retries = 0

while (retries < maxRetries) {
  try {
    const response = await fetch(...)
    if (response.status === 429) {
      // Rate limited
      await sleep(1000 * (retries + 1))
      retries++
      continue
    }
    return response
  } catch (error) {
    retries++
  }
}
```

---

## 🎓 Model Comparison

| Feature | grok-4-1-fast-reasoning | grok-4-1-fast-non-reasoning | grok-4-0709 |
|---------|-------------------------|----------------------------|-------------|
| **Speed** | ⚡⚡⚡ Fast | ⚡⚡⚡⚡ Fastest | ⚡⚡ Moderate |
| **Reasoning** | ✅ Yes | ❌ No | ✅ Yes |
| **Context** | 2M tokens | 2M tokens | 256K tokens |
| **Cost (Input)** | $0.20/M | $0.20/M | $3.00/M |
| **Cost (Output)** | $0.50/M | $0.50/M | $15.00/M |
| **Best For** | **Chatbots** | Speed-critical apps | High accuracy needs |

---

## ✅ Summary

**Current Choice**: `grok-4-1-fast-reasoning`

**Why It's Perfect for Your Use Case**:
- ✅ Fast responses for good UX
- ✅ Reasoning for accurate document analysis
- ✅ Large context for conversation history
- ✅ Cost-effective for production
- ✅ High rate limits for multiple users
- ✅ Works great with file_search tool

**No changes needed** - this is an excellent model choice for your Collections Chatbot! 🎉

---

## 📚 References

- [xAI Model Pricing](https://x.ai/api/pricing)
- [xAI API Documentation](https://docs.x.ai)
- [xAI Console](https://console.x.ai)
