export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  timestamp: Date
  isError?: boolean
  isLoading?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

