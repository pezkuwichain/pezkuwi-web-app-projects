import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePolkadot } from '@/contexts/PolkadotContext';
import {
  Copy,
  Check,
  Share2,
  Mail,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose }) => {
  const { api, selectedAccount } = usePolkadot();
  const [copied, setCopied] = useState(false);
  const [inviteeAddress, setInviteeAddress] = useState('');
  const [initiating, setInitiating] = useState(false);
  const [initiateSuccess, setInitiateSuccess] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  // Generate referral link with user's address
  const referralLink = useMemo(() => {
    if (!selectedAccount?.address) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/be-citizen?ref=${selectedAccount.address}`;
  }, [selectedAccount?.address]);

  // Share text for social media
  const shareText = useMemo(() => {
    return `Join me on Digital Kurdistan (PezkuwiChain)! 🏛️\n\nBecome a citizen and get your Welati Tiki NFT.\n\nUse my referral link:\n${referralLink}`;
  }, [referralLink]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(referralLink);

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent('Join me on Digital Kurdistan! 🏛️')}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent('Join Digital Kurdistan')}&body=${encodedText}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleInitiateReferral = async () => {
    if (!api || !selectedAccount || !inviteeAddress) {
      setInitiateError('Please enter a valid address');
      return;
    }

    setInitiating(true);
    setInitiateError(null);
    setInitiateSuccess(false);

    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);

      console.log(`Initiating referral from ${selectedAccount.address} to ${inviteeAddress}...`);

      const tx = api.tx.referral.initiateReferral(inviteeAddress);

      await tx.signAndSend(selectedAccount.address, { signer: injector.signer }, ({ status, dispatchError }) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }
          console.error(errorMessage);
          setInitiateError(errorMessage);
          setInitiating(false);
          return;
        }

        if (status.isInBlock || status.isFinalized) {
          console.log('Referral initiated successfully!');
          setInitiateSuccess(true);
          setInitiating(false);
          setInviteeAddress('');
        }
      });
    } catch (err: any) {
      console.error('Failed to initiate referral:', err);
      setInitiateError(err.message || 'Failed to initiate referral');
      setInitiating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-500" />
            Invite Friends to PezkuwiChain
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your referral link. When your friends complete KYC, you'll earn trust score points!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Referral Link Display */}
          <div className="space-y-2">
            <Label className="text-gray-300">Your Referral Link</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={referralLink}
                readOnly
                className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Anyone who signs up with this link will be counted as your referral
            </p>
          </div>

          {/* Manual Referral Initiation */}
          <div className="space-y-2 bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <Label className="text-blue-300">Or Pre-Register a Friend (Advanced)</Label>
            <p className="text-xs text-gray-400 mb-2">
              If you know your friend's wallet address, you can pre-register them on-chain.
              They must then complete KYC to finalize the referral.
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={inviteeAddress}
                onChange={(e) => setInviteeAddress(e.target.value)}
                placeholder="Friend's wallet address"
                className="bg-gray-800 border-gray-700 text-white font-mono text-sm placeholder:text-gray-500 placeholder:opacity-50"
              />
              <Button
                onClick={handleInitiateReferral}
                disabled={initiating || !inviteeAddress}
                className="bg-blue-600 hover:bg-blue-700 shrink-0"
              >
                {initiating ? 'Initiating...' : 'Initiate'}
              </Button>
            </div>
            {initiateSuccess && (
              <p className="text-xs text-green-400">Referral initiated successfully!</p>
            )}
            {initiateError && (
              <p className="text-xs text-red-400">{initiateError}</p>
            )}
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <Label className="text-gray-300">Share via</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              <Button
                onClick={() => handleShare('whatsapp')}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-green-400"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>

              {/* Telegram */}
              <Button
                onClick={() => handleShare('telegram')}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-blue-400"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Telegram
              </Button>

              {/* Twitter */}
              <Button
                onClick={() => handleShare('twitter')}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-blue-400"
              >
                <Twitter className="mr-2 h-4 w-4" />
                Twitter
              </Button>

              {/* Facebook */}
              <Button
                onClick={() => handleShare('facebook')}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-blue-600"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>

              {/* LinkedIn */}
              <Button
                onClick={() => handleShare('linkedin')}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-blue-500"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>

              {/* Email */}
              <Button
                onClick={() => handleShare('email')}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-yellow-500"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          {/* Rewards Info */}
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2 text-sm">Referral Rewards</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 1-10 referrals: 10 points each (up to 100 points)</li>
              <li>• 11-50 referrals: 5 points each (up to 300 points)</li>
              <li>• 51-100 referrals: 4 points each (up to 500 points)</li>
              <li>• Maximum: 500 trust score points</li>
            </ul>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
