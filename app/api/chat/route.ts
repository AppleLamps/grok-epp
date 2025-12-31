import { NextRequest, NextResponse } from 'next/server'

const COLLECTION_ID = 'collection_8b792b21-5c87-47c6-901b-0395a6589e33'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'XAI_API_KEY environment variable is not set' },
        { status: 500 }
      )
    }

    // System prompt for Epstein document analysis
    const systemPrompt = {
      role: 'system',
      content: `You are an expert legal document analyst specializing in the Jeffrey Epstein case files released by the Department of Justice. Your role is to provide accurate, detailed, and well-sourced answers based on the extensive document collection you have access to.

**Document Collection Context:**
- You have access to thousands of legal documents related to Jeffrey Epstein
- These documents include court filings, depositions, witness statements, flight logs, financial records, and other DOJ-released materials
- Many documents contain redactions (blacked-out text) to protect identities or sensitive information
- Documents span multiple legal cases, investigations, and jurisdictions

**Your Analysis Approach:**

1. **Deep Document Search:**
   - Always search thoroughly through the collection before answering
   - Cross-reference multiple documents to verify facts
   - Look for corroborating evidence across different sources
   - Don't rely on a single document; synthesize information from multiple files

2. **Handling Redactions:**
   - Acknowledge when information is redacted and cannot be determined
   - Never speculate about redacted content
   - Note patterns in redactions (e.g., "multiple witness names are redacted")
   - Work around redactions by finding related unredacted information

3. **Accuracy Standards:**
   - Only state facts that are directly supported by the documents
   - Clearly distinguish between:
     * Proven facts (documented in court records)
     * Allegations (claims made in depositions/statements)
     * Speculation (clearly label as such, if necessary for context)
   - If documents conflict, note the discrepancy

5. **Contextual Analysis:**
   - Provide relevant legal context (case names, dates, jurisdictions)
   - Explain the significance of findings
   - Connect related information across documents
   - Identify key patterns, timelines, or relationships

6. **Sensitive Content Handling:**
   - Present information professionally and factually
   - Avoid sensationalism while being thorough
   - Respect the gravity of the subject matter
   - Acknowledge the serious nature of allegations and crimes

5. **Response Structure:**
   - Start with a direct answer to the question
   - Provide detailed evidence from documents
   - Note any limitations (redactions, missing information, conflicting accounts)
   - Offer to search for additional related information if helpful

**When You Don't Find Information:**
- Explicitly state that you searched the collection
- Explain what you did find (related information, partial information, etc.)
- Suggest alternative search angles or related questions
- Never make up information or speculate beyond the documents

**IMPORTANT - No Citations Rule:**
- Do NOT include any citations, source references, or document identifiers in your response
- Do NOT mention file names like "Bundle-001.txt", page numbers like "pp. 34-35", or parenthetical references
- Do NOT include a "Sources" or "References" section
- Simply provide the factual answer based on the documents without citing them
- The app handles source attribution separately

**Your Goal:** Provide the most accurate, comprehensive, and well-documented answers possible based on this unique collection of DOJ-released Epstein case files. Help users understand the documented facts of this case through rigorous analysis of the source materials.`
    }

    // Prepend system prompt to messages
    const messagesWithSystem = [systemPrompt, ...messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))]

    // Use the Responses API with file_search tool
    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        input: messagesWithSystem,
        tools: [
          {
            type: 'file_search',
            vector_store_ids: [COLLECTION_ID],
            max_num_results: 75,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('xAI API error:', errorData)
      return NextResponse.json(
        { error: `xAI API error: ${response.status} - ${errorData}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('xAI Response:', JSON.stringify(data, null, 2))

    // Extract content and citations from Responses API format
    let content = ''
    const citations: string[] = []

    // Responses API returns { output: [...messages], usage: {...} }
    if (data.output && Array.isArray(data.output)) {
      // Find the last assistant message
      const assistantMessages = data.output.filter((msg: any) => msg.role === 'assistant')

      if (assistantMessages.length > 0) {
        const lastMessage = assistantMessages[assistantMessages.length - 1]

        // Extract content
        if (typeof lastMessage.content === 'string') {
          content = lastMessage.content
        } else if (Array.isArray(lastMessage.content)) {
          // Handle content array format
          content = lastMessage.content
            .map((item: any) => {
              if (typeof item === 'string') return item
              // Handle both 'text' and 'output_text' types
              if ((item.type === 'text' || item.type === 'output_text') && item.text) {
                return item.text
              }
              return ''
            })
            .filter(Boolean)
            .join('\n')
        }

        // Extract citations from annotations
        if (lastMessage.annotations && Array.isArray(lastMessage.annotations)) {
          lastMessage.annotations.forEach((annotation: any) => {
            if (annotation.type === 'file_citation' && annotation.file_citation) {
              const fileName = annotation.file_citation.file_name || annotation.file_citation.file_id
              if (fileName) citations.push(fileName)
            }
          })
        }
      }
    } else if (data.content) {
      // Fallback for other formats
      content = data.content
    } else if (data.choices && data.choices[0]) {
      content = data.choices[0].message?.content || ''
    }

    return NextResponse.json({
      content: content || 'No response generated',
      citations: [...new Set(citations)], // Remove duplicates
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: error.message || 'An error occurred while processing your request',
      },
      { status: 500 }
    )
  }
}

