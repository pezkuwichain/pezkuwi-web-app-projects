import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from './HeroSection';
import TokenomicsSection from './TokenomicsSection';
import PalletsGrid from './PalletsGrid';
import ChainSpecs from './ChainSpecs';
import TrustScoreCalculator from './TrustScoreCalculator';
import { NetworkStats } from './NetworkStats';
import { WalletModal } from './wallet/WalletModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import NotificationBell from './notifications/NotificationBell';
import ProposalWizard from './proposals/ProposalWizard';
import DelegationManager from './delegation/DelegationManager';
import { ForumOverview } from './forum/ForumOverview';
import { ModerationPanel } from './forum/ModerationPanel';
import { TreasuryOverview } from './treasury/TreasuryOverview';
import { FundingProposal } from './treasury/FundingProposal';
import { SpendingHistory } from './treasury/SpendingHistory';
import { MultiSigApproval } from './treasury/MultiSigApproval';
import { ExternalLink, Award, FileEdit, Users2, MessageSquare, ShieldCheck, Wifi, WifiOff, Wallet, DollarSign, PiggyBank, History, Key, TrendingUp, ArrowRightLeft, Lock, LogIn, LayoutDashboard, Settings, Users, Droplet, Mail } from 'lucide-react';
import GovernanceInterface from './GovernanceInterface';
import RewardDistribution from './RewardDistribution';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { StakingDashboard } from './staking/StakingDashboard';
import { MultiSigWallet } from './wallet/MultiSigWallet';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';
import { PolkadotWalletButton } from './PolkadotWalletButton';
import { DEXDashboard } from './dex/DEXDashboard';
import { P2PDashboard } from './p2p/P2PDashboard';
import EducationPlatform from '../pages/EducationPlatform';

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [showProposalWizard, setShowProposalWizard] = useState(false);
  const [showDelegation, setShowDelegation] = useState(false);
  const [showForum, setShowForum] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [showTreasury, setShowTreasury] = useState(false);
  const [treasuryTab, setTreasuryTab] = useState('overview');
  const [showStaking, setShowStaking] = useState(false);
  const [showMultiSig, setShowMultiSig] = useState(false);
  const [showDEX, setShowDEX] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showP2P, setShowP2P] = useState(false);
  const { t } = useTranslation();
  const { isConnected } = useWebSocket();
  useWallet();
  const [, _setIsAdmin] = useState(false);

  // Check if user is admin
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          if (import.meta.env.DEV) console.warn('Admin check error:', error);
        }
        _setIsAdmin(!!data);
      } else {
        _setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            {/* LEFT: Logo */}
            <div className="flex-shrink-0">
              <span className="text-lg font-bold bg-gradient-to-r from-green-500 to-yellow-400 bg-clip-text text-transparent whitespace-nowrap">
                PezkuwiChain
              </span>
            </div>
            
            {/* CENTER & RIGHT: Menu + Actions in same row */}
            <div className="hidden lg:flex items-center space-x-4 flex-1 justify-start ml-8 pr-4">
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>

                  <button
                    onClick={() => navigate('/wallet')}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    <Wallet className="w-4 h-4" />
                    Wallet
                  </button>

                  <button
                    onClick={() => navigate('/be-citizen')}
                    className="text-cyan-300 hover:text-cyan-100 transition-colors flex items-center gap-1 text-sm font-semibold"
                  >
                    <Users className="w-4 h-4" />
                    Be Citizen
                  </button>

                  {/* Governance Dropdown */}
                  <div className="relative group">
                    <button className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm">
                      <FileEdit className="w-4 h-4" />
                      Governance
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <button
                        onClick={() => setShowProposalWizard(true)}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 rounded-t-lg"
                      >
                        <FileEdit className="w-4 h-4" />
                        Proposals
                      </button>
                      <button
                        onClick={() => setShowDelegation(true)}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                      >
                        <Users2 className="w-4 h-4" />
                        Delegation
                      </button>
                      <button
                        onClick={() => setShowForum(true)}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Forum
                      </button>
                      <button
                        onClick={() => {
                          setShowTreasury(true);
                          setTreasuryTab('overview');
                        }}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                      >
                        <PiggyBank className="w-4 h-4" />
                        Treasury
                      </button>
                      <button
                        onClick={() => setShowModeration(true)}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 rounded-b-lg"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Moderation
                      </button>
                    </div>
                  </div>

                  {/* Trading Dropdown */}
                  <div className="relative group">
                    <button className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm">
                      <ArrowRightLeft className="w-4 h-4" />
                      Trading
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <button
                        onClick={() => setShowDEX(true)}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 rounded-t-lg"
                      >
                        <Droplet className="w-4 h-4" />
                        DEX Pools
                      </button>
                      <button
                        onClick={() => {
                          setShowP2P(true);
                          navigate('/p2p');
                        }}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        P2P
                      </button>
                      <button
                        onClick={() => setShowStaking(true)}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Staking
                      </button>
                      <button
                        onClick={() => setShowMultiSig(true)}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 rounded-b-lg"
                      >
                        <Lock className="w-4 h-4" />
                        MultiSig
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowEducation(true);
                      navigate('/education');
                    }}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    <Award className="w-4 h-4" />
                    Education
                  </button>

                  <button
                    onClick={() => navigate('/profile/settings')}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <button
                    onClick={async () => {
                      await signOut();
                      navigate('/login');
                    }}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    <LogIn className="w-4 h-4 rotate-180" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/be-citizen')}
                    className="text-cyan-300 hover:text-cyan-100 transition-colors flex items-center gap-1 text-sm font-semibold"
                  >
                    <Users className="w-4 h-4" />
                    Be Citizen
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </button>
                </>
              )}

              <a
                href="https://raw.githubusercontent.com/pezkuwichain/DKSweb/main/public/Whitepaper.pdf"
                download="Pezkuwi_Whitepaper.pdf"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Docs
              </a>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-700"></div>

              {/* Actions continue after Docs */}
              <div className="flex items-center">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-500" />
                )}
              </div>

              <NotificationBell />
              <LanguageSwitcher />
              <PolkadotWalletButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {/* Conditional Rendering for Features */}
        {showDEX ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <div className="max-w-full mx-auto px-4">
              <DEXDashboard />
            </div>
          </div>
        ) : showProposalWizard ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <div className="max-w-full mx-auto px-4">
              <ProposalWizard
                onComplete={(proposal) => {
                  if (import.meta.env.DEV) console.log('Proposal created:', proposal);
                  setShowProposalWizard(false);
                }}
                onCancel={() => setShowProposalWizard(false)}
              />
            </div>
          </div>
        ) : showDelegation ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <div className="max-w-full mx-auto px-4">
              <DelegationManager />
            </div>
          </div>
        ) : showForum ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <div className="max-w-full mx-auto px-4">
              <ForumOverview />
            </div>
          </div>
        ) : showModeration ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <div className="max-w-full mx-auto px-4">
              <ModerationPanel />
            </div>
          </div>
        ) : showTreasury ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <div className="max-w-full mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
                  {t('treasury.title', 'Treasury Management')}
                </h2>
                <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                  {t('treasury.subtitle', 'Track funds, submit proposals, and manage community resources')}
                </p>
              </div>
              
              <Tabs value={treasuryTab} onValueChange={setTreasuryTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4" />
                    {t('treasury.overview', 'Overview')}
                  </TabsTrigger>
                  <TabsTrigger value="proposals" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {t('treasury.proposals', 'Funding Proposals')}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    {t('treasury.history', 'Spending History')}
                  </TabsTrigger>
                  <TabsTrigger value="approvals" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    {t('treasury.approvals', 'Multi-Sig Approvals')}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                  <TreasuryOverview />
                </TabsContent>
                
                <TabsContent value="proposals" className="mt-6">
                  <FundingProposal />
                </TabsContent>
                
                <TabsContent value="history" className="mt-6">
                  <SpendingHistory />
                </TabsContent>
                
                <TabsContent value="approvals" className="mt-6">
                  <MultiSigApproval />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : showStaking ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <div className="max-w-full mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
                  Staking Rewards
                </h2>
                <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                  Stake your tokens and earn rewards
                </p>
              </div>
              <StakingDashboard />
            </div>
          </div>
        ) : showMultiSig ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <div className="max-w-full mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
                  Multi-Signature Wallet
                </h2>
                <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                  Secure your funds with multi-signature protection
                </p>
              </div>
              <MultiSigWallet />
            </div>
          </div>
        ) : showEducation ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <EducationPlatform />
          </div>
        ) : showP2P ? (
          <div className="pt-20 min-h-screen bg-gray-950">
            <P2PDashboard />
          </div>
        ) : (
          <>
            <HeroSection />
            <NetworkStats key="network-stats-live" />
            <PalletsGrid />
            <TokenomicsSection />
            
            
            <div id="trust-calculator">
              <TrustScoreCalculator />
            </div>
            <div id="chain-specs">
              <ChainSpecs />
            </div>
            <div id="governance">
              <GovernanceInterface />
            </div>
            <div id="rewards">
              <RewardDistribution />
            </div>
          </>
        )}
        

        {(showDEX || showProposalWizard || showDelegation || showForum || showModeration || showTreasury || showStaking || showMultiSig || showEducation || showP2P) && (
          <div className="fixed bottom-8 right-8 z-50">
            <button
              onClick={() => {
                setShowDEX(false);
                setShowProposalWizard(false);
                setShowDelegation(false);
                setShowForum(false);
                setShowModeration(false);
                setShowTreasury(false);
                setShowStaking(false);
                setShowMultiSig(false);
                setShowEducation(false);
                setShowP2P(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </main>

      {/* Wallet Modal */}
      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-12">
        <div className="max-w-full mx-auto px-4">
          {/* Contact Info */}
          <div className="mb-8 space-y-2 text-sm text-gray-400 text-center">
            <p className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              info@pezkuwichain.io
            </p>
            <p className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              info@pezkuwichain.app
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            <div>
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-green-500 to-yellow-400 bg-clip-text text-transparent">
                PezkuwiChain
              </h3>
              <p className="text-gray-400 text-sm">
                Decentralized governance platform
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-left">About</h4>
              <ul className="space-y-2 text-left">
                <li>
                  <a
                    href="https://raw.githubusercontent.com/pezkuwichain/DKSweb/main/public/Whitepaper.pdf"
                    download="Pezkuwi_Whitepaper.pdf"
                    className="text-gray-400 hover:text-white text-sm inline-flex items-center"
                  >
                    Whitepaper
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/pezkuwichain" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm inline-flex items-center">
                    GitHub
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-left">Developers</h4>
              <ul className="space-y-2 text-left">
                <li>
                  <a href="https://explorer.pezkuwichain.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm inline-flex items-center">
                    API
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://sdk.pezkuwichain.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm inline-flex items-center">
                    SDK
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-left">Community</h4>
              <ul className="space-y-2 text-left">
                <li>
                  <a href="https://discord.gg/pezkuwichain" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm inline-flex items-center">
                    Discord
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://x.com/PezkuwiChain" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm inline-flex items-center">
                    Twitter/X
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://t.me/PezkuwiApp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm inline-flex items-center">
                    Telegram
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@SatoshiQazi" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm inline-flex items-center">
                    YouTube
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://facebook.com/profile.php?id=61582484611719" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm inline-flex items-center">
                    Facebook
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 PezkuwiChain. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;