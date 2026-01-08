-- Create crops/products table for farmers to list their produce
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_per_kg DECIMAL(10,2),
  quantity_available INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  harvest_date DATE,
  location TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auctions table for auction-based selling
CREATE TABLE public.auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  current_bid DECIMAL(10,2),
  highest_bidder_id UUID,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bids table for tracking auction bids
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can view available products" 
ON public.products 
FOR SELECT 
USING (status = 'available');

CREATE POLICY "Farmers can insert their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = farmer_id);

-- Create policies for auctions
CREATE POLICY "Anyone can view active auctions" 
ON public.auctions 
FOR SELECT 
USING (status = 'active' OR auth.uid() = farmer_id OR auth.uid() = highest_bidder_id);

CREATE POLICY "Farmers can insert their own auctions" 
ON public.auctions 
FOR INSERT 
WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update their own auctions" 
ON public.auctions 
FOR UPDATE 
USING (auth.uid() = farmer_id);

-- Create policies for bids
CREATE POLICY "Anyone can view bids on active auctions" 
ON public.bids 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.auctions 
    WHERE auctions.id = bids.auction_id 
    AND auctions.status = 'active'
  )
);

CREATE POLICY "Authenticated users can place bids" 
ON public.bids 
FOR INSERT 
WITH CHECK (auth.uid() = bidder_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update auction current bid when new bid is placed
CREATE OR REPLACE FUNCTION public.update_auction_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.auctions
  SET 
    current_bid = NEW.amount,
    highest_bidder_id = NEW.bidder_id,
    updated_at = now()
  WHERE id = NEW.auction_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update auction when new bid is placed
CREATE TRIGGER update_auction_on_bid
  AFTER INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auction_bid();