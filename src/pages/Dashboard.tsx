import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sprout, 
  Users, 
  ShoppingCart, 
  Gavel, 
  CreditCard, 
  User, 
  LogOut,
  Plus,
  Search,
  MapPin,
  TrendingUp,
  MessageCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    activeListings: 0,
    totalAmount: 0,
    recentOrders: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchStats();
    }
  }, [user, profile]);

  const fetchStats = async () => {
    try {
      if (profile?.role === 'farmer') {
        // Fetch farmer stats
        const [productsResult, ordersResult] = await Promise.all([
          supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('farmer_id', user?.id)
            .eq('status', 'available'),
          supabase
            .from('orders')
            .select('total_amount')
            .eq('farmer_id', user?.id)
            .eq('status', 'completed')
        ]);

        const activeListings = productsResult.count || 0;
        const totalEarnings = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

        setStats({
          activeListings,
          totalAmount: totalEarnings,
          recentOrders: ordersResult.data?.length || 0
        });
      } else {
        // Fetch consumer stats
        const ordersResult = await supabase
          .from('orders')
          .select('total_amount, status')
          .eq('buyer_id', user?.id);

        const totalSpent = ordersResult.data
          ?.filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

        setStats({
          activeListings: 0,
          totalAmount: totalSpent,
          recentOrders: ordersResult.data?.length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

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

  const isFarmer = profile?.role === 'farmer';
  const isConsumer = profile?.role === 'consumer';

  const farmerActions = [
    {
      title: t('listCrops'),
      description: 'Add new crops to sell',
      icon: Plus,
      action: () => window.location.href = '/products',
      color: 'bg-green-500'
    },
    {
      title: t('auctions'),
      description: 'Start or manage auctions',
      icon: Gavel,
      action: () => window.location.href = '/auctions',
      color: 'bg-orange-500'
    },
    {
      title: t('payments'),
      description: 'View earnings and transactions',
      icon: CreditCard,
      action: () => window.location.href = '/orders',
      color: 'bg-blue-500'
    },
    {
      title: 'Analytics',
      description: 'Track your sales performance',
      icon: TrendingUp,
      action: () => window.location.href = '/analytics',
      color: 'bg-purple-500'
    },
    {
      title: 'Messages',
      description: 'Chat with buyers',
      icon: MessageCircle,
      action: () => window.location.href = '/messages',
      color: 'bg-pink-500'
    }
  ];

  const consumerActions = [
    {
      title: t('browseCrops'),
      description: 'Find fresh produce near you',
      icon: Search,
      action: () => window.location.href = '/marketplace',
      color: 'bg-green-500'
    },
    {
      title: t('auctions'),
      description: 'Bid on crop auctions',
      icon: Gavel,
      action: () => window.location.href = '/auctions',
      color: 'bg-orange-500'
    },
    {
      title: 'My Orders',
      description: 'View your order history',
      icon: ShoppingCart,
      action: () => window.location.href = '/orders',
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics',
      description: 'View your purchase history',
      icon: TrendingUp,
      action: () => window.location.href = '/analytics',
      color: 'bg-indigo-500'
    },
    {
      title: 'Messages',
      description: 'Chat with farmers',
      icon: MessageCircle,
      action: () => window.location.href = '/messages',
      color: 'bg-pink-500'
    }
  ];

  const actions = isFarmer ? farmerActions : consumerActions;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Sprout className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">{t('appName')}</h1>
              <p className="text-sm text-muted-foreground">
                {isFarmer ? t('farmerMessage') : t('consumerMessage')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <LanguageToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/profile'}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center space-x-3">
                {isFarmer ? (
                  <Sprout className="h-8 w-8 text-primary" />
                ) : (
                  <Users className="h-8 w-8 text-primary" />
                )}
                <div>
                  <CardTitle className="text-2xl">
                    Welcome back, {profile?.full_name}!
                  </CardTitle>
                  <CardDescription>
                    {isFarmer 
                      ? 'Manage your crops and connect with buyers' 
                      : 'Discover fresh produce from local farmers'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {actions.map((action, index) => (
            <Card 
              key={index} 
              className="glass-card hover:scale-105 transition-transform cursor-pointer"
              onClick={action.action}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`h-12 w-12 rounded-full ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isFarmer ? 'Active Listings' : 'Recent Orders'}
                  </p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : isFarmer ? stats.activeListings : stats.recentOrders}
                  </p>
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
                    {isFarmer ? 'Total Earnings' : 'Total Spent'}
                  </p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : `₹${stats.totalAmount.toLocaleString('en-IN')}`}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isFarmer ? 'Completed Orders' : 'Profile Status'}
                  </p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : isFarmer ? stats.recentOrders : 
                      <span className="text-lg text-green-600">Complete</span>
                    }
                  </p>
                </div>
                {isFarmer ? (
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};