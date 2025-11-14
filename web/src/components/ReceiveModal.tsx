import React, { useState } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose }) => {
  const { selectedAccount } = usePolkadot();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  React.useEffect(() => {
    if (selectedAccount && isOpen) {
      // Generate QR code
      QRCode.toDataURL(selectedAccount.address, {
        width: 300,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#0f172a'
        }
      }).then(setQrCodeDataUrl).catch(console.error);
    }
  }, [selectedAccount, isOpen]);

  const handleCopyAddress = async () => {
    if (!selectedAccount) return;

    try {
      await navigator.clipboard.writeText(selectedAccount.address);
      setCopied(true);
      toast({
        title: "Address Copied!",
        description: "Your wallet address has been copied to clipboard",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!selectedAccount) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Receive Tokens</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share this address to receive HEZ, PEZ, and other tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="bg-white rounded-lg p-4 mx-auto w-fit">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-200">
                <QrCode className="w-16 h-16 text-gray-400 animate-pulse" />
              </div>
            )}
          </div>

          {/* Account Name */}
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Account Name</div>
            <div className="text-xl font-semibold text-white">
              {selectedAccount.meta.name || 'Unnamed Account'}
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Wallet Address</div>
            <div className="bg-gray-900 rounded p-3 mb-3">
              <div className="text-white font-mono text-sm break-all">
                {selectedAccount.address}
              </div>
            </div>

            <Button
              onClick={handleCopyAddress}
              className="w-full bg-gradient-to-r from-green-600 to-yellow-400 hover:from-green-700 hover:to-yellow-500"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Address
                </>
              )}
            </Button>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-400 text-xs">
              <strong>Important:</strong> Only send PezkuwiChain compatible tokens to this address. Sending other tokens may result in permanent loss.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};