-- Create messages system with real-time capabilities
-- Enable realtime for existing conversations and messages tables
ALTER publication supabase_realtime ADD TABLE conversations;
ALTER publication supabase_realtime ADD TABLE messages;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
ON conversations USING gin(participants);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Create function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  participant1_id UUID,
  participant2_id UUID
) RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE participants @> ARRAY[participant1_id, participant2_id]
    AND participants <@ ARRAY[participant1_id, participant2_id];
    
  -- If no conversation found, create new one
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participants, created_by)
    VALUES (ARRAY[participant1_id, participant2_id], participant1_id)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;