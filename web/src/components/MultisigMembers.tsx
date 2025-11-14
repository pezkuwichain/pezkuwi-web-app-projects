import React, { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePolkadot } from '@/contexts/PolkadotContext';
import {
  getMultisigMemberInfo,
  calculateMultisigAddress,
  USDT_MULTISIG_CONFIG,
  formatMultisigAddress,
} from '@/lib/multisig';
import { getTikiDisplayName, getTikiEmoji } from '@/lib/tiki';

interface MultisigMembersProps {
  specificAddresses?: Record<string, string>;
  showMultisigAddress?: boolean;
}

export const MultisigMembers: React.FC<MultisigMembersProps> = ({
  specificAddresses = {},
  showMultisigAddress = true,
}) => {
  const { api, isApiReady } = usePolkadot();
  const [members, setMembers] = useState<any[]>([]);
  const [multisigAddress, setMultisigAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api || !isApiReady) return;

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const memberInfo = await getMultisigMemberInfo(api, specificAddresses);
        setMembers(memberInfo);

        // Calculate multisig address
        const addresses = memberInfo.map((m) => m.address);
        if (addresses.length > 0) {
          const multisig = calculateMultisigAddress(addresses);
          setMultisigAddress(multisig);
        }
      } catch (error) {
        console.error('Error fetching multisig members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [api, isApiReady, specificAddresses]);

  if (loading) {
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-bold text-white">USDT Treasury Multisig</h3>
            <p className="text-sm text-gray-400">
              {USDT_MULTISIG_CONFIG.threshold}/{members.length} Signatures Required
            </p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {members.length} Members
        </Badge>
      </div>

      {/* Multisig Address */}
      {showMultisigAddress && multisigAddress && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">Multisig Account</p>
          <div className="flex items-center justify-between">
            <code className="text-sm text-green-400 font-mono">{formatMultisigAddress(multisigAddress)}</code>
            <button
              onClick={() => navigator.clipboard.writeText(multisigAddress)}
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              Copy Full
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800">
                <span className="text-xl">{getTikiEmoji(member.tiki)}</span>
              </div>
              <div>
                <p className="font-semibold text-white">{member.role}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getTikiDisplayName(member.tiki)}
                  </Badge>
                  {member.isUnique && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      On-Chain
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <code className="text-xs text-gray-400 font-mono">
                {member.address.slice(0, 6)}...{member.address.slice(-4)}
              </code>
              <div className="flex items-center gap-2 mt-1 justify-end">
                {member.isUnique ? (
                  <CheckCircle className="h-4 w-4 text-green-500" title="Verified on-chain" />
                ) : (
                  <XCircle className="h-4 w-4 text-yellow-500" title="Specified address" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Alert */}
      <Alert className="mt-6 bg-blue-900/20 border-blue-500">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-1">Security Features</p>
          <ul className="text-sm space-y-1">
            <li>• {USDT_MULTISIG_CONFIG.threshold} out of {members.length} signatures required</li>
            <li>• {members.filter(m => m.isUnique).length} members verified on-chain via Tiki</li>
            <li>• No single person can control funds</li>
            <li>• All transactions visible on blockchain</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Explorer Link */}
      {multisigAddress && (
        <div className="mt-4 text-center">
          <a
            href={`https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/accounts/${multisigAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            View on Polkadot.js
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
    </Card>
  );
};
