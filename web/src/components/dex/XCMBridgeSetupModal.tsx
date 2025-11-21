import React, { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { X, AlertCircle, Loader2, CheckCircle, Info, ExternalLink, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  checkBridgeStatus,
  fetchAssetHubUsdtInfo,
  configureXcmBridge,
  verifyWUsdtAsset,
  createWUsdtHezPool,
  ASSET_HUB_USDT_ID,
  WUSDT_ASSET_ID,
  ASSET_HUB_ENDPOINT,
  type BridgeStatus,
  type AssetHubUsdtInfo,
} from '@pezkuwi/lib/xcm-bridge';

interface XCMBridgeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SetupStep = 'idle' | 'checking' | 'fetching' | 'configuring' | 'pool-creation' | 'success' | 'error';

export const XCMBridgeSetupModal: React.FC<XCMBridgeSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { api, isApiReady } = usePolkadot();
  const { account, signer } = useWallet();
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<SetupStep>('idle');
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [assetHubInfo, setAssetHubInfo] = useState<AssetHubUsdtInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPoolCreation, setShowPoolCreation] = useState(false);
  const [wusdtAmount, setWusdtAmount] = useState('1000');
  const [hezAmount, setHezAmount] = useState('10');

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('idle');
      setStatusMessage('');
      setErrorMessage('');
      setShowPoolCreation(false);
    } else {
      // Auto-check status when opened
      if (api && isApiReady && account) {
        performInitialCheck();
      }
    }
  }, [isOpen, api, isApiReady, account]);

  /**
   * Perform initial status check
   */
  const performInitialCheck = async () => {
    if (!api || !isApiReady) return;

    setStep('checking');
    setStatusMessage('Checking bridge status...');
    setErrorMessage('');

    try {
      // Check current bridge status
      const status = await checkBridgeStatus(api);
      setBridgeStatus(status);

      // Fetch Asset Hub USDT info
      setStatusMessage('Fetching Asset Hub USDT info...');
      const info = await fetchAssetHubUsdtInfo();
      setAssetHubInfo(info);

      setStatusMessage('Status check complete');
      setStep('idle');
    } catch (error) {
      console.error('Initial check failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Status check failed');
      setStep('error');
    }
  };

  /**
   * Configure XCM bridge
   */
  const handleConfigureBridge = async () => {
    if (!api || !isApiReady || !signer || !account) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    setStep('configuring');
    setErrorMessage('');

    try {
      await configureXcmBridge(
        api,
        signer,
        account,
        (status) => setStatusMessage(status)
      );

      toast({
        title: 'Success!',
        description: 'XCM bridge configured successfully',
      });

      // Refresh status
      await performInitialCheck();

      setStep('success');
      setStatusMessage('Bridge configuration complete!');
    } catch (error) {
      console.error('Bridge configuration failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Configuration failed');
      setStep('error');
      toast({
        title: 'Configuration Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  /**
   * Create wUSDT/HEZ pool
   */
  const handleCreatePool = async () => {
    if (!api || !isApiReady || !signer || !account) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    setStep('pool-creation');
    setErrorMessage('');

    try {
      // Convert amounts to raw values (6 decimals for wUSDT, 12 for HEZ)
      const wusdtRaw = BigInt(parseFloat(wusdtAmount) * 10 ** 6).toString();
      const hezRaw = BigInt(parseFloat(hezAmount) * 10 ** 12).toString();

      await createWUsdtHezPool(
        api,
        signer,
        account,
        wusdtRaw,
        hezRaw,
        (status) => setStatusMessage(status)
      );

      toast({
        title: 'Success!',
        description: 'wUSDT/HEZ pool created successfully',
      });

      setStep('success');
      setStatusMessage('Pool creation complete!');

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Pool creation failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Pool creation failed');
      setStep('error');
      toast({
        title: 'Pool Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  const isLoading = step === 'checking' || step === 'fetching' || step === 'configuring' || step === 'pool-creation';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">
              XCM Bridge Setup
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 w-fit mt-2">
            Admin Only - XCM Configuration
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Info Banner */}
          <Alert className="bg-purple-500/10 border-purple-500/30">
            <Zap className="h-4 w-4 text-purple-400" />
            <AlertDescription className="text-purple-300 text-sm">
              Configure Asset Hub USDT → wUSDT bridge with one click. This enables
              cross-chain transfers from Westend Asset Hub to PezkuwiChain.
            </AlertDescription>
          </Alert>

          {/* Current Status */}
          {bridgeStatus && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
              <div className="text-sm font-semibold text-gray-300 mb-2">Current Status</div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Asset Hub Connection:</span>
                <div className="flex items-center gap-2">
                  {bridgeStatus.assetHubConnected ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className={bridgeStatus.assetHubConnected ? 'text-green-400' : 'text-yellow-400'}>
                    {bridgeStatus.assetHubConnected ? 'Connected' : 'Checking...'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">wUSDT Asset Exists:</span>
                <div className="flex items-center gap-2">
                  {bridgeStatus.wusdtExists ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={bridgeStatus.wusdtExists ? 'text-green-400' : 'text-red-400'}>
                    {bridgeStatus.wusdtExists ? 'Yes (ID: 1000)' : 'Not Found'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">XCM Bridge Configured:</span>
                <div className="flex items-center gap-2">
                  {bridgeStatus.isConfigured ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className={bridgeStatus.isConfigured ? 'text-green-400' : 'text-yellow-400'}>
                    {bridgeStatus.isConfigured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Asset Hub USDT Info */}
          {assetHubInfo && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
              <div className="text-sm font-semibold text-gray-300 mb-2">Asset Hub USDT Info</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-400">Asset ID:</span>
                <span className="text-white font-mono">{assetHubInfo.id}</span>

                <span className="text-gray-400">Symbol:</span>
                <span className="text-white">{assetHubInfo.symbol}</span>

                <span className="text-gray-400">Decimals:</span>
                <span className="text-white">{assetHubInfo.decimals}</span>

                <span className="text-gray-400">Total Supply:</span>
                <span className="text-white">{(parseFloat(assetHubInfo.supply) / 10 ** 6).toLocaleString()} USDT</span>
              </div>
              <a
                href="https://westend-assethub.subscan.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors mt-2"
              >
                View on Subscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Configuration Details */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
            <div className="text-sm font-semibold text-gray-300 mb-2">Configuration Details</div>
            <div className="text-xs space-y-1 text-gray-400 font-mono">
              <div>Asset Hub Endpoint: {ASSET_HUB_ENDPOINT}</div>
              <div>Asset Hub USDT ID: {ASSET_HUB_USDT_ID}</div>
              <div>PezkuwiChain wUSDT ID: {WUSDT_ASSET_ID}</div>
              <div>Parachain ID: 1000 (Asset Hub)</div>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {step === 'success' && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 text-sm">
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Pool Creation Section (Optional) */}
          {showPoolCreation && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
              <div className="text-sm font-semibold text-gray-300">Create wUSDT/HEZ Pool (Optional)</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">wUSDT Amount</label>
                  <input
                    type="number"
                    value={wusdtAmount}
                    onChange={(e) => setWusdtAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">HEZ Amount</label>
                  <input
                    type="number"
                    value={hezAmount}
                    onChange={(e) => setHezAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-700 hover:bg-gray-800"
              disabled={isLoading}
            >
              Close
            </Button>

            {!bridgeStatus?.isConfigured && (
              <Button
                onClick={handleConfigureBridge}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={isLoading || !bridgeStatus?.assetHubConnected}
              >
                {step === 'configuring' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Configuring...
                  </>
                ) : (
                  'Configure Bridge'
                )}
              </Button>
            )}

            {bridgeStatus?.isConfigured && !showPoolCreation && (
              <Button
                onClick={() => setShowPoolCreation(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Create Pool (Optional)
              </Button>
            )}

            {showPoolCreation && (
              <Button
                onClick={handleCreatePool}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {step === 'pool-creation' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Pool'
                )}
              </Button>
            )}
          </div>

          {/* Note */}
          <div className="text-xs text-gray-500 text-center">
            ⚠️ XCM bridge configuration requires sudo access
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
