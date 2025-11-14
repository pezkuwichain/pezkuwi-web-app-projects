import React, { useState, useEffect } from 'react';
import { Wallet, Chrome, ExternalLink, Copy, Check, LogOut, Award, Users, TrendingUp, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { formatAddress } from '@pezkuwi/lib/wallet';
import { getAllScores, type UserScores } from '@pezkuwi/lib/scores';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const {
    accounts,
    selectedAccount,
    setSelectedAccount,
    connectWallet,
    disconnectWallet,
    api,
    isApiReady,
    error
  } = usePolkadot();

  const [copied, setCopied] = useState(false);
  const [scores, setScores] = useState<UserScores>({
    trustScore: 0,
    referralScore: 0,
    stakingScore: 0,
    tikiScore: 0,
    totalScore: 0
  });
  const [loadingScores, setLoadingScores] = useState(false);

  const handleCopyAddress = () => {
    if (selectedAccount?.address) {
      navigator.clipboard.writeText(selectedAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleSelectAccount = (account: typeof accounts[0]) => {
    setSelectedAccount(account);
    onClose();
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  // Fetch all scores from blockchain
  useEffect(() => {
    const fetchAllScores = async () => {
      if (!api || !isApiReady || !selectedAccount?.address) {
        setScores({
          trustScore: 0,
          referralScore: 0,
          stakingScore: 0,
          tikiScore: 0,
          totalScore: 0
        });
        return;
      }

      setLoadingScores(true);
      try {
        const userScores = await getAllScores(api, selectedAccount.address);
        setScores(userScores);
      } catch (err) {
        console.error('Failed to fetch scores:', err);
        setScores({
          trustScore: 0,
          referralScore: 0,
          stakingScore: 0,
          tikiScore: 0,
          totalScore: 0
        });
      } finally {
        setLoadingScores(false);
      }
    };

    fetchAllScores();
  }, [api, isApiReady, selectedAccount]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-400" />
            {selectedAccount ? 'Wallet Connected' : 'Connect Wallet'}
          </DialogTitle>
          <DialogDescription>
            {selectedAccount 
              ? 'Manage your Polkadot account' 
              : 'Connect your Polkadot.js extension to interact with PezkuwiChain'}
          </DialogDescription>
        </DialogHeader>

        {/* No Extension Error */}
        {error && error.includes('extension') && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                Polkadot.js extension not detected. Please install it to continue.
              </p>
            </div>

            <div className="flex gap-3">
              <a
                href="https://polkadot.js.org/extension/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <Chrome className="mr-2 h-4 w-4" />
                  Install Extension
                </Button>
              </a>
            </div>

            <p className="text-xs text-gray-400 text-center">
              After installing, refresh the page and try again
            </p>
          </div>
        )}

        {/* Connected State */}
        {selectedAccount && !error && (
          <div className="space-y-4">
            {/* Account Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">Account Name</div>
                <div className="font-medium">{selectedAccount.meta.name || 'Unnamed Account'}</div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Address</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-gray-300 truncate">
                    {formatAddress(selectedAccount.address)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopyAddress}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-2">Scores from Blockchain</div>
                {loadingScores ? (
                  <div className="text-sm text-gray-400">Loading scores...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Shield className="h-3 w-3 text-purple-400" />
                        <span className="text-xs text-gray-400">Trust</span>
                      </div>
                      <span className="text-sm font-bold text-purple-400">{scores.trustScore}</span>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3 text-cyan-400" />
                        <span className="text-xs text-gray-400">Referral</span>
                      </div>
                      <span className="text-sm font-bold text-cyan-400">{scores.referralScore}</span>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-gray-400">Staking</span>
                      </div>
                      <span className="text-sm font-bold text-green-400">{scores.stakingScore}</span>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Award className="h-3 w-3 text-pink-400" />
                        <span className="text-xs text-gray-400">Tiki</span>
                      </div>
                      <span className="text-sm font-bold text-pink-400">{scores.tikiScore}</span>
                    </div>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Total Score</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      {loadingScores ? '...' : scores.totalScore}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Source</div>
                <div className="text-sm text-gray-300">
                  {selectedAccount.meta.source || 'polkadot-js'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/explorer`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </Button>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>

            {/* Switch Account */}
            {accounts.length > 1 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Switch Account</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {accounts.map((account) => (
                    <button
                      key={account.address}
                      onClick={() => handleSelectAccount(account)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        account.address === selectedAccount.address
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {account.meta.name || 'Unnamed'}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {formatAddress(account.address)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Not Connected State */}
        {!selectedAccount && !error && (
          <div className="space-y-4">
            {accounts.length > 0 ? (
              // Has accounts, show selection
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Select an account to connect:</div>
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <button
                      key={account.address}
                      onClick={() => handleSelectAccount(account)}
                      className="w-full p-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:border-purple-500/50 hover:bg-gray-800 transition-all text-left"
                    >
                      <div className="font-medium mb-1">
                        {account.meta.name || 'Unnamed Account'}
                      </div>
                      <div className="text-sm text-gray-400 font-mono">
                        {account.address}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // No accounts, show connect button
              <div className="space-y-4">
                <Button
                  onClick={handleConnect}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-400 hover:from-purple-700 hover:to-cyan-500"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Polkadot.js
                </Button>
                
                <div className="text-sm text-gray-400 text-center">
                  Don't have Polkadot.js?{' '}
                  <a
                    href="https://polkadot.js.org/extension/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    Download here
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};