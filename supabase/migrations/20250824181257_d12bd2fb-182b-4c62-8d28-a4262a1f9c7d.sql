-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.get_user_average_rating(user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating), 0)::numeric(3,2)
  FROM public.ratings
  WHERE rated_user_id = user_id;
$$;