import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CitizenshipModal } from '@/components/citizenship/CitizenshipModal';
import { Shield, Users, Award, Globe, ChevronRight, ArrowLeft, Home } from 'lucide-react';

const BeCitizen: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="container mx-auto px-4 py-16">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            🏛️ Digital Kurdistan
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-cyan-300 mb-4">
            Bibe Welati / Be a Citizen
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Join the Digital Kurdistan State as a sovereign citizen. Receive your Welati Tiki NFT and unlock governance, trust scoring, and community benefits.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border-cyan-500/30 hover:border-cyan-500 transition-all">
            <CardHeader>
              <Shield className="h-12 w-12 text-cyan-400 mb-3" />
              <CardTitle className="text-white">Privacy Protected</CardTitle>
              <CardDescription className="text-gray-300">
                Your data is encrypted with ZK-proofs. Only hashes are stored on-chain.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-purple-500/30 hover:border-purple-500 transition-all">
            <CardHeader>
              <Award className="h-12 w-12 text-purple-400 mb-3" />
              <CardTitle className="text-white">Welati Tiki NFT</CardTitle>
              <CardDescription className="text-gray-300">
                Receive your unique soulbound citizenship NFT after KYC approval.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-green-500/30 hover:border-green-500 transition-all">
            <CardHeader>
              <Users className="h-12 w-12 text-green-400 mb-3" />
              <CardTitle className="text-white">Trust Scoring</CardTitle>
              <CardDescription className="text-gray-300">
                Build trust through referrals, staking, and community contributions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-yellow-500/30 hover:border-yellow-500 transition-all">
            <CardHeader>
              <Globe className="h-12 w-12 text-yellow-400 mb-3" />
              <CardTitle className="text-white">Governance Access</CardTitle>
              <CardDescription className="text-gray-300">
                Participate in on-chain governance and shape the future of Digital Kurdistan.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/5 backdrop-blur-lg border-cyan-500/50">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Ready to Join?</h3>
                  <p className="text-gray-300 mb-6">
                    Whether you're already a citizen or want to become one, start your journey here.
                  </p>
                </div>

                <Button
                  onClick={() => setIsModalOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg group"
                >
                  <span>Start Citizenship Process</span>
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="flex flex-col md:flex-row gap-4 justify-center items-center text-sm text-gray-400 pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure ZK-Proof Authentication</span>
                  </div>
                  <div className="hidden md:block">•</div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>Soulbound NFT Citizenship</span>
                  </div>
                  <div className="hidden md:block">•</div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Decentralized Identity</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Overview */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-8">How It Works</h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Existing Citizens */}
            <Card className="bg-white/5 backdrop-blur-md border-cyan-500/30">
              <CardHeader>
                <div className="bg-cyan-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-cyan-400">1</span>
                </div>
                <CardTitle className="text-white">Already a Citizen?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2 text-sm">
                <p>✓ Enter your Welati Tiki NFT number</p>
                <p>✓ Verify NFT ownership on-chain</p>
                <p>✓ Sign authentication challenge</p>
                <p>✓ Access your citizen dashboard</p>
              </CardContent>
            </Card>

            {/* New Citizens */}
            <Card className="bg-white/5 backdrop-blur-md border-purple-500/30">
              <CardHeader>
                <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                </div>
                <CardTitle className="text-white">New to Citizenship?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2 text-sm">
                <p>✓ Fill detailed KYC application</p>
                <p>✓ Data encrypted with ZK-proofs</p>
                <p>✓ Submit for admin approval</p>
                <p>✓ Receive your Welati Tiki NFT</p>
              </CardContent>
            </Card>

            {/* After Citizenship */}
            <Card className="bg-white/5 backdrop-blur-md border-green-500/30">
              <CardHeader>
                <div className="bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-400">3</span>
                </div>
                <CardTitle className="text-white">Citizen Benefits</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2 text-sm">
                <p>✓ Trust score calculation enabled</p>
                <p>✓ Governance voting rights</p>
                <p>✓ Referral tree participation</p>
                <p>✓ Staking multiplier bonuses</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-yellow-400 mt-1 flex-shrink-0" />
                <div className="text-sm text-gray-200">
                  <p className="font-semibold text-yellow-400 mb-2">Privacy & Security</p>
                  <p>
                    Your personal data is encrypted using AES-GCM with your wallet-derived keys.
                    Only commitment hashes are stored on the blockchain. Encrypted data is stored
                    on IPFS and locally on your device. No personal information is ever publicly visible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Citizenship Modal */}
      <CitizenshipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default BeCitizen;
