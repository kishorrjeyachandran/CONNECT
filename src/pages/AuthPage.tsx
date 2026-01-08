import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Sprout, Users, Loader2, Mail, Lock, Phone, MapPin, User } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  location: z.string().optional(),
  role: z.enum(['farmer', 'consumer']),
});

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    location: '',
    role: 'consumer',
    preferred_language: 'english'
  });

  const { user, signIn, signUp } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Update form data when language changes
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, preferred_language: language }));
  }, [language]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      if (isLogin) {
        const result = loginSchema.safeParse({
          email: formData.email,
          password: formData.password,
        });

        if (!result.success) {
          toast({
            title: "Validation Error",
            description: result.error.issues[0].message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        await signIn(formData.email, formData.password);
      } else {
        const result = signupSchema.safeParse({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          role: formData.role,
        });

        if (!result.success) {
          toast({
            title: "Validation Error",
            description: result.error.issues[0].message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        await signUp(formData.email, formData.password, {
          full_name: formData.full_name,
          role: formData.role,
          preferred_language: formData.preferred_language,
          phone: formData.phone || undefined,
          location: formData.location || undefined,
        });
      }
    } catch (error) {
      // Error handling is done in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      
      <Card className="w-full max-w-md glass-card animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Sprout className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {t('appName')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin ? t('loginTitle') : t('signupTitle')}
          </CardDescription>
          <p className="text-sm text-accent-foreground font-medium">
            {t('tagline')}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('fullName')}</Label>
                  <InputWithIcon
                    id="full_name"
                    type="text"
                    placeholder={t('fullName')}
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="glass"
                    icon={<User className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>{t('role')}</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="farmer" id="farmer" />
                      <Label htmlFor="farmer" className="flex items-center cursor-pointer">
                        <Sprout className="h-4 w-4 mr-1 text-primary" />
                        {t('farmer')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="consumer" id="consumer" />
                      <Label htmlFor="consumer" className="flex items-center cursor-pointer">
                        <Users className="h-4 w-4 mr-1 text-primary" />
                        {t('consumer')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">{t('location')}</Label>
                  <InputWithIcon
                    id="location"
                    type="text"
                    placeholder={t('location')}
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="glass"
                    icon={<MapPin className="h-4 w-4" />}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <InputWithIcon
                    id="phone"
                    type="tel"
                    placeholder={t('phone')}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="glass"
                    icon={<Phone className="h-4 w-4" />}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <InputWithIcon
                id="email"
                type="email"
                placeholder={t('email')}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="glass"
                icon={<Mail className="h-4 w-4" />}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('password')}</Label>
                {isLogin && (
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs text-muted-foreground hover:text-primary p-0 h-auto"
                    onClick={() => {/* TODO: Implement forgot password */}}
                  >
                    Forgot Password?
                  </Button>
                )}
              </div>
              <InputWithIcon
                id="password"
                type="password"
                placeholder={t('password')}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="glass"
                icon={<Lock className="h-4 w-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                isLogin ? t('login') : t('signup')
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80"
              >
                {isLogin ? t('noAccount') : t('alreadyHaveAccount')} {isLogin ? t('signup') : t('login')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};