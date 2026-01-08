-- Create orders table to track purchases and transactions
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  auction_id UUID REFERENCES public.auctions(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price > 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled')),
  order_type TEXT NOT NULL CHECK (order_type IN ('direct_purchase', 'auction_win')),
  delivery_method TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'delivery')),
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view their own orders as buyers" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = buyer_id);

CREATE POLICY "Farmers can view orders for their products" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = farmer_id);

CREATE POLICY "Buyers can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Farmers can update orders for their products" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = farmer_id);

CREATE POLICY "Buyers can update their own orders (limited)" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = buyer_id AND status IN ('pending'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_farmer_id ON public.orders(farmer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- Add constraint to ensure either product_id or auction_id is set, but not both
ALTER TABLE public.orders 
ADD CONSTRAINT check_product_or_auction 
CHECK (
  (product_id IS NOT NULL AND auction_id IS NULL) OR 
  (product_id IS NULL AND auction_id IS NOT NULL)
);