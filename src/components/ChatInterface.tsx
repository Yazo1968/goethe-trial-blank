import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { OptionsPanel } from './OptionsPanel'
import type { Database } from '../lib/database.types'

type Message = Database['public']['Tables']['messages']['Row']
type Reference = Database['public']['Tables']['references']['Row']
type Topic = Database['public']['Tables']['topics']['Row']

interface ChatInterfaceProps {
  userId: string
  chatId: string | null
  onNewChat: (chatId: string) => void
  language: 'ar' | 'en'
}

export function ChatInterface({ userId, chatId, onNewChat, language }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReferences, setSelectedReferences] = useState<Reference[]>([])
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([])
  const [replyLength, setReplyLength] = useState<'short' | 'detailed' | 'article'>('detailed')
  const [showOptions, setShowOptions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatId) {
      loadMessages()
    } else {
      setMessages([])
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!chatId) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
  }

  const createNewChat = async (firstMessage: string): Promise<string> => {
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        user_id: userId,
        title_ar: firstMessage.substring(0, 50),
        title_en: firstMessage.substring(0, 50),
      })
      .select()
      .single()

    if (chatError || !newChat) {
      throw new Error('Failed to create chat')
    }

    return newChat.id
  }

  const sendMessage = async (content: string) => {
    setLoading(true)
    let currentChatId = chatId

    try {
      // Create new chat if needed
      if (!currentChatId) {
        currentChatId = await createNewChat(content)
        onNewChat(currentChatId)
      }

      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'user' as const,
          content_ar: content,
          reply_length: replyLength,
        })
        .select()
        .single()

      if (userError || !userMessage) {
        throw new Error('Failed to save message')
      }

      // Add user message to UI
      setMessages(prev => [...prev, userMessage])

      // Save selected references
      if (selectedReferences.length > 0) {
        await supabase.from('message_references').insert(
          selectedReferences.map(ref => ({
            message_id: userMessage.id,
            reference_id: ref.id,
          }))
        )
      }

      // Save selected topics
      if (selectedTopics.length > 0) {
        await supabase.from('message_topics').insert(
          selectedTopics.map(topic => ({
            message_id: userMessage.id,
            topic_id: topic.id,
          }))
        )
      }

      // Call Edge Function to get Claude response
      const { data: response, error: responseError } = await supabase.functions.invoke('send-to-claude', {
        body: {
          question: content,
          references: selectedReferences,
          topics: selectedTopics,
          chat_history: messages,
          reply_length: replyLength,
        },
      })

      if (responseError || !response) {
        throw new Error('Failed to get response from Claude')
      }

      // Save assistant message
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'assistant' as const,
          content_ar: response.answer,
          thinking_block: response.thinking_block,
          follow_up_questions: response.follow_up_questions,
          token_count: response.token_count,
        })
        .select()
        .single()

      if (!assistantError && assistantMessage) {
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <MessageList 
          messages={messages} 
          language={language}
          onFollowUpClick={(question) => sendMessage(question)}
        />
        <div ref={messagesEndRef} />
      </div>
      
      {showOptions && (
        <OptionsPanel
          selectedReferences={selectedReferences}
          selectedTopics={selectedTopics}
          replyLength={replyLength}
          onReferencesChange={setSelectedReferences}
          onTopicsChange={setSelectedTopics}
          onReplyLengthChange={setReplyLength}
          language={language}
          onClose={() => setShowOptions(false)}
        />
      )}
      
      <MessageInput
        onSendMessage={sendMessage}
        loading={loading}
        language={language}
        onShowOptions={() => setShowOptions(true)}
        hasSelectedOptions={selectedReferences.length > 0 || selectedTopics.length > 0}
      />
    </div>
  )
}