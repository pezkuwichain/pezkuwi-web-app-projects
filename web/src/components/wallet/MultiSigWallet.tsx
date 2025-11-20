import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Key, Send } from 'lucide-react';

interface MultiSigTransaction {
  id: string;
  to: string;
  amount: number;
  token: string;
  description: string;
  requiredSignatures: number;
  currentSignatures: number;
  status: 'pending' | 'executed' | 'rejected';
  signers: string[];
}

export const MultiSigWallet: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');

  const transactions: MultiSigTransaction[] = [
    {
      id: '1',
      to: '0x742d...29Bb',
      amount: 5000,
      token: 'HEZ',
      description: 'Development fund payment',
      requiredSignatures: 3,
      currentSignatures: 2,
      status: 'pending',
      signers: ['Alice', 'Bob']
    },
    {
      id: '2',
      to: '0x891a...45Cc',
      amount: 10000,
      token: 'PEZ',
      description: 'Marketing campaign',
      requiredSignatures: 3,
      currentSignatures: 3,
      status: 'executed',
      signers: ['Alice', 'Bob', 'Charlie']
    }
  ];

  const handleCreateTransaction = () => {
    if (import.meta.env.DEV) console.log('Creating multi-sig transaction:', { amount, recipient, description });
  };

  const handleSign = (txId: string) => {
    if (import.meta.env.DEV) console.log('Signing transaction:', txId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">50,000 HEZ</div>
            <p className="text-xs text-gray-500 mt-1">25,000 PEZ</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">Required Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">3 of 5</div>
            <p className="text-xs text-gray-500 mt-1">Signers required</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">Pending Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">2</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting signatures</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Create Transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Recipient Address</Label>
              <Input
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              placeholder="Transaction purpose"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <Button onClick={handleCreateTransaction} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-2" />
            Create Transaction
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.map((tx) => (
            <Card key={tx.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{tx.description}</span>
                      <Badge variant={tx.status === 'executed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}>
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-400">
                      To: {tx.to} | Amount: {tx.amount} {tx.token}
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={(tx.currentSignatures / tx.requiredSignatures) * 100} className="w-32" />
                      <span className="text-sm text-gray-400">
                        {tx.currentSignatures}/{tx.requiredSignatures} signatures
                      </span>
                    </div>
                  </div>
                  {tx.status === 'pending' && (
                    <Button size="sm" onClick={() => handleSign(tx.id)} className="bg-blue-600 hover:bg-blue-700">
                      <Key className="w-4 h-4 mr-1" />
                      Sign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};