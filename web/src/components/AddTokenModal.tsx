import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToken: (assetId: number) => Promise<void>;
}

export const AddTokenModal: React.FC<AddTokenModalProps> = ({
  isOpen,
  onClose,
  onAddToken,
}) => {
  const [assetId, setAssetId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const id = parseInt(assetId);
    if (isNaN(id) || id < 0) {
      setError('Please enter a valid asset ID (number)');
      return;
    }

    setIsLoading(true);
    try {
      await onAddToken(id);
      setAssetId('');
      setError('');
    } catch (err) {
      setError('Failed to add token. Please check the asset ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAssetId('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Custom Token</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter the asset ID of the token you want to track.
            Note: Core tokens (HEZ, PEZ) are already displayed separately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="assetId" className="text-sm text-gray-300">
              Asset ID
            </Label>
            <Input
              id="assetId"
              type="number"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="e.g., 3"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              min="0"
              required
            />
            <p className="text-xs text-gray-500">
              Each token on the network has a unique asset ID
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="border border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isLoading ? 'Adding...' : 'Add Token'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
