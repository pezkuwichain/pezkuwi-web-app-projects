import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Globe, MapPin, Calendar, Shield, AlertCircle, ArrowLeft, Award, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchUserTikis, calculateTikiScore, getPrimaryRole, getTikiDisplayName, getTikiColor, getTikiEmoji, getUserRoleCategories } from '@/lib/tiki';
import { getAllScores, type UserScores } from '@/lib/scores';

export default function Dashboard() {
  const { user } = useAuth();
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tikis, setTikis] = useState<string[]>([]);
  const [scores, setScores] = useState<UserScores>({
    trustScore: 0,
    referralScore: 0,
    stakingScore: 0,
    tikiScore: 0,
    totalScore: 0
  });
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    fetchProfile();
    if (selectedAccount && api && isApiReady) {
      fetchScoresAndTikis();
    }
  }, [user, selectedAccount, api, isApiReady]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        return;
      }

      // Auto-sync user metadata from Auth to profiles if missing
      if (data) {
        const needsUpdate: any = {};

        // Sync full_name from Auth metadata if not set in profiles
        if (!data.full_name && user.user_metadata?.full_name) {
          needsUpdate.full_name = user.user_metadata.full_name;
        }

        // Sync phone from Auth metadata if not set in profiles
        if (!data.phone_number && user.user_metadata?.phone) {
          needsUpdate.phone_number = user.user_metadata.phone;
        }

        // Sync email if not set
        if (!data.email && user.email) {
          needsUpdate.email = user.email;
        }

        // If there are fields to update, update the profile
        if (Object.keys(needsUpdate).length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(needsUpdate)
            .eq('id', user.id);

          if (!updateError) {
            // Update local state
            Object.assign(data, needsUpdate);
          }
        }
      }

      // Note: Email verification is handled by Supabase Auth (user.email_confirmed_at)
      // We don't store it in profiles table to avoid duplication

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoresAndTikis = async () => {
    if (!selectedAccount || !api) return;

    setLoadingScores(true);
    try {
      // Fetch all scores from blockchain (includes trust, referral, staking, tiki)
      const allScores = await getAllScores(api, selectedAccount.address);
      setScores(allScores);

      // Also fetch tikis separately for role display (needed for role details)
      const userTikis = await fetchUserTikis(api, selectedAccount.address);
      setTikis(userTikis);
    } catch (error) {
      console.error('Error fetching scores and tikis:', error);
    } finally {
      setLoadingScores(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "No email address found",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 Attempting to send verification email to:', user.email);
    console.log('🔐 User object:', user);

    try {
      // Method 1: Try resend API
      console.log('📧 Trying Supabase auth.resend()...');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (resendError) {
        console.error('❌ Resend error:', resendError);
      } else {
        console.log('✅ Resend successful');
      }

      // If resend fails, try alternative method
      if (resendError) {
        console.warn('Resend failed, trying alternative method:', resendError);

        // Method 2: Request password reset as verification alternative
        // This will send an email if the account exists
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${window.location.origin}/email-verification`,
        });

        if (resetError) throw resetError;
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your email inbox and spam folder",
      });
    } catch (error: any) {
      console.error('Error sending verification email:', error);

      // Provide more detailed error message
      let errorMessage = "Failed to send verification email";

      if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = "Too many requests. Please wait a few minutes and try again.";
      } else if (error.message?.includes('User not found')) {
        errorMessage = "Account not found. Please sign up first.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getRoleDisplay = (): string => {
    if (loadingScores) return 'Loading...';
    if (!selectedAccount) return 'Member';
    if (tikis.length === 0) return 'Member';

    const primaryRole = getPrimaryRole(tikis);
    return getTikiDisplayName(primaryRole);
  };

  const getRoleCategories = (): string[] => {
    if (tikis.length === 0) return ['Member'];
    return getUserRoleCategories(tikis);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.email_confirmed_at || profile?.email_verified ? (
                <Badge className="bg-green-500">Verified</Badge>
              ) : (
                <Badge variant="destructive">Unverified</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.email_confirmed_at
                ? `Verified on ${new Date(user.email_confirmed_at).toLocaleDateString()}`
                : 'Email verification status'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(profile?.joined_at || user?.created_at).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Registration date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getRoleDisplay()}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedAccount ? 'From Tiki NFTs' : 'Connect wallet for roles'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingScores ? '...' : scores.totalScore}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined from all score types
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loadingScores ? '...' : scores.trustScore}
            </div>
            <p className="text-xs text-muted-foreground">
              From pallet_trust
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Score</CardTitle>
            <Users className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {loadingScores ? '...' : scores.referralScore}
            </div>
            <p className="text-xs text-muted-foreground">
              From referral system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staking Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loadingScores ? '...' : scores.stakingScore}
            </div>
            <p className="text-xs text-muted-foreground">
              From pallet_staking_score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiki Score</CardTitle>
            <Award className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {loadingScores ? '...' : scores.tikiScore}
            </div>
            <p className="text-xs text-muted-foreground">
              {tikis.length} {tikis.length === 1 ? 'role' : 'roles'} assigned
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="roles">Roles & Tikis</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Full Name:</span>
                  <span>{profile?.full_name || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{user?.email}</span>
                  {user?.email_confirmed_at || profile?.email_verified ? (
                    <Badge className="bg-green-500">Verified</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={sendVerificationEmail}>
                      Verify Email
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Recovery Email:</span>
                  <span>{profile?.recovery_email || 'Not set'}</span>
                  {profile?.recovery_email_verified && profile?.recovery_email && (
                    <Badge className="bg-green-500">Verified</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{profile?.phone_number || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Website:</span>
                  <span>{profile?.website || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span>{profile?.location || 'Not set'}</span>
                </div>
              </div>
              <Button onClick={() => navigate('/profile/settings')}>Edit Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Tikis</CardTitle>
              <CardDescription>
                {selectedAccount
                  ? 'Your roles from the blockchain (Pallet-Tiki)'
                  : 'Connect your wallet to view your roles'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedAccount && (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Connect your Polkadot wallet to view your on-chain roles
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Go to Home to Connect Wallet
                  </Button>
                </div>
              )}

              {selectedAccount && loadingScores && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading roles from blockchain...</p>
                </div>
              )}

              {selectedAccount && !loadingScores && tikis.length === 0 && (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    No roles assigned yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Complete KYC to become a Citizen (Hemwelatî)
                  </p>
                </div>
              )}

              {selectedAccount && !loadingScores && tikis.length > 0 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Primary Role:</span>
                      <Badge className="text-lg">
                        {getTikiEmoji(getPrimaryRole(tikis))} {getTikiDisplayName(getPrimaryRole(tikis))}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Total Score:</span>
                      <span className="text-lg font-bold text-purple-600">{scores.totalScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Categories:</span>
                      <span className="text-muted-foreground">{getRoleCategories().join(', ')}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">All Roles ({tikis.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {tikis.map((tiki, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className={getTikiColor(tiki)}
                        >
                          {getTikiEmoji(tiki)} {getTikiDisplayName(tiki)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Blockchain Address</h4>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {selectedAccount.address}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">Last changed: Never</p>
                <Button onClick={() => navigate('/reset-password')}>Change Password</Button>
              </div>
              
              {!user?.email_confirmed_at && !profile?.email_verified && (
                <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 text-gray-900">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-gray-900">Verify your email</h4>
                      <p className="text-sm text-gray-900">Please verify your email to access all features</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent actions and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}