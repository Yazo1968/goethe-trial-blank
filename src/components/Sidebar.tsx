import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, MessageSquare, Download, Archive } from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import type { Database } from '../lib/database.types'

type Chat = Database['public']['Tables']['chats']['Row']

interface SidebarProps {
  userId: string
  selectedChatId: string | null
  onSelectChat: (chatId: string | null) => void
  language: 'ar' | 'en'
}

export function Sidebar({ userId, selectedChatId, onSelectChat, language }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChats()
  }, [userId])

  const loadChats = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setChats(data)
    }
    setLoading(false)
  }

  const exportChat = async (chatId: string) => {
    const { data, error } = await supabase.functions.invoke('export-chat-pdf', {
      body: { chat_id: chatId },
    })

    if (!error && data?.pdf_url) {
      window.open(data.pdf_url, '_blank')
    }
  }

  const archiveChat = async (chatId: string) => {
    await supabase
      .from('chats')
      .update({ is_archived: true })
      .eq('id', chatId)

    setChats(chats.filter(chat => chat.id !== chatId))
    if (selectedChatId === chatId) {
      onSelectChat(null)
    }
  }

  return (
    <div className="w-80 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onSelectChat(null)}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-2 px-4 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-arabic">
            {language === 'ar' ? 'محادثة جديدة' : 'New Chat'}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {language === 'ar' ? 'لا توجد محادثات' : 'No chats yet'}
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`mb-2 rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedChatId === chat.id
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {truncateText(language === 'ar' ? chat.title_ar || '' : chat.title_en || '', 30)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(chat.updated_at, language)}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        exportChat(chat.id)
                      }}
                      className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                      title={language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        archiveChat(chat.id)
                      }}
                      className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                      title={language === 'ar' ? 'أرشفة' : 'Archive'}
                    >
                      <Archive className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}