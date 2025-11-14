import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TwoFactorSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('two-factor-auth', {
        body: { action: 'setup', userId: user?.id }
      });

      if (error) throw error;
      
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setShowSetup(true);
      
      toast({
        title: '2FA Setup Started',
        description: 'Scan the QR code with your authenticator app',
      });
    } catch (error) {
      toast({
        title: 'Setup Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!verificationCode) {
      toast({
        title: 'Error',
        description: 'Please enter verification code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('two-factor-auth', {
        body: { 
          action: 'enable', 
          userId: user?.id,
          code: verificationCode 
        }
      });

      if (error) throw error;
      
      setIsEnabled(true);
      setShowSetup(false);
      
      toast({
        title: '2FA Enabled',
        description: 'Your account is now protected with two-factor authentication',
      });
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('two-factor-auth', {
        body: { action: 'disable', userId: user?.id }
      });

      if (error) throw error;
      
      setIsEnabled(false);
      setSecret('');
      setBackupCodes([]);
      
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnabled && !showSetup && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication adds an extra layer of security by requiring a code from your authenticator app
              </AlertDescription>
            </Alert>
            <Button onClick={handleSetup} disabled={isLoading}>
              Set Up Two-Factor Authentication
            </Button>
          </div>
        )}

        {showSetup && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">1. Scan QR Code</p>
              <p className="text-xs text-muted-foreground mb-4">
                Use your authenticator app to scan this QR code or enter the secret manually
              </p>
              <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                {secret}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">2. Save Backup Codes</p>
              <p className="text-xs text-muted-foreground mb-4">
                Store these codes in a safe place. You can use them to access your account if you lose your device.
              </p>
              <div className="bg-muted p-3 rounded space-y-1">
                {backupCodes.map((code, i) => (
                  <div key={i} className="font-mono text-xs">{code}</div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={copyBackupCodes}
              >
                {copiedCodes ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiedCodes ? 'Copied!' : 'Copy Codes'}
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">3. Verify Setup</p>
              <p className="text-xs text-muted-foreground mb-4">
                Enter the 6-digit code from your authenticator app
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
                <Button onClick={handleEnable} disabled={isLoading}>
                  Enable 2FA
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Two-factor authentication is enabled for your account
              </AlertDescription>
            </Alert>
            <Button variant="destructive" onClick={handleDisable} disabled={isLoading}>
              Disable Two-Factor Authentication
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}