import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { AuthModal } from './components/AuthModal'
import { getDirection } from './lib/utils'
import type { User } from '@supabase/supabase-js'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    // Apply language direction
    document.documentElement.dir = getDirection(language)
    document.documentElement.lang = language
  }, [language])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary">
        <div className="text-white text-2xl font-arabic">جاري التحميل...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-arabic">
              رحلة جوته الإيطالية
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Goethe's Italian Journey Companion
            </p>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="w-full bg-primary text-white rounded-lg py-3 px-4 hover:bg-primary/90 transition-colors font-arabic text-lg"
          >
            تسجيل الدخول للمتابعة
          </button>
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary"
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        userId={user.id}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        language={language}
      />
      <div className="flex-1 flex flex-col">
        <Header
          user={user}
          language={language}
          theme={theme}
          onLanguageChange={setLanguage}
          onThemeChange={setTheme}
          onSignOut={() => supabase.auth.signOut()}
        />
        <ChatInterface
          userId={user.id}
          chatId={selectedChatId}
          onNewChat={(chatId) => setSelectedChatId(chatId)}
          language={language}
        />
      </div>
    </div>
  )
}

export default App