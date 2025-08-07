import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// You'll need to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Parse the bibliography markdown file
function parseBibliography(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const references: any[] = []
  
  let inTable = false
  for (const line of lines) {
    if (line.includes('| Category | Author(s) | Title |')) {
      inTable = true
      continue
    }
    
    if (inTable && line.startsWith('|') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 9) {
        references.push({
          category: parts[0],
          author: parts[1] !== 'Unknown' ? parts[1] : null,
          title: parts[2],
          year: parts[3] !== 'n.d.' && parts[3] !== 'n/a' ? parseInt(parts[3]) : null,
          language: parts[4],
          source_type: parts[5],
          format: parts[6],
          subject_focus: parts[7],
          url: parts[8] !== '' ? parts[8] : null,
        })
      }
    }
  }
  
  return references
}

// Import topics
async function importTopics() {
  const topics = [
    { name_ar: 'الفن والعمارة', name_en: 'Art and Architecture', category: 'cultural' },
    { name_ar: 'الأدب والشعر', name_en: 'Literature and Poetry', category: 'literary' },
    { name_ar: 'العلوم الطبيعية', name_en: 'Natural Sciences', category: 'scientific' },
    { name_ar: 'الموسيقى والمسرح', name_en: 'Music and Theater', category: 'cultural' },
    { name_ar: 'الفلسفة والفكر', name_en: 'Philosophy and Thought', category: 'philosophical' },
    { name_ar: 'التاريخ والسياسة', name_en: 'History and Politics', category: 'historical' },
    { name_ar: 'الجغرافيا والمناظر الطبيعية', name_en: 'Geography and Landscapes', category: 'geographical' },
    { name_ar: 'المجتمع والثقافة الإيطالية', name_en: 'Italian Society and Culture', category: 'cultural' },
    { name_ar: 'السيرة الذاتية لجوته', name_en: "Goethe's Biography", category: 'biographical' },
    { name_ar: 'تأثير الرحلة على أعمال جوته', name_en: "Journey's Impact on Goethe's Work", category: 'literary' },
  ]

  const { error } = await supabase.from('topics').insert(topics)
  if (error) {
    console.error('Error importing topics:', error)
  } else {
    console.log(`Imported ${topics.length} topics`)
  }
}

// Main import function
async function importData() {
  try {
    // Import references from bibliography
    const bibliographyPath = path.join(__dirname, '../../goethe-open-access-bibliography (1).md')
    const references = parseBibliography(bibliographyPath)
    
    console.log(`Parsed ${references.length} references`)
    
    // Insert references in batches
    const batchSize = 50
    for (let i = 0; i < references.length; i += batchSize) {
      const batch = references.slice(i, i + batchSize)
      const { error } = await supabase.from('references').insert(batch)
      
      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error)
      } else {
        console.log(`Imported batch ${i / batchSize + 1} (${batch.length} references)`)
      }
    }
    
    // Import topics
    await importTopics()
    
    console.log('Import completed successfully!')
  } catch (error) {
    console.error('Import failed:', error)
  }
}

// Run the import
importData()