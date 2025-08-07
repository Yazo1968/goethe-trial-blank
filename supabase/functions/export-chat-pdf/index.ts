import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { chat_id, include_thinking = false } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get chat details
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chat_id)
      .single()

    if (chatError || !chat) {
      throw new Error('Chat not found')
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true })

    if (messagesError || !messages) {
      throw new Error('Messages not found')
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    
    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    let yPosition = height - 50
    const lineHeight = 20
    const margin = 50

    // Title
    page.drawText('Goethe\'s Italian Journey - Chat Export', {
      x: margin,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    
    yPosition -= lineHeight * 2

    // Chat metadata
    page.drawText(`Chat Title: ${chat.title_ar || chat.title_en || 'Untitled'}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    
    yPosition -= lineHeight
    
    page.drawText(`Date: ${new Date(chat.created_at).toLocaleDateString()}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    
    yPosition -= lineHeight * 2

    // Messages
    for (const message of messages) {
      // Check if we need a new page
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage()
        yPosition = height - 50
      }

      // Role
      page.drawText(message.role === 'user' ? 'User:' : 'Assistant:', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: message.role === 'user' ? rgb(0, 0, 0.8) : rgb(0.8, 0, 0),
      })
      
      yPosition -= lineHeight

      // Content (simplified - in production, you'd want better text wrapping)
      const content = message.content_ar
      const words = content.split(' ')
      let line = ''
      const maxWidth = width - 2 * margin
      
      for (const word of words) {
        const testLine = line + word + ' '
        const textWidth = font.widthOfTextAtSize(testLine, 10)
        
        if (textWidth > maxWidth && line !== '') {
          page.drawText(line.trim(), {
            x: margin,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
          })
          yPosition -= lineHeight
          line = word + ' '
          
          if (yPosition < 100) {
            const newPage = pdfDoc.addPage()
            yPosition = height - 50
          }
        } else {
          line = testLine
        }
      }
      
      if (line) {
        page.drawText(line.trim(), {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        yPosition -= lineHeight
      }
      
      yPosition -= lineHeight // Extra space between messages
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes))
    
    // Upload to Supabase Storage
    const fileName = `chat-${chat_id}-${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-exports')
      .upload(fileName, pdfBase64, {
        contentType: 'application/pdf',
      })

    if (uploadError) {
      throw new Error('Failed to upload PDF')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-exports')
      .getPublicUrl(fileName)

    // Update chat with PDF URL
    await supabase
      .from('chats')
      .update({ pdf_url: publicUrl })
      .eq('id', chat_id)

    return new Response(
      JSON.stringify({ pdf_url: publicUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})