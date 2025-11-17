import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Home } from 'lucide-react';
import { AdList } from './AdList';
import { CreateAd } from './CreateAd';

export function P2PDashboard() {
  const [showCreateAd, setShowCreateAd] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">P2P Trading</h1>
          <p className="text-gray-400">Buy and sell crypto with your local currency.</p>
        </div>
        <Button onClick={() => setShowCreateAd(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Post a New Ad
        </Button>
      </div>

      {showCreateAd ? (
        <CreateAd onAdCreated={() => setShowCreateAd(false)} />
      ) : (
        <Tabs defaultValue="buy">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
            <TabsTrigger value="my-ads">My Ads</TabsTrigger>
          </TabsList>
          <TabsContent value="buy">
            <AdList type="buy" />
          </TabsContent>
          <TabsContent value="sell">
            <AdList type="sell" />
          </TabsContent>
          <TabsContent value="my-ads">
            <AdList type="my-ads" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
