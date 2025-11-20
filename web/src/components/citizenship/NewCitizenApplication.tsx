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
import { Loader2, AlertTriangle, CheckCircle, User, Users as UsersIcon, MapPin, Briefcase, Mail, Check, X, AlertCircle } from 'lucide-react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import type { CitizenshipData, Region, MaritalStatus } from '@pezkuwi/lib/citizenship-workflow';
import { FOUNDER_ADDRESS, submitKycApplication, subscribeToKycApproval, getKycStatus } from '@pezkuwi/lib/citizenship-workflow';
import { generateCommitmentHash, generateNullifierHash, encryptData, saveLocalCitizenshipData, uploadToIPFS } from '@pezkuwi/lib/citizenship-workflow';

interface NewCitizenApplicationProps {
  onClose: () => void;
  referrerAddress?: string | null;
}

type FormData = Omit<CitizenshipData, 'walletAddress' | 'timestamp'>;

export const NewCitizenApplication: React.FC<NewCitizenApplicationProps> = ({ onClose, referrerAddress }) => {
  const { api, isApiReady, selectedAccount, connectWallet } = usePolkadot();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [kycApproved, setKycApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [applicationHash, setApplicationHash] = useState<string>('');

  const maritalStatus = watch('maritalStatus');
  const childrenCount = watch('childrenCount');

  const handleApprove = async () => {
    if (!api || !selectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    setConfirming(true);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      if (import.meta.env.DEV) console.log('Confirming citizenship application (self-confirmation)...');

      // Call confirm_citizenship() extrinsic - self-confirmation for Welati Tiki
      const tx = api.tx.identityKyc.confirmCitizenship();

      await tx.signAndSend(selectedAccount.address, { signer: injector.signer }, ({ status, events, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            if (import.meta.env.DEV) console.error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`);
            setError(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`);
          } else {
            if (import.meta.env.DEV) console.error(dispatchError.toString());
            setError(dispatchError.toString());
          }
          setConfirming(false);
          return;
        }

        if (status.isInBlock || status.isFinalized) {
          if (import.meta.env.DEV) console.log('✅ Citizenship confirmed successfully!');
          if (import.meta.env.DEV) console.log('Block hash:', status.asInBlock || status.asFinalized);

          // Check for CitizenshipConfirmed event
          events.forEach(({ event }) => {
            if (event.section === 'identityKyc' && event.method === 'CitizenshipConfirmed') {
              if (import.meta.env.DEV) console.log('📢 CitizenshipConfirmed event detected');
              setKycApproved(true);
              setWaitingForApproval(false);

              // Redirect to citizen dashboard after 2 seconds
              setTimeout(() => {
                onClose();
                window.location.href = '/dashboard';
              }, 2000);
            }
          });

          setConfirming(false);
        }
      });

    } catch (err) {
      if (import.meta.env.DEV) console.error('Approval error:', err);
      setError((err as Error).message || 'Failed to approve application');
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    // Cancel/withdraw the application - simply close modal and go back
    // No blockchain interaction needed - application will remain Pending until confirmed or admin-rejected
    if (import.meta.env.DEV) console.log('Canceling citizenship application (no blockchain interaction)');
    onClose();
    window.location.href = '/';
  };

  // Check KYC status on mount
  useEffect(() => {
    const checkKycStatus = async () => {
      if (!api || !isApiReady || !selectedAccount) {
        return;
      }

      setCheckingStatus(true);
      try {
        const status = await getKycStatus(api, selectedAccount.address);
        if (import.meta.env.DEV) console.log('Current KYC Status:', status);

        if (status === 'Approved') {
          if (import.meta.env.DEV) console.log('KYC already approved! Redirecting to dashboard...');
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
        if (import.meta.env.DEV) console.error('Error checking KYC status:', err);
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

    if (import.meta.env.DEV) console.log('Setting up KYC approval listener for:', selectedAccount.address);

    const unsubscribe = subscribeToKycApproval(
      api,
      selectedAccount.address,
      () => {
        if (import.meta.env.DEV) console.log('KYC Approved! Redirecting to dashboard...');
        setKycApproved(true);
        setWaitingForApproval(false);

        // Redirect to citizen dashboard after 2 seconds
        setTimeout(() => {
          onClose();
          window.location.href = '/dashboard';
        }, 2000);
      },
      (error) => {
        if (import.meta.env.DEV) console.error('KYC approval subscription error:', error);
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

      // Note: Referral initiation must be done by the REFERRER before the referee does KYC
      // The referrer calls api.tx.referral.initiateReferral(refereeAddress) from InviteUserModal
      // Here we just use the referrerAddress in the citizenship data if provided
      if (referrerAddress) {
        if (import.meta.env.DEV) console.log(`KYC application with referrer: ${referrerAddress}`);
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

      if (import.meta.env.DEV) console.log('Commitment Hash:', commitmentHash);
      if (import.meta.env.DEV) console.log('Nullifier Hash:', nullifierHash);

      // Encrypt data
      const encryptedData = await encryptData(citizenshipData, selectedAccount.address);

      // Save to local storage (backup)
      await saveLocalCitizenshipData(citizenshipData, selectedAccount.address);

      // Upload to IPFS
      const ipfsCid = await uploadToIPFS(encryptedData);

      if (import.meta.env.DEV) console.log('IPFS CID:', ipfsCid);
      if (import.meta.env.DEV) console.log('IPFS CID type:', typeof ipfsCid);
      if (import.meta.env.DEV) console.log('IPFS CID value:', JSON.stringify(ipfsCid));

      // Ensure ipfsCid is a string
      const cidString = String(ipfsCid);
      if (!cidString || cidString === 'undefined' || cidString === '[object Object]') {
        throw new Error(`Invalid IPFS CID: ${cidString}`);
      }

      // Submit to blockchain
      if (import.meta.env.DEV) console.log('Submitting KYC application to blockchain...');
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

      if (import.meta.env.DEV) console.log('✅ KYC application submitted to blockchain');
      if (import.meta.env.DEV) console.log('Block hash:', result.blockHash);

      // Save block hash for display
      if (result.blockHash) {
        setApplicationHash(result.blockHash.slice(0, 16) + '...');
      }

      // Move to waiting for approval state
      setSubmitted(true);
      setSubmitting(false);
      setWaitingForApproval(true);

    } catch (err) {
      if (import.meta.env.DEV) console.error('Submission error:', err);
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

  // Waiting for self-confirmation
  if (waitingForApproval) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-8 space-y-6">
          {/* Icon */}
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Confirm Your Citizenship Application</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Your application has been submitted to the blockchain. Please review and confirm your identity to mint your Citizen NFT (Welati Tiki).
            </p>
          </div>

          {/* Status steps */}
          <div className="w-full max-w-md space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Data Encrypted</p>
                <p className="text-xs text-muted-foreground">Your KYC data has been encrypted and stored on IPFS</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Blockchain Submitted</p>
                <p className="text-xs text-muted-foreground">Transaction hash: {applicationHash || 'Processing...'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Awaiting Your Confirmation</p>
                <p className="text-xs text-muted-foreground">Confirm or reject your application below</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 w-full max-w-md pt-4">
            <Button
              onClick={handleApprove}
              disabled={confirming}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={confirming}
              variant="destructive"
              className="flex-1"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="w-full max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button variant="outline" onClick={onClose} className="mt-2">
            Close
          </Button>
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
            <Label htmlFor="fatherName">Navê Bavê Te (Father&apos;s Name) *</Label>
            <Input {...register('fatherName', { required: true })} placeholder="e.g., Şêrko" />
            {errors.fatherName && <p className="text-xs text-red-500">Required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grandfatherName">Navê Bavkalê Te (Grandfather&apos;s Name) *</Label>
            <Input {...register('grandfatherName', { required: true })} placeholder="e.g., Welat" />
            {errors.grandfatherName && <p className="text-xs text-red-500">Required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motherName">Navê Dayika Te (Mother&apos;s Name) *</Label>
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
                  <Label>Navên Zarokan (Children&apos;s Names)</Label>
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
          <Input {...register('referralCode')} placeholder="Referral code (optional)" className="placeholder:text-gray-500 placeholder:opacity-50" />
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
