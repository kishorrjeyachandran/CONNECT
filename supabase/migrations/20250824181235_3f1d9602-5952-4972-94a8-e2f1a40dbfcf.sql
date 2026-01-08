-- Add enhanced profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_description text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_size_acres numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url text;

-- Create ratings table for user reviews
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rated_user_id uuid NOT NULL,
  rating_user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  order_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(rated_user_id, rating_user_id, order_id)
);

-- Enable RLS on ratings table
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for ratings
CREATE POLICY "Anyone can view ratings" 
ON public.ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create ratings for completed orders" 
ON public.ratings 
FOR INSERT 
WITH CHECK (
  auth.uid() = rating_user_id AND 
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = ratings.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.farmer_id = auth.uid())
    AND orders.status = 'completed'
  )
);

CREATE POLICY "Users can update their own ratings" 
ON public.ratings 
FOR UPDATE 
USING (auth.uid() = rating_user_id);

-- Create trigger for ratings updated_at
CREATE TRIGGER update_ratings_updated_at
BEFORE UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION public.get_user_average_rating(user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(AVG(rating), 0)::numeric(3,2)
  FROM public.ratings
  WHERE rated_user_id = user_id;
$$;