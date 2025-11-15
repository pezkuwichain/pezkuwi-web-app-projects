import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle, CheckCircle, User, Users as UsersIcon, MapPin, Briefcase, Mail, Clock } from 'lucide-react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import type { CitizenshipData, Region, MaritalStatus } from '@pezkuwi/lib/citizenship-workflow';
import { FOUNDER_ADDRESS, submitKycApplication, subscribeToKycApproval, getKycStatus } from '@pezkuwi/lib/citizenship-workflow';
import { generateCommitmentHash, generateNullifierHash, encryptData, saveLocalCitizenshipData, uploadToIPFS } from '@pezkuwi/lib/citizenship-workflow';

interface NewCitizenApplicationProps {
  onClose: () => void;
}

type FormData = Omit<CitizenshipData, 'walletAddress' | 'timestamp'>;

export const NewCitizenApplication: React.FC<NewCitizenApplicationProps> = ({ onClose }) => {
  const { api, isApiReady, selectedAccount, connectWallet } = usePolkadot();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [kycApproved, setKycApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const maritalStatus = watch('maritalStatus');
  const childrenCount = watch('childrenCount');

  // Check KYC status on mount
  useEffect(() => {
    const checkKycStatus = async () => {
      if (!api || !isApiReady || !selectedAccount) {
        return;
      }

      setCheckingStatus(true);
      try {
        const status = await getKycStatus(api, selectedAccount.address);
        console.log('Current KYC Status:', status);

        if (status === 'Approved') {
          console.log('KYC already approved! Redirecting to dashboard...');
          setKycApproved(true);

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            onClose();
            window.location.href = '/dashboard';
          }, 2000);
        } else if (status === 'Pending') {
          // If pending, show the waiting screen
          setWaitingForApproval(true);
        }
      } catch (err) {
        console.error('Error checking KYC status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkKycStatus();
  }, [api, isApiReady, selectedAccount, onClose]);

  // Subscribe to KYC approval events
  useEffect(() => {
    if (!api || !isApiReady || !selectedAccount || !waitingForApproval) {
      return;
    }

    console.log('Setting up KYC approval listener for:', selectedAccount.address);

    const unsubscribe = subscribeToKycApproval(
      api,
      selectedAccount.address,
      () => {
        console.log('KYC Approved! Redirecting to dashboard...');
        setKycApproved(true);
        setWaitingForApproval(false);

        // Redirect to citizen dashboard after 2 seconds
        setTimeout(() => {
          onClose();
          window.location.href = '/dashboard';
        }, 2000);
      },
      (error) => {
        console.error('KYC approval subscription error:', error);
        setError(`Failed to monitor approval status: ${error}`);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api, isApiReady, selectedAccount, waitingForApproval, onClose]);

  const onSubmit = async (data: FormData) => {
    if (!api || !isApiReady || !selectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!agreed) {
      setError('Please agree to the terms');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // Check KYC status before submitting
      const currentStatus = await getKycStatus(api, selectedAccount.address);

      if (currentStatus === 'Approved') {
        setError('Your KYC has already been approved! Redirecting to dashboard...');
        setKycApproved(true);
        setTimeout(() => {
          onClose();
          window.location.href = '/dashboard';
        }, 2000);
        return;
      }

      if (currentStatus === 'Pending') {
        setError('You already have a pending KYC application. Please wait for admin approval.');
        setWaitingForApproval(true);
        return;
      }

      // Prepare complete citizenship data
      const citizenshipData: CitizenshipData = {
        ...data,
        walletAddress: selectedAccount.address,
        timestamp: Date.now(),
        referralCode: data.referralCode || FOUNDER_ADDRESS // Auto-assign to founder if empty
      };

      // Generate commitment and nullifier hashes
      const commitmentHash = await generateCommitmentHash(citizenshipData);
      const nullifierHash = await generateNullifierHash(selectedAccount.address, citizenshipData.timestamp);

      console.log('Commitment Hash:', commitmentHash);
      console.log('Nullifier Hash:', nullifierHash);

      // Encrypt data
      const encryptedData = await encryptData(citizenshipData, selectedAccount.address);

      // Save to local storage (backup)
      await saveLocalCitizenshipData(citizenshipData, selectedAccount.address);

      // Upload to IPFS
      const ipfsCid = await uploadToIPFS(encryptedData);

      console.log('IPFS CID:', ipfsCid);
      console.log('IPFS CID type:', typeof ipfsCid);
      console.log('IPFS CID value:', JSON.stringify(ipfsCid));

      // Ensure ipfsCid is a string
      const cidString = String(ipfsCid);
      if (!cidString || cidString === 'undefined' || cidString === '[object Object]') {
        throw new Error(`Invalid IPFS CID: ${cidString}`);
      }

      // Submit to blockchain
      console.log('Submitting KYC application to blockchain...');
      const result = await submitKycApplication(
        api,
        selectedAccount,
        citizenshipData.fullName,
        citizenshipData.email,
        cidString,
        `Citizenship application for ${citizenshipData.fullName}`
      );

      if (!result.success) {
        setError(result.error || 'Failed to submit KYC application to blockchain');
        setSubmitting(false);
        return;
      }

      console.log('✅ KYC application submitted to blockchain');
      console.log('Block hash:', result.blockHash);

      // Move to waiting for approval state
      setSubmitted(true);
      setSubmitting(false);
      setWaitingForApproval(true);

    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit citizenship application');
      setSubmitting(false);
    }
  };

  if (!selectedAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet Required</CardTitle>
          <CardDescription>
            You need to connect your wallet to apply for citizenship
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectWallet} className="w-full">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  // KYC Approved - Success state
  if (kycApproved) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-8 space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-center text-green-500">KYC Approved!</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Congratulations! Your citizenship application has been approved. Redirecting to citizen dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Waiting for approval - Loading state
  if (waitingForApproval) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-8 space-y-6">
          {/* Animated Loader with Halos */}
          <div className="relative flex items-center justify-center">
            {/* Outer halo */}
            <div className="absolute w-32 h-32 border-4 border-cyan-500/20 rounded-full animate-ping"></div>
            {/* Middle halo */}
            <div className="absolute w-24 h-24 border-4 border-purple-500/30 rounded-full animate-pulse"></div>
            {/* Inner spinning sun */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
              <Clock className="absolute w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Waiting for Admin Approval</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Your application has been submitted to the blockchain and is waiting for admin approval.
              This page will automatically update when your citizenship is approved.
            </p>
          </div>

          {/* Status steps */}
          <div className="w-full max-w-md space-y-3 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">Application encrypted and stored on IPFS</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">Transaction submitted to blockchain</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="h-5 w-5 text-cyan-500 animate-spin flex-shrink-0" />
              <span className="font-medium">Waiting for admin to approve KYC...</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-50">
              <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-muted-foreground">Receive Welati Tiki NFT</span>
            </div>
          </div>

          {/* Info */}
          <Alert className="bg-cyan-500/10 border-cyan-500/30">
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Do not close this page. The system is monitoring the blockchain
              for approval events in real-time. You will be automatically redirected once approved.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Initial submission success (before blockchain confirmation)
  if (submitted && !waitingForApproval) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-16 w-16 text-cyan-500 animate-spin" />
          <h3 className="text-lg font-semibold text-center">Processing Application...</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Encrypting your data and submitting to the blockchain. Please wait...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Identity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Nasnameya Kesane (Personal Identity)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Navê Te (Your Full Name) *</Label>
            <Input {...register('fullName', { required: true })} placeholder="e.g., Berzê Ronahî" />
            {errors.fullName && <p className="text-xs text-red-500">Required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fatherName">Navê Bavê Te (Father's Name) *</Label>
            <Input {...register('fatherName', { required: true })} placeholder="e.g., Şêrko" />
            {errors.fatherName && <p className="text-xs text-red-500">Required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grandfatherName">Navê Bavkalê Te (Grandfather's Name) *</Label>
            <Input {...register('grandfatherName', { required: true })} placeholder="e.g., Welat" />
            {errors.grandfatherName && <p className="text-xs text-red-500">Required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motherName">Navê Dayika Te (Mother's Name) *</Label>
            <Input {...register('motherName', { required: true })} placeholder="e.g., Gula" />
            {errors.motherName && <p className="text-xs text-red-500">Required</p>}
          </div>
        </CardContent>
      </Card>

      {/* Tribal Affiliation */}
      <Card>
        <CardHeader>
          <CardTitle>Eşîra Te (Tribal Affiliation)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tribe">Eşîra Te (Your Tribe) *</Label>
            <Input {...register('tribe', { required: true })} placeholder="e.g., Barzanî, Soran, Hewramî..." />
            {errors.tribe && <p className="text-xs text-red-500">Required</p>}
          </div>
        </CardContent>
      </Card>

      {/* Family Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Rewşa Malbatê (Family Status)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Zewicî / Nezewicî (Married / Unmarried) *</Label>
            <RadioGroup
              onValueChange={(value) => setValue('maritalStatus', value as MaritalStatus)}
              defaultValue="nezewici"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zewici" id="married" />
                <Label htmlFor="married">Zewicî (Married)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nezewici" id="unmarried" />
                <Label htmlFor="unmarried">Nezewicî (Unmarried)</Label>
              </div>
            </RadioGroup>
          </div>

          {maritalStatus === 'zewici' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="childrenCount">Hejmara Zarokan (Number of Children)</Label>
                <Input
                  type="number"
                  {...register('childrenCount', { valueAsNumber: true })}
                  placeholder="0"
                  min="0"
                />
              </div>

              {childrenCount && childrenCount > 0 && (
                <div className="space-y-3">
                  <Label>Navên Zarokan (Children's Names)</Label>
                  {Array.from({ length: childrenCount }).map((_, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <Input
                        {...register(`children.${i}.name` as const)}
                        placeholder={`Zaroka ${i + 1} - Nav`}
                      />
                      <Input
                        type="number"
                        {...register(`children.${i}.birthYear` as const, { valueAsNumber: true })}
                        placeholder="Sala Dayikbûnê"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Geographic Origin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Herêma Te (Your Region)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="region">Ji Kuderê yî? (Where are you from?) *</Label>
            <Select onValueChange={(value) => setValue('region', value as Region)}>
              <SelectTrigger>
                <SelectValue placeholder="Herêmeke hilbijêre (Select a region)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bakur">Bakur (North - Turkey/Türkiye)</SelectItem>
                <SelectItem value="basur">Başûr (South - Iraq)</SelectItem>
                <SelectItem value="rojava">Rojava (West - Syria)</SelectItem>
                <SelectItem value="rojhelat">Rojhilat (East - Iran)</SelectItem>
                <SelectItem value="kurdistan_a_sor">Kurdistan a Sor (Red Kurdistan - Armenia/Azerbaijan)</SelectItem>
                <SelectItem value="diaspora">Diaspora (Living Abroad)</SelectItem>
              </SelectContent>
            </Select>
            {errors.region && <p className="text-xs text-red-500">Required</p>}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Profession */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Têkilî û Pîşe (Contact & Profession)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail *
            </Label>
            <Input
              type="email"
              {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
              placeholder="example@email.com"
            />
            {errors.email && <p className="text-xs text-red-500">Valid email required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profession">Pîşeya Te (Your Profession) *</Label>
            <Input {...register('profession', { required: true })} placeholder="e.g., Mamosta, Bijîşk, Xebatkar..." />
            {errors.profession && <p className="text-xs text-red-500">Required</p>}
          </div>
        </CardContent>
      </Card>

      {/* Referral */}
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardHeader>
          <CardTitle>Koda Referral (Referral Code - Optional)</CardTitle>
          <CardDescription>
            If you were invited by another citizen, enter their referral code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input {...register('referralCode')} placeholder="Optional - Leave empty to be auto-assigned to Founder" />
          <p className="text-xs text-muted-foreground mt-2">
            If empty, you will be automatically linked to the Founder (Satoshi Qazi Muhammed)
          </p>
        </CardContent>
      </Card>

      {/* Terms Agreement */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              Ez pejirandim ku daneyên min bi awayekî ewle (ZK-proof) tên hilanîn û li ser blockchain-ê hash-a wan tê tomarkirin.
              <br />
              <span className="text-xs text-muted-foreground">
                (I agree that my data is securely stored with ZK-proof and only its hash is recorded on the blockchain)
              </span>
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={submitting || !agreed} className="w-full" size="lg">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Şandina Daxwazê...
              </>
            ) : (
              'Şandina Daxwazê (Submit Application)'
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};
