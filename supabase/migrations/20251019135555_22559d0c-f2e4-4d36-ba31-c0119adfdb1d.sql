-- Fix security warnings by restricting data visibility

-- Update products table RLS policy to hide farmer identity from public
-- Remove the public select policy and create authenticated-only policy
DROP POLICY IF EXISTS "Anyone can view available products" ON products;

-- Create new policy that hides farmer_id from unauthenticated users
CREATE POLICY "Authenticated users can view products" 
ON products FOR SELECT 
USING (
  auth.role() = 'authenticated'
);

-- Create policy for unauthenticated users to view limited product data
-- This would require creating a view, but for now we'll keep it authenticated-only

-- Update bids table RLS policy to restrict visibility to auction participants only
DROP POLICY IF EXISTS "Anyone can view bids on active auctions" ON bids;

CREATE POLICY "Auction participants can view bids" 
ON bids FOR SELECT 
USING (
  -- Bidder can see their own bids
  bidder_id = auth.uid() 
  OR 
  -- Farmer can see all bids on their auction
  EXISTS (
    SELECT 1 FROM auctions 
    WHERE auctions.id = bids.auction_id 
    AND auctions.farmer_id = auth.uid()
  )
);