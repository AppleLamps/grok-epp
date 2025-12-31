'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { Message } from '@/types'
import styles from './ChatMessage.module.css'

interface ChatMessageProps {
  message: Message
}

function getRelativeTime(timestamp: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return timestamp.toLocaleDateString()
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [showTimestamp, setShowTimestamp] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBubbleInteraction = () => {
    if (isTouchDevice) {
      setShowTimestamp((prev) => !prev)
    }
  }

  if (message.isLoading) {
    return (
      <div className={styles.messageAssistant}>
        <div className={styles.bubbleAssistant}>
          <div className={styles.loading}>
            <div className={styles.loadingDots}>
              <div className={styles.dot}></div>
              <div className={`${styles.dot} ${styles.dotDelay1}`}></div>
              <div className={`${styles.dot} ${styles.dotDelay2}`}></div>
            </div>
            <span className={styles.loadingText}>Thinking...</span>
          </div>
        </div>
      </div>
    )
  }

  const bubbleClass = isUser
    ? styles.bubbleUser
    : message.isError
      ? styles.bubbleError
      : styles.bubbleAssistant

  return (
    <div className={isUser ? styles.messageUser : styles.messageAssistant}>
      <div
        className={bubbleClass}
        onMouseEnter={() => !isTouchDevice && setShowTimestamp(true)}
        onMouseLeave={() => !isTouchDevice && setShowTimestamp(false)}
        onClick={handleBubbleInteraction}
      >
        {message.isError && (
          <div className={styles.errorIcon}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
          </div>
        )}
        <div className={styles.content}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              a: ({ children, href }) => {
                const safeHref = typeof href === 'string' ? href : ''
                const isHttp = safeHref.startsWith('http://') || safeHref.startsWith('https://')
                return (
                  <a
                    href={safeHref}
                    target={isHttp ? '_blank' : undefined}
                    rel={isHttp ? 'noopener noreferrer' : undefined}
                  >
                    {children}
                  </a>
                )
              },
              code: ({ className, children, ...props }) => {
                // react-markdown sets className like "language-ts" for fenced blocks.
                const language = typeof className === 'string' ? className : ''
                const isBlock = language.startsWith('language-')
                return isBlock ? (
                  <code className={styles.codeBlock} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className={styles.inlineCode} {...props}>
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.citations && message.citations.length > 0 && (
          <div className={styles.citations}>
            <details className={styles.citationsDetails}>
              <summary className={styles.citationsTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                  <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                </svg>
                Sources
              </summary>
              <div className={styles.citationsList}>
                {message.citations.map((citation, index) => {
                  const isUrl = citation.startsWith('http://') || citation.startsWith('https://')
                  return isUrl ? (
                    <a
                      key={index}
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.citationLink}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
                        <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
                      </svg>
                      {citation}
                    </a>
                  ) : (
                    <div key={index} className={styles.citation}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                      </svg>
                      {citation}
                    </div>
                  )
                })}
              </div>
            </details>
          </div>
        )}
        <div className={styles.footer}>
          {showTimestamp && (
            <div className={isUser ? styles.timestampUser : styles.timestampAssistant}>
              {getRelativeTime(message.timestamp)}
            </div>
          )}
          {!isUser && !message.isError && message.content && (
            <button
              onClick={handleCopy}
              className={styles.copyButton}
              aria-label="Copy message"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

