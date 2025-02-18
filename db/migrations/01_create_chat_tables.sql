
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat threads table
CREATE TABLE chat_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tool outputs table
CREATE TABLE tool_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_call_id TEXT,
    parameters JSONB,
    result JSONB,
    state TEXT CHECK (state IN ('pending', 'result', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_chat_threads_user_id ON chat_threads(user_id);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_tool_outputs_message_id ON tool_outputs(message_id);

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updating updated_at
CREATE TRIGGER update_chat_threads_updated_at
    BEFORE UPDATE ON chat_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_outputs ENABLE ROW LEVEL SECURITY;

-- Chat threads policies
CREATE POLICY "Users can view own threads"
    ON chat_threads FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own threads"
    ON chat_threads FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads"
    ON chat_threads FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in own threads"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM chat_threads
        WHERE chat_threads.id = chat_messages.thread_id
        AND chat_threads.user_id = auth.uid()
    ));

CREATE POLICY "Users can create messages in own threads"
    ON chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM chat_threads
        WHERE chat_threads.id = chat_messages.thread_id
        AND chat_threads.user_id = auth.uid()
    ));

-- Tool outputs policies
CREATE POLICY "Users can view tool outputs in own threads"
    ON tool_outputs FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM chat_messages
        JOIN chat_threads ON chat_threads.id = chat_messages.thread_id
        WHERE chat_messages.id = tool_outputs.message_id
        AND chat_threads.user_id = auth.uid()
    ));

CREATE POLICY "Users can create tool outputs in own threads"
    ON tool_outputs FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM chat_messages
        JOIN chat_threads ON chat_threads.id = chat_messages.thread_id
        WHERE chat_messages.id = tool_outputs.message_id
        AND chat_threads.user_id = auth.uid()
    ));
