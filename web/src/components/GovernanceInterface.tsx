import React, { useState } from 'react';
import { TrendingUp, FileText, Users, Shield, Vote, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import GovernanceOverview from './governance/GovernanceOverview';
import ProposalsList from './governance/ProposalsList';
import ElectionsInterface from './governance/ElectionsInterface';
const GovernanceInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              On-Chain Governance
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Participate in PezkuwiChain's decentralized governance. Vote on proposals, elect representatives, and shape the future of the network.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 bg-gray-900/50 p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="proposals" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="elections" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Elections</span>
            </TabsTrigger>
            <TabsTrigger value="delegation" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Delegation</span>
            </TabsTrigger>
            <TabsTrigger value="voting" className="flex items-center space-x-2">
              <Vote className="w-4 h-4" />
              <span>My Votes</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <GovernanceOverview />
          </TabsContent>

          <TabsContent value="proposals" className="mt-6">
            <ProposalsList />
          </TabsContent>

          <TabsContent value="elections" className="mt-6">
            <ElectionsInterface />
          </TabsContent>

          <TabsContent value="delegation" className="mt-6">
            <div className="text-center py-12 text-gray-400">
              Delegation interface coming soon...
            </div>
          </TabsContent>

          <TabsContent value="voting" className="mt-6">
            <div className="text-center py-12 text-gray-400">
              Voting history coming soon...
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="text-center py-12 text-gray-400">
              Governance history coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default GovernanceInterface;