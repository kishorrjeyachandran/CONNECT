import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface StartConversationButtonProps {
  farmerId: string;
  productId?: string;
  orderId?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export default function StartConversationButton({
  farmerId,
  productId,
  orderId,
  variant = 'outline',
  size = 'sm',
  className
}: StartConversationButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startConversation = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to start a conversation',
        variant: 'destructive'
      });
      return;
    }

    if (user.id === farmerId) {
      toast({
        title: 'Cannot message yourself',
        description: 'You cannot start a conversation with yourself',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Use the database function to get or create conversation
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_conversation', {
          participant1_id: user.id,
          participant2_id: farmerId
        });

      if (error) throw error;

      // Update conversation with product/order context if provided
      if (productId || orderId) {
        await supabase
          .from('conversations')
          .update({ 
            product_id: productId || null,
            order_id: orderId || null
          })
          .eq('id', conversationId);
      }

      // Navigate to conversation
      navigate(`/messages?conversation=${conversationId}`);
      
      toast({
        title: "Success",
        description: "Conversation started!",
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive'
      });
      console.error('Error starting conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={startConversation}
      disabled={loading}
      className={className}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      {loading ? 'Starting...' : 'Message'}
    </Button>
  );
}