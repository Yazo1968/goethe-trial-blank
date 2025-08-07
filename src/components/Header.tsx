import type { User } from '@supabase/supabase-js'
import { Globe, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react'

interface HeaderProps {
  user: User
  language: 'ar' | 'en'
  theme: 'light' | 'dark'
  onLanguageChange: (lang: 'ar' | 'en') => void
  onThemeChange: (theme: 'light' | 'dark') => void
  onSignOut: () => void
}

export function Header({
  user,
  language,
  theme,
  onLanguageChange,
  onThemeChange,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-arabic">
            {language === 'ar' ? 'رحلة جوته الإيطالية' : "Goethe's Italian Journey"}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-full bg-primary/10">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {user.email}
            </span>
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={language === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
            >
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}