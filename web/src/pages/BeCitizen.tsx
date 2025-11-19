import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CitizenshipModal } from '@/components/citizenship/CitizenshipModal';
import { InviteUserModal } from '@/components/referral/InviteUserModal';
import { Shield, Users, Award, Globe, ChevronRight, ArrowLeft, UserPlus } from 'lucide-react';

const BeCitizen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);

  // Check for referral parameter on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferrerAddress(ref);
      // Auto-open modal if coming from referral link
      setIsModalOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-white to-red-600">
      <div className="container mx-auto px-4 py-16">
        {/* Back to Home Button and Invite Friend */}
        <div className="mb-8 flex justify-between items-center">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-red-600 hover:bg-red-700 border-yellow-400 border-2 text-white font-semibold shadow-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 border-yellow-400 border-2 text-white font-semibold shadow-lg"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Friend
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-red-700 mb-6 drop-shadow-lg">
            🏛️ Digital Kurdistan
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-green-700 mb-4 drop-shadow-lg">
            Bibe Welati / Be a Citizen
          </h2>
          <p className="text-xl text-gray-800 font-semibold max-w-3xl mx-auto drop-shadow-md">
            Join the Digital Kurdistan State as a sovereign citizen. Receive your Welati Tiki NFT and unlock governance, trust scoring, and community benefits.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-red-50/90 backdrop-blur-md border-red-600/50 hover:border-red-600 transition-all shadow-lg">
            <CardHeader>
              <Shield className="h-12 w-12 text-red-600 mb-3" />
              <CardTitle className="text-red-700 font-bold">Privacy Protected</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Your data is encrypted with ZK-proofs. Only hashes are stored on-chain.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-yellow-50/90 backdrop-blur-md border-yellow-600/50 hover:border-yellow-600 transition-all shadow-lg">
            <CardHeader>
              <Award className="h-12 w-12 text-yellow-700 mb-3" />
              <CardTitle className="text-yellow-800 font-bold">Welati Tiki NFT</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Receive your unique soulbound citizenship NFT after KYC approval.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-green-50/90 backdrop-blur-md border-green-600/50 hover:border-green-600 transition-all shadow-lg">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mb-3" />
              <CardTitle className="text-green-700 font-bold">Trust Scoring</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Build trust through referrals, staking, and community contributions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-red-50/90 backdrop-blur-md border-red-600/50 hover:border-red-600 transition-all shadow-lg">
            <CardHeader>
              <Globe className="h-12 w-12 text-red-600 mb-3" />
              <CardTitle className="text-red-700 font-bold">Governance Access</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Participate in on-chain governance and shape the future of Digital Kurdistan.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 backdrop-blur-lg border-red-600 border-4 shadow-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-red-700 mb-3">Ready to Join?</h3>
                  <p className="text-gray-800 font-medium mb-6">
                    Whether you're already a citizen or want to become one, start your journey here.
                  </p>
                </div>

                <Button
                  onClick={() => setIsModalOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-green-700 hover:from-red-700 hover:to-green-800 text-white font-bold px-8 py-6 text-lg group shadow-xl border-2 border-yellow-300"
                >
                  <span>Start Citizenship Process</span>
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="flex flex-col md:flex-row gap-4 justify-center items-center text-sm text-gray-700 font-medium pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-700" />
                    <span>Secure ZK-Proof Authentication</span>
                  </div>
                  <div className="hidden md:block text-red-600">•</div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-red-600" />
                    <span>Soulbound NFT Citizenship</span>
                  </div>
                  <div className="hidden md:block text-red-600">•</div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-700" />
                    <span>Decentralized Identity</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Overview */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-red-700 text-center mb-8 drop-shadow-lg">How It Works</h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Existing Citizens */}
            <Card className="bg-red-50/90 backdrop-blur-md border-red-600/50 shadow-lg">
              <CardHeader>
                <div className="bg-red-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <CardTitle className="text-red-700 font-bold">Already a Citizen?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 font-medium space-y-2 text-sm">
                <p>✓ Enter your Welati Tiki NFT number</p>
                <p>✓ Verify NFT ownership on-chain</p>
                <p>✓ Sign authentication challenge</p>
                <p>✓ Access your citizen dashboard</p>
              </CardContent>
            </Card>

            {/* New Citizens */}
            <Card className="bg-yellow-50/90 backdrop-blur-md border-yellow-600/50 shadow-lg">
              <CardHeader>
                <div className="bg-yellow-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <CardTitle className="text-yellow-800 font-bold">New to Citizenship?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 font-medium space-y-2 text-sm">
                <p>✓ Fill detailed KYC application</p>
                <p>✓ Data encrypted with ZK-proofs</p>
                <p>✓ Submit for admin approval</p>
                <p>✓ Receive your Welati Tiki NFT</p>
              </CardContent>
            </Card>

            {/* After Citizenship */}
            <Card className="bg-green-50/90 backdrop-blur-md border-green-600/50 shadow-lg">
              <CardHeader>
                <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <CardTitle className="text-green-700 font-bold">Citizen Benefits</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 font-medium space-y-2 text-sm">
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
          <Card className="bg-yellow-50/90 border-yellow-600/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-yellow-700 mt-1 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-bold text-yellow-800 mb-2">Privacy & Security</p>
                  <p className="font-medium">
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
      <CitizenshipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        referrerAddress={referrerAddress}
      />

      {/* Invite Friend Modal */}
      <InviteUserModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
};

export default BeCitizen;
