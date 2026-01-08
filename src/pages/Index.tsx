import React from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { 
  Sprout, 
  Users, 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Smartphone,
  Zap,
  Heart,
  Globe,
  CheckCircle
} from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

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

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Sprout className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">{t('appName')}</span>
          </div>
          <div className="flex items-center space-x-3">
            <LanguageToggle />
            <Button variant="ghost" asChild>
              <a href="/auth">{t('login')}</a>
            </Button>
            <Button asChild>
              <a href="/auth">
                {t('signup')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
          <Zap className="h-4 w-4 mr-2 inline" />
          Connecting Farmers & Consumers Directly
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {t('appName')}
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          {t('tagline')}
        </p>
        
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Empowering farmers with fair prices and consumers with fresh, local produce. 
          Join India's fastest-growing agricultural marketplace.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button size="lg" asChild className="text-lg px-8">
            <a href="/auth">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8">
            <a href="/auth">Learn More</a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-20">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">1000+</div>
            <div className="text-muted-foreground">Active Farmers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">5000+</div>
            <div className="text-muted-foreground">Happy Consumers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <div className="text-muted-foreground">Crop Varieties</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">₹10L+</div>
            <div className="text-muted-foreground">Transactions</div>
          </div>
        </div>
      </section>

      {/* User Type Cards */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Journey</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="glass-card hover:scale-105 transition-transform border-2 hover:border-primary">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sprout className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">{t('farmer')}</CardTitle>
              <CardDescription className="text-center text-base">
                {t('farmerMessage')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>List your crops with minimum prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Start auctions to get best prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Receive SMS confirmations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Offline mode support</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <a href="/auth?role=farmer">Start Selling</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-transform border-2 hover:border-primary">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">{t('consumer')}</CardTitle>
              <CardDescription className="text-center text-base">
                {t('consumerMessage')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Browse crops by nearest location</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Join live auctions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Secure payments (UPI/NetBanking)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Real-time notifications</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <a href="/auth?role=consumer">Start Buying</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <h2 className="text-3xl font-bold text-center mb-4">Why Choose {t('appName')}?</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Built with modern technology to provide the best experience for Indian farmers and consumers
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="glass-card text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Fair Pricing</CardTitle>
              <CardDescription>
                Transparent pricing and auction systems ensure farmers get the best value for their produce
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Secure Payments</CardTitle>
              <CardDescription>
                Bank-grade security with UPI, NetBanking, and other trusted payment methods
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Mobile First</CardTitle>
              <CardDescription>
                Optimized for mobile devices with offline support for areas with poor connectivity
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Direct Connection</CardTitle>
              <CardDescription>
                No middlemen - farmers and consumers deal directly for better prices and relationships
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Multi-Language</CardTitle>
              <CardDescription>
                Available in English, Hindi, Bengali, Tamil, and Marathi for wider accessibility
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Real-Time Updates</CardTitle>
              <CardDescription>
                Live auction updates, instant order notifications, and real-time messaging
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto glass-card p-12 rounded-2xl">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of farmers and consumers already using {t('appName')}
          </p>
          <Button size="lg" asChild className="text-lg px-10">
            <a href="/auth">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 {t('appName')}. All rights reserved.</p>
          <p className="text-sm mt-2">Empowering Indian Agriculture</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
