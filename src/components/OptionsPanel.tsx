import { useState, useEffect } from 'react'
import { X, Check, Book, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Reference = Database['public']['Tables']['references']['Row']
type Topic = Database['public']['Tables']['topics']['Row']

interface OptionsPanelProps {
  selectedReferences: Reference[]
  selectedTopics: Topic[]
  replyLength: 'short' | 'detailed' | 'article'
  onReferencesChange: (refs: Reference[]) => void
  onTopicsChange: (topics: Topic[]) => void
  onReplyLengthChange: (length: 'short' | 'detailed' | 'article') => void
  language: 'ar' | 'en'
  onClose: () => void
}

export function OptionsPanel({
  selectedReferences,
  selectedTopics,
  replyLength,
  onReferencesChange,
  onTopicsChange,
  onReplyLengthChange,
  language,
  onClose,
}: OptionsPanelProps) {
  const [references, setReferences] = useState<Reference[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [activeTab, setActiveTab] = useState<'references' | 'topics' | 'settings'>('references')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadReferences()
    loadTopics()
  }, [])

  const loadReferences = async () => {
    const { data } = await supabase
      .from('references')
      .select('*')
      .order('category', { ascending: true })
    
    if (data) setReferences(data)
  }

  const loadTopics = async () => {
    const { data } = await supabase
      .from('topics')
      .select('*')
      .order('name_ar', { ascending: true })
    
    if (data) setTopics(data)
  }

  const toggleReference = (ref: Reference) => {
    const isSelected = selectedReferences.some(r => r.id === ref.id)
    if (isSelected) {
      onReferencesChange(selectedReferences.filter(r => r.id !== ref.id))
    } else {
      onReferencesChange([...selectedReferences, ref])
    }
  }

  const toggleTopic = (topic: Topic) => {
    const isSelected = selectedTopics.some(t => t.id === topic.id)
    if (isSelected) {
      onTopicsChange(selectedTopics.filter(t => t.id !== topic.id))
    } else {
      onTopicsChange([...selectedTopics, topic])
    }
  }

  const filteredReferences = references.filter(ref => {
    const matchesSearch = searchTerm === '' || 
      ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.author?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || ref.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(references.map(r => r.category)))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'خيارات البحث' : 'Search Options'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('references')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'references'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Book className="w-4 h-4 inline-block mr-2" />
            {language === 'ar' ? 'المراجع' : 'References'} ({selectedReferences.length})
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'topics'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Tag className="w-4 h-4 inline-block mr-2" />
            {language === 'ar' ? 'المواضيع' : 'Topics'} ({selectedTopics.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'references' && (
            <div>
              <div className="mb-4 space-y-2">
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'البحث في المراجع...' : 'Search references...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="all">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                {filteredReferences.map(ref => (
                  <div
                    key={ref.id}
                    onClick={() => toggleReference(ref)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReferences.some(r => r.id === ref.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ref.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {ref.author} • {ref.year} • {ref.language}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ref.category} • {ref.source_type}
                        </p>
                      </div>
                      {selectedReferences.some(r => r.id === ref.id) && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-2">
              {topics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => toggleTopic(topic)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTopics.some(t => t.id === topic.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? topic.name_ar : topic.name_en}
                      </p>
                      {topic.description_ar && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {language === 'ar' ? topic.description_ar : topic.description_en}
                        </p>
                      )}
                    </div>
                    {selectedTopics.some(t => t.id === topic.id) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                {language === 'ar' ? 'طول الإجابة' : 'Reply Length'}
              </h3>
              <div className="space-y-2">
                {(['short', 'detailed', 'article'] as const).map(length => (
                  <label
                    key={length}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      name="replyLength"
                      value={length}
                      checked={replyLength === length}
                      onChange={() => onReplyLengthChange(length)}
                      className="text-primary"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' 
                          ? length === 'short' ? 'قصير' : length === 'detailed' ? 'مفصل' : 'مقال'
                          : length === 'short' ? 'Short' : length === 'detailed' ? 'Detailed' : 'Article'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ar'
                          ? length === 'short' ? '200-400 كلمة' : length === 'detailed' ? '700-1200 كلمة' : '3000-5000 كلمة'
                          : length === 'short' ? '200-400 words' : length === 'detailed' ? '700-1200 words' : '3000-5000 words'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-primary text-white rounded-lg py-2 px-4 hover:bg-primary/90 transition-colors"
          >
            {language === 'ar' ? 'تطبيق' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}