-- Enable the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chats table
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  title_ar TEXT,
  title_en TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content_ar TEXT NOT NULL,
  thinking_block TEXT,
  follow_up_questions JSONB,
  reply_length TEXT CHECK (reply_length IN ('short', 'detailed', 'article')),
  token_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create references table
CREATE TABLE public.references (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  author TEXT,
  title TEXT NOT NULL,
  year INTEGER,
  language TEXT,
  url TEXT,
  source_type TEXT,
  format TEXT,
  subject_focus TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT,
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for message-reference relationships
CREATE TABLE public.message_references (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reference_id UUID NOT NULL REFERENCES public.references(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, reference_id)
);

-- Create junction table for message-topic relationships
CREATE TABLE public.message_topics (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, topic_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_references_category ON public.references(category);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Create RLS policies for chats
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own chats" ON public.chats
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own chats" ON public.chats
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages from their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create messages in their chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id::text = auth.uid()::text
    )
  );

-- Create RLS policies for references (publicly readable)
CREATE POLICY "References are publicly readable" ON public.references
  FOR SELECT USING (true);

-- Create RLS policies for topics (publicly readable)
CREATE POLICY "Topics are publicly readable" ON public.topics
  FOR SELECT USING (true);

-- Create RLS policies for junction tables
CREATE POLICY "Users can view message references for their messages" ON public.message_references
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      JOIN public.chats ON messages.chat_id = chats.id
      WHERE messages.id = message_references.message_id 
      AND chats.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create message references for their messages" ON public.message_references
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages 
      JOIN public.chats ON messages.chat_id = chats.id
      WHERE messages.id = message_references.message_id 
      AND chats.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can view message topics for their messages" ON public.message_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      JOIN public.chats ON messages.chat_id = chats.id
      WHERE messages.id = message_topics.message_id 
      AND chats.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create message topics for their messages" ON public.message_topics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages 
      JOIN public.chats ON messages.chat_id = chats.id
      WHERE messages.id = message_topics.message_id 
      AND chats.user_id::text = auth.uid()::text
    )
  );

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for chat exports
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-exports', 'chat-exports', false);

-- Create storage policies for chat exports
CREATE POLICY "Users can view their own chat exports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own chat exports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chat exports" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat exports" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-exports' AND auth.uid()::text = (storage.foldername(name))[1]);