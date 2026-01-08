-- Enable realtime for conversations and messages tables
ALTER publication supabase_realtime ADD TABLE conversations;
ALTER publication supabase_realtime ADD TABLE messages;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 
ON conversations(participant_1);

CREATE INDEX IF NOT EXISTS idx_conversations_participant2 
ON conversations(participant_2);

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
  WHERE (participant_1 = participant1_id AND participant_2 = participant2_id)
     OR (participant_1 = participant2_id AND participant_2 = participant1_id);
    
  -- If no conversation found, create new one
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (participant1_id, participant2_id)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';