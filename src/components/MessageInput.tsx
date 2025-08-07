import { useState, type KeyboardEvent } from 'react'
import { Send, Settings, Loader } from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  loading: boolean
  language: 'ar' | 'en'
  onShowOptions: () => void
  hasSelectedOptions: boolean
}

export function MessageInput({
  onSendMessage,
  loading,
  language,
  onShowOptions,
  hasSelectedOptions,
}: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !loading) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-3">
          <button
            onClick={onShowOptions}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              hasSelectedOptions
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">
              {language === 'ar' ? 'خيارات البحث' : 'Search Options'}
            </span>
            {hasSelectedOptions && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                ✓
              </span>
            )}
          </button>
        </div>
        
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'ar'
                ? 'اكتب سؤالك هنا عن رحلة جوته إلى إيطاليا...'
                : "Type your question about Goethe's Italian Journey..."
            }
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            disabled={loading}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="self-end px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}