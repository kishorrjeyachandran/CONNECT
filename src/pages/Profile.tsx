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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Shield,
  Edit3,
  Save,
  X,
  Star,
  Award,
  Tractor,
  ExternalLink,
  Camera
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, profile, updateProfile, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.user_id) {
      fetchUserRating();
    }
  }, [profile?.user_id]);

  const fetchUserRating = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_user_id', profile?.user_id);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const total = data.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating(total / data.length);
        setRatingsCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    preferred_language: profile?.preferred_language || 'english',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    farm_name: profile?.farm_name || '',
    farm_description: profile?.farm_description || '',
    certifications: profile?.certifications?.join(', ') || '',
    years_experience: profile?.years_experience?.toString() || '',
    farm_size_acres: profile?.farm_size_acres?.toString() || '',
    website_url: profile?.website_url || ''
  });
  const [saving, setSaving] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: publicUrl });
      
      toast({
        title: "Image uploaded",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        certifications: formData.certifications 
          ? formData.certifications.split(',').map(cert => cert.trim()).filter(cert => cert)
          : null,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        farm_size_acres: formData.farm_size_acres ? parseFloat(formData.farm_size_acres) : null
      };
      
      await updateProfile(updateData);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      preferred_language: profile?.preferred_language || 'english',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || '',
      farm_name: profile?.farm_name || '',
      farm_description: profile?.farm_description || '',
      certifications: profile?.certifications?.join(', ') || '',
      years_experience: profile?.years_experience?.toString() || '',
      farm_size_acres: profile?.farm_size_acres?.toString() || '',
      website_url: profile?.website_url || ''
    });
    setIsEditing(false);
  };

  const roleColor = profile?.role === 'farmer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

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
            <h1 className="text-xl font-semibold">Profile Settings</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile Overview Card */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    disabled={uploadingImage}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{profile?.full_name}</CardTitle>
                  {ratingsCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({ratingsCount})</span>
                    </div>
                  )}
                </div>
                
                {profile?.farm_name && (
                  <div className="flex items-center gap-2 mb-2">
                    <Tractor className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{profile.farm_name}</span>
                  </div>
                )}
                
                <CardDescription className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </CardDescription>
                
                {profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={roleColor}>
                    <Shield className="h-3 w-3 mr-1" />
                    {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                  </Badge>
                  
                  {profile?.certifications && profile.certifications.length > 0 && (
                    <Badge variant="outline">
                      <Award className="h-3 w-3 mr-1" />
                      Certified
                    </Badge>
                  )}
                  
                  {profile?.website_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => window.open(profile.website_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Personal Information */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Manage your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.full_name || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter your location"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 border rounded">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.location || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              ) : (
                <div className="p-2 border rounded min-h-[80px]">
                  <span className="text-sm">{profile?.bio || 'No bio provided'}</span>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Profile Picture URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="Enter image URL"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Configure your account preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center space-x-2 p-2 border rounded bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
                <Badge variant="secondary" className="ml-auto">Verified</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed from this interface
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="preferred_language">Preferred Language</Label>
              {isEditing ? (
                <Select
                  value={formData.preferred_language}
                  onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="bengali">বাংলা (Bengali)</SelectItem>
                    <SelectItem value="tamil">தமிழ் (Tamil)</SelectItem>
                    <SelectItem value="marathi">मराठी (Marathi)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center space-x-2 p-2 border rounded">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formData.preferred_language === 'english' && 'English'}
                    {formData.preferred_language === 'hindi' && 'हिन्दी (Hindi)'}
                    {formData.preferred_language === 'bengali' && 'বাংলা (Bengali)'}
                    {formData.preferred_language === 'tamil' && 'தமிழ் (Tamil)'}
                    {formData.preferred_language === 'marathi' && 'मराठी (Marathi)'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Farm Details (Farmers Only) */}
        {profile?.role === 'farmer' && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tractor className="h-5 w-5" />
                Farm Details
              </CardTitle>
              <CardDescription>
                Information about your farm and agricultural practices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farm_name">Farm Name</Label>
                  {isEditing ? (
                    <Input
                      id="farm_name"
                      value={formData.farm_name}
                      onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                      placeholder="Enter your farm name"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded">
                      <Tractor className="h-4 w-4 text-muted-foreground" />
                      <span>{profile?.farm_name || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farm_size_acres">Farm Size (acres)</Label>
                  {isEditing ? (
                    <Input
                      id="farm_size_acres"
                      type="number"
                      value={formData.farm_size_acres}
                      onChange={(e) => setFormData({ ...formData, farm_size_acres: e.target.value })}
                      placeholder="Enter farm size"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile?.farm_size_acres ? `${profile.farm_size_acres} acres` : 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm_description">Farm Description</Label>
                {isEditing ? (
                  <Textarea
                    id="farm_description"
                    value={formData.farm_description}
                    onChange={(e) => setFormData({ ...formData, farm_description: e.target.value })}
                    placeholder="Describe your farm, growing practices, specialties..."
                    rows={3}
                  />
                ) : (
                  <div className="p-2 border rounded min-h-[80px]">
                    <span className="text-sm">{profile?.farm_description || 'No description provided'}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years of Experience</Label>
                  {isEditing ? (
                    <Input
                      id="years_experience"
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                      placeholder="Years in farming"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>{profile?.years_experience ? `${profile.years_experience} years` : 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  {isEditing ? (
                    <Input
                      id="website_url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://your-farm-website.com"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span>{profile?.website_url || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                {isEditing ? (
                  <Input
                    id="certifications"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    placeholder="e.g., Organic, Fair Trade, GAP"
                  />
                ) : (
                  <div className="p-2 border rounded">
                    {profile?.certifications && profile.certifications.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline">
                            <Award className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No certifications listed</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>
              Your activity summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 border rounded">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.role === 'farmer' ? 'Products Listed' : 'Orders Placed'}
                </p>
              </div>
              <div className="p-4 border rounded">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.role === 'farmer' ? 'Total Sales' : 'Total Purchases'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};