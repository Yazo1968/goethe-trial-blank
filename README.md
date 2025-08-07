# Goethe's Italian Journey Arabic Chatbot

An intelligent Arabic chatbot powered by Claude AI that helps users explore Goethe's Italian Journey through 104 open-access scholarly references.

## Features

- 🌍 **Bilingual Support**: Full Arabic and English interface with RTL support
- 🤖 **Claude AI Integration**: Powered by Anthropic's Claude 3 Sonnet
- 📚 **104 Scholarly References**: Curated open-access bibliography
- 💬 **Smart Conversations**: Context-aware responses with follow-up questions
- 📝 **Multiple Reply Lengths**: Short (200-400 words), Detailed (700-1200 words), Article (3000-5000 words)
- 🎨 **Dark/Light Theme**: Customizable interface
- 📄 **PDF Export**: Export conversations with Arabic text support
- 🔐 **Secure Authentication**: Supabase Auth with magic links

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Anthropic Claude 3 Sonnet API
- **Deployment**: Netlify + Supabase Cloud

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Anthropic API key for Claude
- Git

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd goethe-chatbot
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API and copy your project URL and anon key
3. Run the database migration:
   - Go to SQL Editor in Supabase Dashboard
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Run the SQL to create tables

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Deploy Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Set the Anthropic API key secret:
```bash
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key
```

5. Deploy functions:
```bash
supabase functions deploy send-to-claude
supabase functions deploy export-chat-pdf
```

### 5. Import Bibliography Data

1. Set environment variables for the import script:
```bash
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. Run the import:
```bash
npm run import:references
```

This will import all 104 references from the bibliography and create default topics.

### 6. Create Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create a new bucket called `chat-exports`
3. Make it public (for PDF downloads)

### 7. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## Deployment

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify:
   - Connect your GitHub repo to Netlify
   - Set environment variables in Netlify dashboard
   - Deploy automatically on push

### Environment Variables for Production

Set these in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Usage

1. **Sign Up/Login**: Use email and password or magic link
2. **Start Chatting**: Ask questions about Goethe's Italian Journey in Arabic or English
3. **Select References**: Choose specific sources for more targeted answers
4. **Choose Topics**: Filter by themes like Art, Literature, Science
5. **Adjust Reply Length**: Get short summaries or detailed articles
6. **Export Chats**: Download conversations as PDF

## Project Structure

```
goethe-chatbot/
├── src/
│   ├── components/       # React components
│   ├── lib/             # Utilities and Supabase client
│   └── App.tsx          # Main application
├── supabase/
│   ├── functions/       # Edge Functions for Claude API
│   └── migrations/      # Database schema
├── scripts/
│   └── import-references.ts  # Data import script
└── public/              # Static assets
```

## API Usage Costs

- **Claude API**: ~$0.003 per 1K input tokens, $0.015 per 1K output tokens
- **Estimated**: $30-50/month for moderate usage (1000 queries)
- **Supabase**: Free tier includes 500MB database, 1GB storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Open an issue on GitHub
- Contact the maintainers

## Acknowledgments

- Bibliography sourced from open-access Goethe scholarship
- Built with Lovable.dev compatible architecture
- Powered by Anthropic's Claude AI