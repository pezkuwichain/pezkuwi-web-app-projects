import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { verifyCitizenNumber } from '@pezkuwi/lib/tiki';
import { generateAuthChallenge, signChallenge, verifySignature, saveCitizenSession } from '@pezkuwi/lib/citizenship-workflow';
import type { AuthChallenge } from '@pezkuwi/lib/citizenship-workflow';

interface ExistingCitizenAuthProps {
  onClose: () => void;
}

export const ExistingCitizenAuth: React.FC<ExistingCitizenAuthProps> = ({ onClose }) => {
  const { api, isApiReady, selectedAccount, connectWallet } = usePolkadot();

  const [citizenNumber, setCitizenNumber] = useState('');
  const [step, setStep] = useState<'input' | 'verifying' | 'signing' | 'success' | 'error'>('input');
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<AuthChallenge | null>(null);

  const handleVerifyNFT = async () => {
    if (!api || !isApiReady || !selectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!citizenNumber.trim()) {
      setError('Please enter your Citizen Number');
      return;
    }

    setError(null);
    setStep('verifying');

    try {
      // Verify Citizen Number
      const isValid = await verifyCitizenNumber(api, citizenNumber, selectedAccount.address);

      if (!isValid) {
        setError(`Invalid Citizen Number or it doesn&apos;t match your wallet`);
        setStep('error');
        return;
      }

      // Generate challenge for signature
      const authChallenge = generateAuthChallenge(citizenNumber);
      setChallenge(authChallenge);
      setStep('signing');
    } catch {
      if (import.meta.env.DEV) console.error('Verification error:', err);
      setError('Failed to verify Citizen Number');
      setStep('error');
    }
  };

  const handleSignChallenge = async () => {
    if (!selectedAccount || !challenge) {
      setError('Missing authentication data');
      return;
    }

    setError(null);

    try {
      // Sign the challenge
      const signature = await signChallenge(selectedAccount, challenge);

      // Verify signature (self-verification for demonstration)
      const isValid = await verifySignature(signature, challenge, selectedAccount.address);

      if (!isValid) {
        setError('Signature verification failed');
        setStep('error');
        return;
      }

      // Save session
      const session = {
        tikiNumber: citizenNumber,
        walletAddress: selectedAccount.address,
        sessionToken: signature, // In production, use proper JWT
        lastAuthenticated: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      await saveCitizenSession(session);

      setStep('success');

      // Redirect to citizens page after 2 seconds
      setTimeout(() => {
        onClose();
        window.location.href = '/citizens';
      }, 2000);
    } catch {
      if (import.meta.env.DEV) console.error('Signature error:', err);
      setError('Failed to sign authentication challenge');
      setStep('error');
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch {
      setError('Failed to connect wallet');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-500" />
            Authenticate as Citizen
          </CardTitle>
          <CardDescription>
            Enter your Citizen Number from your Dashboard to authenticate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Enter Citizen Number */}
          {step === 'input' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="citizenNumber">Citizen Number</Label>
                <Input
                  id="citizenNumber"
                  placeholder="e.g., #42-0-123456"
                  value={citizenNumber}
                  onChange={(e) => setCitizenNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyNFT()}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your full Citizen Number from your Dashboard (format: #CollectionID-ItemID-6digits)
                </p>
              </div>

              {!selectedAccount ? (
                <Button onClick={handleConnectWallet} className="w-full">
                  Connect Wallet First
                </Button>
              ) : (
                <Button onClick={handleVerifyNFT} className="w-full">
                  Verify Citizen Number
                </Button>
              )}
            </>
          )}

          {/* Step 2: Verifying */}
          {step === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
              <p className="text-sm text-muted-foreground">Verifying Citizen Number on blockchain...</p>
            </div>
          )}

          {/* Step 3: Sign Challenge */}
          {step === 'signing' && (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  NFT ownership verified! Now sign to prove you control this wallet.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Authentication Challenge:</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {challenge?.nonce}
                </p>
              </div>

              <Button onClick={handleSignChallenge} className="w-full">
                Sign Message to Authenticate
              </Button>
            </>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold">Authentication Successful!</h3>
              <p className="text-sm text-muted-foreground text-center">
                Welcome back, Citizen #{citizenNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to citizen dashboard...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'error' && (
            <Button onClick={() => { setStep('input'); setError(null); }} variant="outline" className="w-full">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-cyan-500/10 border-cyan-500/30">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Information
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Your NFT number is cryptographically verified on-chain</li>
              <li>• Signature proves you control the wallet without revealing private keys</li>
              <li>• Session expires after 24 hours for your security</li>
              <li>• No personal data is transmitted or stored on-chain</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
