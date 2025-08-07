import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot } from 'lucide-react'
import { formatDate } from '../lib/utils'
import type { Database } from '../lib/database.types'

type Message = Database['public']['Tables']['messages']['Row']

interface MessageListProps {
  messages: Message[]
  language: 'ar' | 'en'
  onFollowUpClick: (question: string) => void
}

export function MessageList({ messages, language, onFollowUpClick }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-arabic">
            {language === 'ar' 
              ? 'مرحباً بك في رحلة جوته الإيطالية' 
              : "Welcome to Goethe's Italian Journey"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ar'
              ? 'اطرح أي سؤال حول رحلة جوته إلى إيطاليا وسأساعدك بالإجابة من المراجع المتاحة.'
              : "Ask any question about Goethe's journey to Italy and I'll help you with answers from available references."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${
            message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'assistant'
                ? 'bg-primary/10'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {message.role === 'assistant' ? (
              <Bot className="w-6 h-6 text-primary" />
            ) : (
              <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          
          <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
            <div
              className={`inline-block max-w-full rounded-2xl px-4 py-3 ${
                message.role === 'assistant'
                  ? 'bg-white dark:bg-gray-800 shadow-sm'
                  : 'bg-primary text-white'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content_ar}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content_ar}</p>
              )}
            </div>
            
            {message.follow_up_questions && Array.isArray(message.follow_up_questions) && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {language === 'ar' ? 'أسئلة متابعة مقترحة:' : 'Suggested follow-up questions:'}
                </p>
                {(message.follow_up_questions as string[]).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => onFollowUpClick(question)}
                    className="block w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {formatDate(message.created_at, language)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}