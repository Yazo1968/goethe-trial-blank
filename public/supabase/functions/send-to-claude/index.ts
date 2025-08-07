import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question, references, topics, chat_history, reply_length } = await req.json()

    // Get Anthropic API key from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY')
    }

    // Build the prompt template
    const referencesText = references.map((ref: any) => 
      `- ${ref.title} by ${ref.author || 'Unknown'} (${ref.year || 'N/A'}) - ${ref.url || 'No URL'}`
    ).join('\n')

    const topicsText = topics.map((topic: any) => 
      topic.name_ar
    ).join(', ')

    const chatHistoryText = chat_history.map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content_ar}`
    ).join('\n')

    const prompt = `You are an AI agent specialized in generating responses about Goethe and his Italian Journey in classical modern Arabic. Your task is to answer questions based on provided references and context.

First, review the following information:
1. References (use only these, do not use external sources):
<references>
${referencesText || 'No specific references selected'}
</references>

2. Chat history for context:
<chat_history>
${chatHistoryText || 'No previous conversation'}
</chat_history>

3. The question in Arabic:
<question_arabic>
${question}
</question_arabic>

4. Related topics to consider:
<related_topics>
${topicsText || 'No specific topics selected'}
</related_topics>

5. Desired length of the reply:
<reply_length>
${reply_length}
</reply_length>

Note: The reply length must be one of the following options:
• short: approximately 200-400 words
• detailed: approximately 700-1200 words
• article: approximately 3000-5000 words

Instructions:
1. Analysis and Planning:
   Begin with an analysis and planning phase. Wrap this section in <thinking_block> tags. In this phase, working in Arabic:
   a) Quote and number relevant passages from the references that pertain to the question.
   b) Analyze each quote's relevance to the question.
   c) List and number key themes and concepts related to Goethe and/or his Italian Journey.
   d) Identify and list key Arabic terms related to Goethe and his Italian Journey, including Arabic equivalents for important German terms.
   e) Translate key German terms to Arabic.
   f) Consider the cultural context and relevance to Arabic readers.
   g) Provide a brief summary of the chat history to ensure consistency.
   h) Select the most relevant references to answer the question.
   i) Determine which related topics are most pertinent.
   j) Plan how to structure your response within the specified length, including estimated word count for each section.
   k) Identify specific sources to cite and plan how to embed links to these sources in your reply.
   l) Outline the main points of your answer before writing it.
   m) Estimate the word count for each section of your planned response.
   n) Important: Only use information explicitly stated in the provided references. Do not infer, assume, or extrapolate any information beyond what is directly given in the sources.

2. Crafting the Response:
   After completing the analysis and planning, write your response in <answer> tags. When crafting your response:
   a) Write in classical modern Arabic, emulating the style of top Arabic writers specialized in refined travelling literature.
   b) Use a professional, formal tone.
   c) Include relevant quotes or references from the provided sources, citing them specifically.
   d) Embed links to the sources cited in your reply.
   e) If the question cannot be fully answered using the given references, acknowledge this limitation and provide the best possible answer based on available information.
   f) Adhere to the specified reply length.

3. Follow-up Questions:
   After your main response, generate 3 follow-up questions in <follow_up_questions> tags. These questions should:
   a) Explore new areas related to the topic.
   b) Not be repetitive or ask about information already covered in the chat history.
   c) Guide the user to explore the subject further.

Your output should be structured as follows:
<thinking_block>
[Your detailed analysis and planning in Arabic]
</thinking_block>

<answer>
[Your response in classical modern Arabic, including embedded source links]
</answer>

<follow_up_questions>
1. [First follow-up question in Arabic]
2. [Second follow-up question in Arabic]
3. [Third follow-up question in Arabic]
</follow_up_questions>

Remember to adhere strictly to the information provided in the references and do not add any information beyond what is explicitly stated in the sources.`

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 64000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse the response
    const thinkingMatch = content.match(/<thinking_block>([\s\S]*?)<\/thinking_block>/)
    const answerMatch = content.match(/<answer>([\s\S]*?)<\/answer>/)
    const followUpMatch = content.match(/<follow_up_questions>([\s\S]*?)<\/follow_up_questions>/)

    const thinking_block = thinkingMatch ? thinkingMatch[1].trim() : ''
    const answer = answerMatch ? answerMatch[1].trim() : content
    const follow_up_text = followUpMatch ? followUpMatch[1].trim() : ''

    // Parse follow-up questions
    const follow_up_questions = follow_up_text
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())

    // Calculate approximate token count
    const token_count = Math.ceil((prompt.length + content.length) / 4)

    return new Response(
      JSON.stringify({
        answer,
        thinking_block,
        follow_up_questions,
        token_count,
      }),
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