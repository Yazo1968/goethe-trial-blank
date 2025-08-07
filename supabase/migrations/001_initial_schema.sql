-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title_ar TEXT,
    title_en TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content_ar TEXT NOT NULL,
    thinking_block TEXT,
    follow_up_questions JSONB,
    reply_length TEXT CHECK (reply_length IN ('short', 'detailed', 'article')),
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- References table (104 bibliography sources)
CREATE TABLE IF NOT EXISTS public.references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    author TEXT,
    title TEXT NOT NULL,
    year INTEGER,
    language TEXT,
    url TEXT,
    source_type TEXT,
    format TEXT,
    subject_focus TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for message-reference relationships
CREATE TABLE IF NOT EXISTS public.message_references (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    reference_id UUID REFERENCES public.references(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, reference_id)
);

-- Junction table for message-topic relationships
CREATE TABLE IF NOT EXISTS public.message_topics (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, topic_id)
);

-- Create indexes for better performance
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_references_category ON public.references(category);
CREATE INDEX idx_references_language ON public.references(language);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for chats
CREATE POLICY "Users can view own chats" ON public.chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON public.chats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON public.chats
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in own chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chats.id = messages.chat_id
            AND chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own chats" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chats.id = messages.chat_id
            AND chats.user_id = auth.uid()
        )
    );

-- RLS Policies for message_references
CREATE POLICY "Users can view message references in own chats" ON public.message_references
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages
            JOIN public.chats ON chats.id = messages.chat_id
            WHERE messages.id = message_references.message_id
            AND chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create message references in own chats" ON public.message_references
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages
            JOIN public.chats ON chats.id = messages.chat_id
            WHERE messages.id = message_references.message_id
            AND chats.user_id = auth.uid()
        )
    );

-- RLS Policies for message_topics
CREATE POLICY "Users can view message topics in own chats" ON public.message_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages
            JOIN public.chats ON chats.id = messages.chat_id
            WHERE messages.id = message_topics.message_id
            AND chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create message topics in own chats" ON public.message_topics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages
            JOIN public.chats ON chats.id = messages.chat_id
            WHERE messages.id = message_topics.message_id
            AND chats.user_id = auth.uid()
        )
    );

-- References and topics are publicly readable
CREATE POLICY "Anyone can view references" ON public.references
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view topics" ON public.topics
    FOR SELECT USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();