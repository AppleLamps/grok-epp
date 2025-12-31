'use client'

import styles from './Sidebar.module.css'
import type { Conversation } from '@/types'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  onClearAllConversations: () => void
  isOpen?: boolean
  onClose?: () => void
}

function formatSidebarTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  return date.toLocaleDateString()
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onClearAllConversations,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const sidebarClass = isOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar

  return (
    <aside className={sidebarClass} aria-label="Conversation history">
      <div className={styles.top}>
        <div className={styles.topRow}>
          <div className={styles.brand}>
            <div className={styles.brandMark} aria-hidden="true" />
            <div className={styles.brandText}>
              <div className={styles.brandTitle}>Epstein Analyzer</div>
              <div className={styles.brandSubtitle}>Chats</div>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button className={styles.primaryButton} onClick={onNewConversation} type="button">
          New chat
        </button>
      </div>

      <div className={styles.list} role="list">
        {conversations.length === 0 ? (
          <div className={styles.empty}>No conversations yet</div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeConversationId
            return (
              <button
                key={c.id}
                type="button"
                role="listitem"
                className={isActive ? styles.itemActive : styles.item}
                onClick={() => onSelectConversation(c.id)}
              >
                <div className={styles.itemTop}>
                  <div className={styles.itemTitle}>{c.title || 'Untitled chat'}</div>
                  <div className={styles.itemTime}>{formatSidebarTime(c.updatedAt)}</div>
                </div>
                <div className={styles.itemMeta}>
                  {c.messages.length} message{c.messages.length === 1 ? '' : 's'}
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className={styles.bottom}>
        <button className={styles.secondaryButton} onClick={onClearAllConversations} type="button">
          Clear all
        </button>
      </div>
    </aside>
  )
}

