import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Calendar,
  Eye,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  recentOrders: any[];
  topProducts: any[];
  monthlyStats: { month: string; orders: number; revenue: number }[];
  ordersByStatus: { name: string; value: number }[];
  categoryStats: { category: string; count: number; revenue: number }[];
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444'
};

export const Analytics: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
    monthlyStats: [],
    ordersByStatus: [],
    categoryStats: []
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && profile) {
      if (profile?.role === 'farmer') {
        fetchFarmerAnalytics();
      } else {
        fetchConsumerAnalytics();
      }
    }
  }, [user, profile]);

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

  const fetchFarmerAnalytics = async () => {
    try {
      // Fetch orders for farmer's products
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('farmer_id', user?.id);

      if (ordersError) throw ordersError;

      // Fetch farmer's products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', user?.id);

      if (productsError) throw productsError;

      // Calculate analytics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalProducts = products?.length || 0;

      // Get recent orders with product details
      const recentOrders = orders?.slice(-5).reverse() || [];

      // Calculate top products by order count
      const productOrderCounts: Record<string, number> = {};
      orders?.forEach(order => {
        if (order.product_id) {
          productOrderCounts[order.product_id] = (productOrderCounts[order.product_id] || 0) + 1;
        }
      });

      const topProducts = products?.map(product => ({
        ...product,
        orderCount: productOrderCounts[product.id] || 0
      })).sort((a, b) => b.orderCount - a.orderCount).slice(0, 5) || [];

      // Calculate orders by status
      const statusCounts: Record<string, number> = {};
      orders?.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Calculate category stats
      const categoryData: Record<string, { count: number; revenue: number }> = {};
      orders?.forEach(order => {
        const product = products?.find(p => p.id === order.product_id);
        const category = product?.category || 'Other';
        if (!categoryData[category]) {
          categoryData[category] = { count: 0, revenue: 0 };
        }
        categoryData[category].count += 1;
        categoryData[category].revenue += Number(order.total_amount);
      });
      const categoryStats = Object.entries(categoryData).map(([category, data]) => ({
        category,
        count: data.count,
        revenue: data.revenue
      }));

      // Calculate monthly stats (last 6 months)
      const monthlyData: Record<string, { orders: number; revenue: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[monthKey] = { orders: 0, revenue: 0 };
      }
      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].orders += 1;
          monthlyData[monthKey].revenue += Number(order.total_amount);
        }
      });
      const monthlyStats = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        orders: data.orders,
        revenue: data.revenue
      }));

      setAnalytics({
        totalSales: totalOrders,
        totalOrders,
        totalProducts,
        totalRevenue,
        recentOrders,
        topProducts,
        monthlyStats,
        ordersByStatus,
        categoryStats
      });
    } catch (error) {
      console.error('Error fetching farmer analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchConsumerAnalytics = async () => {
    try {
      // Fetch orders for consumer
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            name,
            category,
            farmer_id
          )
        `)
        .eq('buyer_id', user?.id);

      if (ordersError) throw ordersError;

      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const recentOrders = orders?.slice(-5).reverse() || [];

      // Calculate orders by status
      const statusCounts: Record<string, number> = {};
      orders?.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Calculate category stats
      const categoryData: Record<string, { count: number; revenue: number }> = {};
      orders?.forEach(order => {
        const category = order.products?.category || 'Other';
        if (!categoryData[category]) {
          categoryData[category] = { count: 0, revenue: 0 };
        }
        categoryData[category].count += 1;
        categoryData[category].revenue += Number(order.total_amount);
      });
      const categoryStats = Object.entries(categoryData).map(([category, data]) => ({
        category,
        count: data.count,
        revenue: data.revenue
      }));

      // Calculate monthly stats (last 6 months)
      const monthlyData: Record<string, { orders: number; revenue: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[monthKey] = { orders: 0, revenue: 0 };
      }
      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].orders += 1;
          monthlyData[monthKey].revenue += Number(order.total_amount);
        }
      });
      const monthlyStats = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        orders: data.orders,
        revenue: data.revenue
      }));

      setAnalytics({
        totalSales: 0,
        totalOrders,
        totalProducts: 0,
        totalRevenue: totalSpent,
        recentOrders,
        topProducts: [],
        monthlyStats,
        ordersByStatus,
        categoryStats
      });
    } catch (error) {
      console.error('Error fetching consumer analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const isFarmer = profile?.role === 'farmer';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">
                {isFarmer ? 'Sales Analytics' : 'Purchase History'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isFarmer ? 'Total Sales' : 'Total Orders'}
                  </p>
                  <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isFarmer ? 'Total Revenue' : 'Total Spent'}
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {isFarmer && (
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Products</p>
                    <p className="text-2xl font-bold">{analytics.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isFarmer ? 'Avg. Order Value' : 'Avg. Purchase'}
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalOrders > 0 
                      ? formatCurrency(analytics.totalRevenue / analytics.totalOrders)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Orders and revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.monthlyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} name="Orders" />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Revenue (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders by Status Pie Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
              <CardDescription>Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.ordersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {analytics.ordersByStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Revenue Chart */}
        {analytics.categoryStats.length > 0 && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>Performance breakdown by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            {isFarmer && <TabsTrigger value="products">Top Products</TabsTrigger>}
          </TabsList>

          <TabsContent value="recent">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>
                  {isFarmer ? 'Recent Orders' : 'Recent Purchases'}
                </CardTitle>
                <CardDescription>
                  Your latest {isFarmer ? 'sales' : 'orders'} activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No {isFarmer ? 'orders' : 'purchases'} yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.created_at)} • Qty: {order.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isFarmer && (
            <TabsContent value="products">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                  <CardDescription>
                    Your most popular products by order count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.topProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No products yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.category} • Available: {product.quantity_available} {product.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{product.orderCount} orders</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(product.price_per_kg || 0)} per {product.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};