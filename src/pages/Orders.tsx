import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import StartConversationButton from '@/components/StartConversationButton';
import { RatingDialog } from '@/components/RatingDialog';
import { UserRating } from '@/components/UserRating';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  MapPin, 
  History,
  MessageSquare,
  Eye,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  buyer_id: string;
  farmer_id: string;
  product_id: string | null;
  auction_id: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  order_type: string;
  delivery_method: string;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
    category: string;
    unit: string;
    location: string;
    farmer_id: string;
  };
  auctions?: {
    products?: {
      name: string;
      category: string;
      unit: string;
      location: string;
      farmer_id: string;
    };
  };
  buyer_profile?: {
    full_name: string;
    phone: string;
    location: string;
  };
  farmer_profile?: {
    full_name: string;
    phone: string;
    location: string;
  };
}

interface StatusHistory {
  id: string;
  status: string;
  created_at: string;
  changed_by: string;
  notes: string | null;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'confirmed':
    case 'preparing':
      return <Package className="h-4 w-4" />;
    case 'ready_for_pickup':
      return <Truck className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
    case 'preparing':
      return 'default';
    case 'ready_for_pickup':
      return 'secondary';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const Orders: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderHistory, setSelectedOrderHistory] = useState<StatusHistory[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);
  const [existingRatings, setExistingRatings] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchExistingRatings();
      
      // Set up real-time subscription for order updates
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: profile?.role === 'farmer' 
              ? `farmer_id=eq.${user.id}` 
              : `buyer_id=eq.${user.id}`
          },
          (payload) => {
            fetchOrders(); // Refetch orders when there are changes
            if (payload.eventType === 'UPDATE') {
              toast({
                title: "Order Updated",
                description: `Order status has been updated to ${payload.new.status}`,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  const fetchExistingRatings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ratings')
      .select('order_id')
      .eq('rating_user_id', user.id);
    
    if (data) {
      setExistingRatings(new Set(data.map(r => r.order_id).filter(Boolean) as string[]));
    }
  };

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          products (
            name,
            category,
            unit,
            location,
            farmer_id
          ),
          auctions (
            products (
              name,
              category,
              unit,
              location,
              farmer_id
            )
          )
        `);

      // Fetch orders based on user role
      if (profile?.role === 'farmer') {
        query = query.eq('farmer_id', user?.id);
      } else {
        query = query.eq('buyer_id', user?.id);
      }

      const { data: ordersData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each order
      if (ordersData && ordersData.length > 0) {
        const userIds = ordersData.map(order => 
          profile?.role === 'farmer' ? order.buyer_id : order.farmer_id
        );

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, location')
          .in('user_id', userIds);

        const ordersWithProfiles = ordersData.map(order => ({
          ...order,
          [profile?.role === 'farmer' ? 'buyer_profile' : 'farmer_profile']: 
            profiles?.find(p => p.user_id === (profile?.role === 'farmer' ? order.buyer_id : order.farmer_id))
        }));

        setOrders(ordersWithProfiles);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSelectedOrderHistory(data || []);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully!",
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  const getProductInfo = (order: Order) => {
    if (order.products) {
      return order.products;
    } else if (order.auctions?.products) {
      return order.auctions.products;
    }
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">
                {profile?.role === 'farmer' ? 'Incoming Orders' : 'My Orders'}
              </h1>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {filteredOrders.length === 0 ? (
          <Card className="glass-card text-center p-8">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground mb-4">
              {profile?.role === 'farmer' 
                ? "You haven't received any orders yet. Promote your products to attract customers!"
                : "You haven't placed any orders yet. Browse the marketplace to find great products!"
              }
            </p>
            <Button onClick={() => navigate('/marketplace')}>
              {profile?.role === 'farmer' ? 'Manage Products' : 'Browse Marketplace'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const productInfo = getProductInfo(order);
              const otherProfile = profile?.role === 'farmer' ? order.buyer_profile : order.farmer_profile;
              const otherUserId = profile?.role === 'farmer' ? order.buyer_id : order.farmer_id;

              return (
                <Card key={order.id} className="glass-card hover:scale-[1.02] transition-transform">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          {productInfo?.name || 'Unknown Product'}
                          <Badge variant={getStatusVariant(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Order #{order.id.slice(0, 8)} • {order.order_type.replace('_', ' ')}
                        </CardDescription>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.quantity} {productInfo?.unit} × {formatCurrency(order.unit_price)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Product Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary">Product Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <Badge variant="secondary">{productInfo?.category}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span>{order.quantity} {productInfo?.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Unit Price:</span>
                            <span>{formatCurrency(order.unit_price)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contact Information */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary">
                          {profile?.role === 'farmer' ? 'Buyer Information' : 'Farmer Information'}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Name:</span>
                            <div className="flex items-center gap-2">
                              <span>{otherProfile?.full_name || 'Not provided'}</span>
                              <UserRating userId={otherUserId} />
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span>{otherProfile?.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{otherProfile?.location || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Method:</span>
                          <p className="capitalize">{order.delivery_method.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Farm Location:</span>
                          <p>{productInfo?.location || 'Not specified'}</p>
                        </div>
                        {order.delivery_address && (
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Delivery Address:</span>
                            <p>{order.delivery_address}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                      <span>Ordered: {new Date(order.created_at).toLocaleDateString()}</span>
                      <span>Updated: {new Date(order.updated_at).toLocaleDateString()}</span>
                    </div>

                    {order.notes && (
                      <div className="bg-accent/10 rounded-lg p-3">
                        <h5 className="font-medium mb-1">Special Notes</h5>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {/* Status Update Buttons (Farmer Only) */}
                      {profile?.role === 'farmer' && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <>
                          {order.status === 'pending' && (
                            <>
                              <Button 
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                size="sm"
                              >
                                Confirm Order
                              </Button>
                              <Button 
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                variant="outline"
                                size="sm"
                              >
                                Cancel Order
                              </Button>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <Button 
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              size="sm"
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button 
                              onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')}
                              size="sm"
                            >
                              Mark Ready
                            </Button>
                          )}
                          {order.status === 'ready_for_pickup' && (
                            <Button 
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              size="sm"
                            >
                              Mark Completed
                            </Button>
                          )}
                        </>
                      )}

                      {/* Cancel Button (Consumer Only) */}
                      {profile?.role === 'consumer' && order.status === 'pending' && (
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          variant="outline"
                          size="sm"
                        >
                          Cancel Order
                        </Button>
                      )}

                      {/* Universal Action Buttons */}
                      <StartConversationButton
                        farmerId={otherUserId}
                        productId={order.product_id || undefined}
                        orderId={order.id}
                        variant="outline"
                        size="sm"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchOrderHistory(order.id)}
                      >
                        <History className="h-4 w-4 mr-1" />
                        History
                      </Button>

                      {/* Rate Button for completed orders */}
                      {order.status === 'completed' && !existingRatings.has(order.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrderForRating(order);
                            setRatingDialogOpen(true);
                          }}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Rate
                        </Button>
                      )}
                      {order.status === 'completed' && existingRatings.has(order.id) && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          Rated
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Order History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Order Status History</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {selectedOrderHistory.map((history) => (
                  <div key={history.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {getStatusIcon(history.status)}
                    <div className="flex-1">
                      <p className="font-medium capitalize">{history.status.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(history.created_at).toLocaleString()}
                      </p>
                      {history.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog */}
        {selectedOrderForRating && (
          <RatingDialog
            open={ratingDialogOpen}
            onOpenChange={setRatingDialogOpen}
            orderId={selectedOrderForRating.id}
            ratedUserId={profile?.role === 'farmer' ? selectedOrderForRating.buyer_id : selectedOrderForRating.farmer_id}
            ratedUserName={
              (profile?.role === 'farmer' 
                ? selectedOrderForRating.buyer_profile?.full_name 
                : selectedOrderForRating.farmer_profile?.full_name) || 'User'
            }
            onSuccess={() => {
              fetchExistingRatings();
              setSelectedOrderForRating(null);
            }}
          />
        )}
      </main>
    </div>
  );
};