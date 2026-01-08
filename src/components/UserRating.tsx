import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UserRatingProps {
  userId: string;
  showCount?: boolean;
  size?: 'sm' | 'md';
}

export const UserRating = ({ userId, showCount = true, size = 'sm' }: UserRatingProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchRating = async () => {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_user_id', userId);

      if (!error && data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setRating(Math.round(avg * 10) / 10);
        setCount(data.length);
      }
    };

    fetchRating();
  }, [userId]);

  if (rating === null) return null;

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1">
      <Star className={cn(iconSize, 'fill-yellow-400 text-yellow-400')} />
      <span className={cn(textSize, 'font-medium')}>{rating.toFixed(1)}</span>
      {showCount && (
        <span className={cn(textSize, 'text-muted-foreground')}>({count})</span>
      )}
    </div>
  );
};
