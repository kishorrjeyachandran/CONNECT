import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Grid,
  List,
  X,
  ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StartConversationButton from '@/components/StartConversationButton';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_per_kg: number;
  quantity_available: number;
  unit: string;
  harvest_date: string | null;
  location: string | null;
  farmer_id: string;
  created_at: string;
  status: string;
  image_url: string | null;
}

interface SearchFilters {
  searchTerm: string;
  category: string;
  location: string;
  priceRange: [number, number];
  sortBy: string;
  availability: string;
}

export const Marketplace: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState({
    quantity: '',
    delivery_method: 'pickup',
    delivery_address: '',
    notes: ''
  });
  
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: 'all',
    location: 'all',
    priceRange: [0, 1000],
    sortBy: 'newest',
    availability: 'all'
  });
  
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Function definitions BEFORE hooks
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
      
      // Extract unique categories and locations for filters
      const uniqueCategories = [...new Set(data?.map(p => p.category) || [])];
      const uniqueLocations = [...new Set(data?.map(p => p.location).filter(Boolean) || [])];
      
      setCategories(uniqueCategories);
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search term filter
    if (filters.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Location filter
    if (filters.location && filters.location !== 'all') {
      filtered = filtered.filter(product => product.location === filters.location);
    }

    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(product => {
        const price = product.price_per_kg || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    // Availability filter
    if (filters.availability === 'available') {
      filtered = filtered.filter(product => product.quantity_available > 0);
    } else if (filters.availability === 'low_stock') {
      filtered = filtered.filter(product => product.quantity_available > 0 && product.quantity_available <= 10);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => (a.price_per_kg || 0) - (b.price_per_kg || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.price_per_kg || 0) - (a.price_per_kg || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredProducts(filtered);
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      category: 'all',
      location: 'all',
      priceRange: [0, 1000],
      sortBy: 'newest',
      availability: 'all'
    });
  };

  const handleOrderProduct = (product: Product) => {
    setSelectedProduct(product);
    setOrderForm({
      quantity: '',
      delivery_method: 'pickup',
      delivery_address: '',
      notes: ''
    });
    setOrderDialogOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!selectedProduct || !user) return;

    try {
      const quantity = parseInt(orderForm.quantity);
      if (quantity <= 0 || quantity > selectedProduct.quantity_available) {
        toast({
          title: "Error",
          description: "Invalid quantity",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = quantity * selectedProduct.price_per_kg;

      const { error } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          farmer_id: selectedProduct.farmer_id,
          product_id: selectedProduct.id,
          quantity: quantity,
          unit_price: selectedProduct.price_per_kg,
          total_amount: totalAmount,
          order_type: 'direct_purchase',
          delivery_method: orderForm.delivery_method,
          delivery_address: orderForm.delivery_method === 'delivery' ? orderForm.delivery_address : null,
          notes: orderForm.notes || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order placed successfully!",
      });
      setOrderDialogOpen(false);
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // All hooks must be called BEFORE any conditional returns
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  // Conditional returns AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Marketplace</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search and Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search with advanced options
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label>Price Range (₹)</Label>
                    <div className="px-2">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
                        max={1000}
                        min={0}
                        step={10}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>₹{filters.priceRange[0]}</span>
                      <span>₹{filters.priceRange[1]}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Sort Options */}
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="price_low">Price: Low to High</SelectItem>
                        <SelectItem value="price_high">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Availability */}
                  <div className="space-y-2">
                    <Label>Availability</Label>
                    <Select value={filters.availability} onValueChange={(value) => setFilters({ ...filters, availability: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="available">In Stock Only</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <Button onClick={resetFilters} variant="outline" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredProducts.length} products found</span>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Sorted by {filters.sortBy.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <Card className="glass-card text-center p-8">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search filters</p>
            <Button onClick={resetFilters} variant="outline">
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredProducts.map((product) => (
              <Card key={product.id} className={`glass-card hover:scale-105 transition-transform ${
                viewMode === 'list' ? 'flex flex-row items-center p-4' : ''
              }`}>
                {viewMode === 'grid' ? (
                  <>
                    {product.image_url ? (
                      <div className="h-40 w-full overflow-hidden rounded-t-lg">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-muted/50 rounded-t-lg flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <CardHeader className="pt-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {product.category}
                            </Badge>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(product.price_per_kg)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per {product.unit}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Available:</span>
                            <span className="font-medium">{product.quantity_available} {product.unit}</span>
                          </div>
                          
                          {product.location && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs">{product.location}</span>
                            </div>
                          )}
                          
                          {product.harvest_date && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">
                                Harvested: {new Date(product.harvest_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-3">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleOrderProduct(product)}
                          >
                            Order Now
                          </Button>
                          <StartConversationButton
                            farmerId={product.farmer_id}
                            productId={product.id}
                            variant="outline"
                            size="sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {product.image_url ? (
                        <div className="h-16 w-16 rounded-lg overflow-hidden">
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-muted/50 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                          {product.location && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs">{product.location}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Available: {product.quantity_available} {product.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(product.price_per_kg)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per {product.unit}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <StartConversationButton
                          farmerId={product.farmer_id}
                          productId={product.id}
                          variant="outline"
                        />
                        <Button onClick={() => handleOrderProduct(product)}>
                          Order Now
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Order Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Place Order</DialogTitle>
              <DialogDescription>
                Order {selectedProduct?.name} from the farmer
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Product:</span>
                    <p className="font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <p className="font-medium">{formatCurrency(selectedProduct.price_per_kg)}/{selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available:</span>
                    <p className="font-medium">{selectedProduct.quantity_available} {selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{selectedProduct.location}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity ({selectedProduct.unit})</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.quantity_available}
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <Label htmlFor="delivery_method">Delivery Method</Label>
                  <Select 
                    value={orderForm.delivery_method} 
                    onValueChange={(value) => setOrderForm({...orderForm, delivery_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup from Farm</SelectItem>
                      <SelectItem value="delivery">Home Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderForm.delivery_method === 'delivery' && (
                  <div>
                    <Label htmlFor="delivery_address">Delivery Address</Label>
                    <Textarea
                      id="delivery_address"
                      value={orderForm.delivery_address}
                      onChange={(e) => setOrderForm({...orderForm, delivery_address: e.target.value})}
                      placeholder="Enter your delivery address"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                    placeholder="Any special instructions or notes"
                  />
                </div>

                {orderForm.quantity && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Amount:</span>
                      <span className="text-lg">
                        {formatCurrency(parseInt(orderForm.quantity) * selectedProduct.price_per_kg)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmitOrder} className="flex-1">
                    Place Order
                  </Button>
                  <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};