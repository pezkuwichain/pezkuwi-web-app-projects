import React from 'react';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress, formatBalance } from '@/lib/wallet';
import { Badge } from '@/components/ui/badge';

export const WalletButton: React.FC = () => {
  const { 
    isConnected, 
    address, 
    balance, 
    chainId,
    error,
    connectMetaMask,
    disconnect,
    switchNetwork
  } = useWallet();

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <div className="flex items-center gap-2 text-sor text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <Button 
          onClick={connectMetaMask}
          className="bg-kesk hover:bg-kesk/90 text-white"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
    );
  }

  const isCorrectNetwork = chainId === '0x2329';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-kesk/20 hover:border-kesk">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-kesk" />
            <div className="text-left">
              <div className="text-sm font-medium">{formatAddress(address!)}</div>
              <div className="text-xs text-muted-foreground">{formatBalance(balance)} PZK</div>
            </div>
            {!isCorrectNetwork && (
              <Badge variant="destructive" className="ml-2 bg-sor">
                Wrong Network
              </Badge>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet Details</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <div className="text-sm text-muted-foreground">Address</div>
          <div className="text-sm font-mono">{formatAddress(address!)}</div>
        </div>
        <div className="px-2 py-1.5">
          <div className="text-sm text-muted-foreground">Balance</div>
          <div className="text-sm font-medium">{formatBalance(balance)} PZK</div>
        </div>
        <div className="px-2 py-1.5">
          <div className="text-sm text-muted-foreground">Network</div>
          <div className="text-sm font-medium">
            {isCorrectNetwork ? 'PezkuwiChain' : 'Unknown Network'}
          </div>
        </div>
        <DropdownMenuSeparator />
        {!isCorrectNetwork && (
          <>
            <DropdownMenuItem onClick={switchNetwork} className="text-zer">
              Switch to PezkuwiChain
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={disconnect} className="text-sor">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};