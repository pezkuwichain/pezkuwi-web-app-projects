import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExistingCitizenAuth } from './ExistingCitizenAuth';
import { NewCitizenApplication } from './NewCitizenApplication';

interface CitizenshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitizenshipModal: React.FC<CitizenshipModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            🏛️ Digital Kurdistan Citizenship
          </DialogTitle>
          <DialogDescription>
            Join the Digital Kurdistan State as a citizen or authenticate your existing citizenship
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'existing' | 'new')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">I am Already a Citizen</TabsTrigger>
            <TabsTrigger value="new">I Want to Become a Citizen</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-6">
            <ExistingCitizenAuth onClose={onClose} />
          </TabsContent>

          <TabsContent value="new" className="mt-6">
            <NewCitizenApplication onClose={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
