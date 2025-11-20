import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Globe, MapPin, Calendar, Shield, AlertCircle, ArrowLeft, Award, Users, TrendingUp, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchUserTikis, getPrimaryRole, getTikiDisplayName, getTikiColor, getTikiEmoji, getUserRoleCategories, getAllTikiNFTDetails, generateCitizenNumber, type TikiNFTDetails } from '@pezkuwi/lib/tiki';
import { getAllScores, type UserScores } from '@pezkuwi/lib/scores';
import { getKycStatus } from '@pezkuwi/lib/kyc';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';
// Commission proposals card removed - no longer using notary system for KYC approval
// import { CommissionProposalsCard } from '@/components/dashboard/CommissionProposalsCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
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
  const [kycStatus, setKycStatus] = useState<string>('NotStarted');
  const [renouncingCitizenship, setRenouncingCitizenship] = useState(false);
  const [nftDetails, setNftDetails] = useState<{ citizenNFT: TikiNFTDetails | null; roleNFTs: TikiNFTDetails[]; totalNFTs: number }>({
    citizenNFT: null,
    roleNFTs: [],
    totalNFTs: 0
  });

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
        if (import.meta.env.DEV) console.error('Profile fetch error:', error);
        return;
      }

      // Auto-sync user metadata from Auth to profiles if missing
      if (data) {
        const needsUpdate: Record<string, string> = {};

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
      // We don&apos;t store it in profiles table to avoid duplication

      setProfile(data);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching profile:', error);
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

      // Fetch NFT details including collection/item IDs
      const details = await getAllTikiNFTDetails(api, selectedAccount.address);
      setNftDetails(details);

      // Fetch KYC status to determine if user is a citizen
      const status = await getKycStatus(api, selectedAccount.address);
      setKycStatus(status);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching scores and tikis:', error);
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

    if (import.meta.env.DEV) console.log('🔄 Attempting to send verification email to:', user.email);
    if (import.meta.env.DEV) console.log('🔐 User object:', user);

    try {
      // Method 1: Try resend API
      if (import.meta.env.DEV) console.log('📧 Trying Supabase auth.resend()...');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (resendError) {
        if (import.meta.env.DEV) console.error('❌ Resend error:', resendError);
      } else {
        if (import.meta.env.DEV) console.log('✅ Resend successful');
      }

      // If resend fails, try alternative method
      if (resendError) {
        if (import.meta.env.DEV) console.warn('Resend failed, trying alternative method:', resendError);

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
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error sending verification email:', error);

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

  const handleRenounceCitizenship = async () => {
    if (!api || !selectedAccount) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (kycStatus !== 'Approved') {
      toast({
        title: "Error",
        description: "Only citizens can renounce citizenship",
        variant: "destructive"
      });
      return;
    }

    // Confirm action
    const confirmed = window.confirm(
      'Are you sure you want to renounce your citizenship? This will:\n' +
      '• Burn your Citizen (Welati) NFT\n' +
      '• Reset your KYC status to NotStarted\n' +
      '• Remove all associated citizen privileges\n\n' +
      'You can always reapply later if you change your mind.'
    );

    if (!confirmed) return;

    setRenouncingCitizenship(true);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      if (import.meta.env.DEV) console.log('Renouncing citizenship...');

      const tx = api.tx.identityKyc.renounceCitizenship();

      await tx.signAndSend(selectedAccount.address, { signer: injector.signer }, ({ status, events, dispatchError }) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }
          if (import.meta.env.DEV) console.error(errorMessage);
          toast({
            title: "Renunciation Failed",
            description: errorMessage,
            variant: "destructive"
          });
          setRenouncingCitizenship(false);
          return;
        }

        if (status.isInBlock || status.isFinalized) {
          if (import.meta.env.DEV) console.log('✅ Citizenship renounced successfully');

          // Check for CitizenshipRenounced event
          events.forEach(({ event }) => {
            if (event.section === 'identityKyc' && event.method === 'CitizenshipRenounced') {
              if (import.meta.env.DEV) console.log('📢 CitizenshipRenounced event detected');
              toast({
                title: "Citizenship Renounced",
                description: "Your citizenship has been successfully renounced. You can reapply anytime."
              });

              // Refresh data after a short delay
              setTimeout(() => {
                fetchScoresAndTikis();
     
     
              }, 2000);
            }
          });

          setRenouncingCitizenship(false);
        }
      });

    } catch (err) {
      if (import.meta.env.DEV) console.error('Renunciation error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to renounce citizenship';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      setRenouncingCitizenship(false);
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
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
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
                    Complete KYC to become a Citizen (Welati)
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
                      {tikis.map((tiki, /*index*/) => (
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

                  {nftDetails.totalNFTs > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">NFT Details ({nftDetails.totalNFTs})</h4>
                      <div className="space-y-3">
                        {nftDetails.citizenNFT && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                {nftDetails.citizenNFT.tikiEmoji} Citizen NFT
                              </span>
                              <Badge variant="outline" className="text-blue-700 border-blue-300">
                                Primary
                              </Badge>
                            </div>

                            {/* NFT Number and Citizen Number - Side by Side */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              {/* NFT Number */}
                              <div className="p-2 bg-white dark:bg-blue-950 rounded border border-blue-300 dark:border-blue-700">
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">NFT Number:</span>
                                <div className="font-mono text-lg font-bold text-blue-900 dark:text-blue-100">
                                  #{nftDetails.citizenNFT.collectionId}-{nftDetails.citizenNFT.itemId}
                                </div>
                              </div>

                              {/* Citizen Number = NFT Number + 6 digits */}
                              <div className="p-2 bg-white dark:bg-green-950 rounded border border-green-300 dark:border-green-700">
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Citizen Number:</span>
                                <div className="font-mono text-lg font-bold text-green-900 dark:text-green-100">
                                  #{nftDetails.citizenNFT.collectionId}-{nftDetails.citizenNFT.itemId}-{generateCitizenNumber(
                                    nftDetails.citizenNFT.owner,
                                    nftDetails.citizenNFT.collectionId,
                                    nftDetails.citizenNFT.itemId
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Collection ID:</span>
                                <span className="ml-2 font-mono text-blue-900 dark:text-blue-100">
                                  {nftDetails.citizenNFT.collectionId}
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Item ID:</span>
                                <span className="ml-2 font-mono text-blue-900 dark:text-blue-100">
                                  {nftDetails.citizenNFT.itemId}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Role:</span>
                                <span className="ml-2 text-blue-900 dark:text-blue-100">
                                  {nftDetails.citizenNFT.tikiDisplayName}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Tiki Type:</span>
                                <span className="ml-2 font-semibold text-purple-600 dark:text-purple-400">
                                  {nftDetails.citizenNFT.tikiRole}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {nftDetails.roleNFTs.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground font-medium">Additional Role NFTs:</p>
                            {nftDetails.roleNFTs.map((nft, /*index*/) => (
                              <div
                                key={`${nft.collectionId}-${nft.itemId}`}
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    {nft.tikiEmoji} {nft.tikiDisplayName}
                                  </span>
                                  <Badge variant="outline" className={nft.tikiColor}>
                                    Score: {nft.tikiScore}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <span className="font-medium">Collection:</span>
                                    <span className="ml-2 font-mono">{nft.collectionId}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Item:</span>
                                    <span className="ml-2 font-mono">{nft.itemId}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="font-medium">Tiki Type:</span>
                                    <span className="ml-2 font-semibold text-purple-600 dark:text-purple-400">{nft.tikiRole}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Blockchain Address</h4>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {selectedAccount.address}
                    </p>
                  </div>

                  {kycStatus === 'Approved' && (
                    <div className="border-t pt-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                          <UserMinus className="h-4 w-4" />
                          Renounce Citizenship
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          You can voluntarily renounce your citizenship at any time. This will:
                        </p>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 mb-3 list-disc list-inside space-y-1">
                          <li>Burn your Citizen (Welati) NFT</li>
                          <li>Reset your KYC status</li>
                          <li>Remove citizen privileges</li>
                        </ul>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">
                          Note: You can always reapply for citizenship later if you change your mind.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRenounceCitizenship}
                          disabled={renouncingCitizenship}
                        >
                          {renouncingCitizenship ? 'Renouncing...' : 'Renounce Citizenship'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <ReferralDashboard />
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