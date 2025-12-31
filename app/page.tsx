'use client'

import { useState, useRef, useEffect } from 'react'
import ChatMessage from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import Sidebar from '@/components/Sidebar'
import { Conversation, Message } from '@/types'
import styles from './page.module.css'

type StoredMessage = Omit<Message, 'timestamp'> & { timestamp: string }
type StoredConversation = Omit<Conversation, 'createdAt' | 'updatedAt' | 'messages'> & {
  createdAt: string
  updatedAt: string
  messages: StoredMessage[]
}

const CONVERSATIONS_STORAGE_KEY = 'grok-epp:conversations:v1'

function createConversationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function deriveConversationTitle(firstUserMessage: string): string {
  const oneLine = firstUserMessage.replace(/\s+/g, ' ').trim()
  if (!oneLine) return 'New chat'
  return oneLine.length > 48 ? `${oneLine.slice(0, 48)}…` : oneLine
}

function sortConversationsByMostRecent(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

function toStoredConversation(conversation: Conversation): StoredConversation {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages
      // Never persist transient UI placeholders.
      .filter((m) => !m.isLoading)
      .map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
  }
}

function fromStoredConversation(raw: StoredConversation): Conversation | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.id !== 'string') return null

  const createdAt = new Date(raw.createdAt)
  const updatedAt = new Date(raw.updatedAt)
  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) return null

  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : 'New chat'
  const messages: Message[] = Array.isArray(raw.messages)
    ? raw.messages
      .map((m): Message | null => {
        if (!m || typeof m !== 'object') return null
        if (typeof m.id !== 'string') return null
        if (m.role !== 'user' && m.role !== 'assistant') return null
        if (typeof m.content !== 'string') return null
        if (typeof m.timestamp !== 'string') return null
        const timestamp = new Date(m.timestamp)
        if (Number.isNaN(timestamp.getTime())) return null

        const citations = Array.isArray(m.citations)
          ? m.citations.filter((c): c is string => typeof c === 'string')
          : undefined

        return {
          id: m.id,
          role: m.role,
          content: m.content,
          citations,
          timestamp,
          isError: m.isError ? true : undefined,
        }
      })
      .filter((m): m is Message => m !== null)
    : []

  return {
    id: raw.id,
    title,
    createdAt,
    updatedAt,
    messages,
  }
}

function createEmptyConversation(): Conversation {
  const now = new Date()
  return {
    id: createConversationId(),
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
}

export default function Home() {
  // Important: keep initial render deterministic for SSR/hydration.
  // We initialize from localStorage in a mount effect.
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hasHydrated, setHasHydrated] = useState(false)

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null
  const messages = activeConversation?.messages ?? []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeConversationId, messages.length])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY)
      if (!raw) throw new Error('no conversations stored')

      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) throw new Error('invalid stored conversations')

      const restored = parsed
        .map((c) => fromStoredConversation(c as StoredConversation))
        .filter((c): c is Conversation => c !== null)

      if (restored.length === 0) throw new Error('no valid conversations restored')

      const sorted = sortConversationsByMostRecent(restored)
      setConversations(sorted)
      setActiveConversationId(sorted[0]?.id ?? null)
      setHasHydrated(true)
    } catch {
      const initial = createEmptyConversation()
      setConversations([initial])
      setActiveConversationId(initial.id)
      setHasHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated) return
    try {
      const stored = conversations.map(toStoredConversation)
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(stored))
    } catch (error: unknown) {
      console.warn('Failed to persist conversations:', error)
    }
  }, [conversations, hasHydrated])

  const handleNewConversation = () => {
    const next = createEmptyConversation()
    setConversations((prev) => [next, ...prev])
    setActiveConversationId(next.id)
  }

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setIsSidebarOpen(false)
  }

  const handleClearActiveChat = () => {
    if (!activeConversationId) return
    const now = new Date()
    setConversations((prev) =>
      sortConversationsByMostRecent(
        prev.map((c) =>
          c.id === activeConversationId
            ? {
              ...c,
              title: 'New chat',
              messages: [],
              updatedAt: now,
            }
            : c,
        ),
      ),
    )
  }

  const handleClearAllConversations = () => {
    const initial = createEmptyConversation()
    setConversations([initial])
    setActiveConversationId(initial.id)
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return
    if (!activeConversationId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    const conversationId = activeConversationId
    const baseMessages = activeConversation?.messages ?? []
    const requestMessages = [...baseMessages, userMessage]
      .filter((m) => !m.isLoading)
      .map((m) => ({ role: m.role, content: m.content }))

    setIsLoading(true)
    setConversations((prev) => {
      const now = new Date()
      const next = prev.map((c) => {
        if (c.id !== conversationId) return c
        const hasAnyUserMessages = c.messages.some((m) => m.role === 'user' && !m.isLoading)
        const title =
          c.title === 'New chat' && !hasAnyUserMessages ? deriveConversationTitle(content) : c.title
        return {
          ...c,
          title,
          updatedAt: now,
          messages: [...c.messages, userMessage, loadingMessage],
        }
      })
      return sortConversationsByMostRecent(next)
    })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: requestMessages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: data.content,
        citations: data.citations,
        timestamp: new Date(),
      }

      setConversations((prev) => {
        const now = new Date()
        const next = prev.map((c) => {
          if (c.id !== conversationId) return c
          return {
            ...c,
            updatedAt: now,
            messages: c.messages.map((m) => (m.id === loadingMessage.id ? assistantMessage : m)),
          }
        })
        return sortConversationsByMostRecent(next)
      })
    } catch (error: unknown) {
      console.error('Error:', error)
      const errorMessageText =
        error instanceof Error ? error.message : 'Unknown error. Please try again.'
      const errorMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessageText}`,
        timestamp: new Date(),
        isError: true,
      }
      setConversations((prev) => {
        const now = new Date()
        const next = prev.map((c) => {
          if (c.id !== conversationId) return c
          return {
            ...c,
            updatedAt: now,
            messages: c.messages.map((m) => (m.id === loadingMessage.id ? errorMessage : m)),
          }
        })
        return sortConversationsByMostRecent(next)
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.shell}>
      {isSidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onClearAllConversations={handleClearAllConversations}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className={styles.headerContent}>
              <div className={styles.headerBadge}>Evidence-first analysis</div>
              <h1 className={styles.title}>Epstein Files Analyzer</h1>
              <p className={styles.subtitle}>
                Search and analyze DOJ-released documents from the Jeffrey Epstein case
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={handleNewConversation}
                aria-label="Start a new chat"
              >
                New
              </button>
              <button
                type="button"
                className={styles.dangerAction}
                onClick={handleClearActiveChat}
                disabled={messages.length === 0 || isLoading}
                aria-label="Clear chat history"
              >
                Clear
              </button>
            </div>
          </div>
        </header>

        <div className={styles.messagesContainer}>
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h2 className={styles.emptyTitle}>Start Your Analysis</h2>
                <p className={styles.emptyText}>
                  Ask questions about the Epstein case files. The AI will search through thousands
                  of DOJ documents to provide detailed, cited answers.
                </p>
                <div className={styles.emptyPills}>
                  <span className={styles.emptyPill}>Sources on demand</span>
                  <span className={styles.emptyPill}>Cross-file verification</span>
                  <span className={styles.emptyPill}>Neutral summaries</span>
                </div>
                <div className={styles.suggestedPrompts}>
                  <button
                    onClick={() => handleSendMessage('What documents are in this collection?')}
                    className={styles.promptButton}
                  >
                    What documents are in this collection?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Summarize the main topics covered')}
                    className={styles.promptButton}
                  >
                    Summarize the main topics covered
                  </button>
                  <button
                    onClick={() => handleSendMessage('Find information about specific topics')}
                    className={styles.promptButton}
                  >
                    Find information about specific topics
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </main>
    </div>
  )
}

