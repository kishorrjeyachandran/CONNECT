import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ArrowLeft, Plus, Clock, DollarSign, Users, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Auction {
  id: string;
  product_id: string;
  farmer_id: string;
  starting_price: number;
  current_bid: number | null;
  highest_bidder_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  products?: {
    name: string;
    description: string;
    category: string;
    quantity_available: number;
    unit: string;
    location: string;
  };
}

interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
}

export const Auctions: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState('');
  const [formData, setFormData] = useState({
    product_id: '',
    starting_price: '',
  });

  useEffect(() => {
    if (user) {
      fetchAuctions();
      if (profile?.role === 'farmer') {
        fetchUserProducts();
      }
    }
  }, [user, profile]);

  const fetchAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          products (
            name,
            description,
            category,
            quantity_available,
            unit,
            location
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', user?.id)
        .eq('status', 'available');

      if (error) throw error;
      setUserProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchBids = async (auctionId: string) => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!endDate || !endTime) {
      toast.error('Please select both date and time for auction end');
      return;
    }
    
    try {
      // Combine date and time
      const [hours, minutes] = endTime.split(':');
      const combinedDateTime = new Date(endDate);
      combinedDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      const { error } = await supabase
        .from('auctions')
        .insert({
          product_id: formData.product_id,
          farmer_id: user?.id,
          starting_price: parseFloat(formData.starting_price),
          end_time: combinedDateTime.toISOString(),
          status: 'active',
        });

      if (error) throw error;

      toast.success('Auction created successfully!');
      setShowCreateForm(false);
      setFormData({ product_id: '', starting_price: '' });
      setEndDate(undefined);
      setEndTime('');
      fetchAuctions();
    } catch (error) {
      console.error('Error creating auction:', error);
      toast.error('Failed to create auction');
    }
  };

  const handlePlaceBid = async (auctionId: string) => {
    try {
      const amount = parseFloat(bidAmount);
      const auction = auctions.find(a => a.id === auctionId);
      
      if (!auction) return;
      
      const minBid = auction.current_bid ? auction.current_bid + 1 : auction.starting_price;
      if (amount < minBid) {
        toast.error(`Bid must be at least $${minBid}`);
        return;
      }

      const { error } = await supabase
        .from('bids')
        .insert({
          auction_id: auctionId,
          bidder_id: user?.id,
          amount: amount,
        });

      if (error) throw error;

      toast.success('Bid placed successfully!');
      setBidAmount('');
      setSelectedAuction(null);
      fetchAuctions();
    } catch (error) {
      console.error('Error placing bid:', error);
      toast.error('Failed to place bid');
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Auctions</h1>
          </div>
          <div className="flex items-center gap-4">
            {profile?.role === 'farmer' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Auction
              </Button>
            )}
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showCreateForm && profile?.role === 'farmer' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Auction</CardTitle>
              <CardDescription>
                Select a product and set auction parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAuction} className="space-y-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {userProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.quantity_available} {product.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="starting_price">Starting Price ($)</Label>
                  <Input
                    id="starting_price"
                    type="number"
                    step="0.01"
                    value={formData.starting_price}
                    onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Auction</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {auctions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Auctions</h3>
              <p className="text-muted-foreground">
                {profile?.role === 'farmer' 
                  ? 'Create your first auction to start selling your products!'
                  : 'Check back later for new auctions from farmers.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {auction.products?.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      {auction.products?.category}
                    </span>
                  </CardTitle>
                  <CardDescription>{auction.products?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Current bid:</span>
                    </div>
                    <span className="font-bold">
                      ${auction.current_bid || auction.starting_price}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Time left:</span>
                    </div>
                    <span className="font-medium">
                      {formatTimeRemaining(auction.end_time)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Quantity:</span>
                    </div>
                    <span>{auction.products?.quantity_available} {auction.products?.unit}</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <strong>Location:</strong> {auction.products?.location}
                  </div>

                  {profile?.role === 'consumer' && auction.farmer_id !== user?.id && (
                    <div className="pt-4 border-t">
                      {selectedAuction === auction.id ? (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={`Min bid: $${(auction.current_bid || auction.starting_price) + 1}`}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handlePlaceBid(auction.id)}
                              className="flex-1"
                            >
                              Place Bid
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedAuction(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setSelectedAuction(auction.id)}
                          className="w-full"
                        >
                          Place Bid
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};