import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  ArrowLeft,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Vote,
  FileText,
  Users,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LegislationProposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  supportVotes: number;
  opposeVotes: number;
  status: string; // Active, Passed, Rejected
  blockNumber: number;
}

interface Candidate {
  address: string;
  nominator: string;
  voteCount: number;
  blockNumber: number;
}

// Hükümet yetkili Tiki listesi (Government authorized Tikis)
const GOVERNMENT_AUTHORIZED_TIKIS = [
  'Serok', // President
  'Parlementer', // Parliament Member
  'SerokiMeclise', // Parliamentary Speaker
  'SerokWeziran', // Prime Minister
  'WezireDarayiye', // Finance Minister
  'WezireParez', // Defense Minister
  'WezireDad', // Justice Minister
  'WezireBelaw', // Education Minister
  'WezireTend', // Health Minister
  'WezireAva', // Water Resources Minister
  'WezireCand', // Culture Minister
  'Wezir', // General Minister
  'EndameDiwane', // Constitutional Court Member
  'Dadger', // Judge
  'Dozger', // Prosecutor
  'Noter', // Notary
  'Xezinedar', // Treasurer
  'Bacgir', // Tax Collector
  'GerinendeyeCavkaniye', // Budget Director
  'OperatorêTorê', // Network Operator
  'PisporêEwlehiyaSîber', // Cybersecurity Expert
  'GerinendeyeDaneye', // Data Manager
  'Berdevk', // Security Officer
  'Qeydkar', // Registrar
  'Balyoz', // Ambassador
  'Navbeynkar', // Mediator
  'ParêzvaneÇandî', // Cultural Attaché
  'Mufetîs', // Inspector
  'KalîteKontrolker', // Quality Controller
  'RêveberêProjeyê', // Project Manager
  'Mamoste' // Teacher - Most important government member!
];

export default function GovernmentEntrance() {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const { nftDetails, loading: dashboardLoading } = useDashboard();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('legislation');

  // Giriş kontrolü için state'ler
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [inputCitizenId, setInputCitizenId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  // Legislation
  const [proposals, setProposals] = useState<LegislationProposal[]>([]);
  const [userLegislationVotes, setUserLegislationVotes] = useState<Map<number, boolean>>(new Map());
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [isProposing, setIsProposing] = useState(false);

  // Parliament
  const [parliamentCandidates, setParliamentCandidates] = useState<Candidate[]>([]);
  const [userParliamentVote, setUserParliamentVote] = useState<string | null>(null);
  const [showNominateParliamentModal, setShowNominateParliamentModal] = useState(false);
  const [parliamentNomineeAddress, setParliamentNomineeAddress] = useState('');
  const [isNominatingParliament, setIsNominatingParliament] = useState(false);

  // President
  const [presidentialCandidates, setPresidentialCandidates] = useState<Candidate[]>([]);
  const [userPresidentialVote, setUserPresidentialVote] = useState<string | null>(null);
  const [showNominatePresidentModal, setShowNominatePresidentModal] = useState(false);
  const [presidentNomineeAddress, setPresidentNomineeAddress] = useState('');
  const [isNominatingPresident, setIsNominatingPresident] = useState(false);

  useEffect(() => {
    checkGovernmentAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nftDetails, dashboardLoading]);
     

  useEffect(() => {
    if (isApiReady && selectedAccount) {
      fetchLegislationProposals();
      fetchParliamentCandidates();
      fetchPresidentialCandidates();
      fetchUserVotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiReady, selectedAccount]);

  const checkGovernmentAccess = () => {
    if (dashboardLoading) {
      setLoading(true);
      return;
    }

    // Önce Citizen NFT kontrolü
    if (!nftDetails.citizenNFT) {
      toast({
        title: "Mafê Te Tuneye (No Access)",
        description: "Divê hûn xwedîyê Tiki NFT bin ku vê rûpelê bigihînin (You must own a Tiki NFT to access this page)",
        variant: "destructive"
      });
      navigate('/citizens');
      return;
    }

    // Eğer henüz doğrulama yapmadıysak, modal göster
    if (!accessGranted) {
      setShowAccessModal(true);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handleVerifyAccess = () => {
    if (!inputCitizenId.trim()) {
      toast({
        title: "Xeletî (Error)",
        description: "Ji kerema xwe Citizenship ID-ya xwe binivîse (Please enter your Citizenship ID)",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);

    try {
      // KONTROL 1: Citizen ID eşleşmesi kontrolü
      const nftCitizenId = nftDetails.citizenNFT?.citizenship_id;
      const inputId = inputCitizenId.trim();

      if (nftCitizenId !== inputId) {
        toast({
          title: "Gihîştin Nehatin Pejirandin (Access Denied)",
          description: "Citizenship ID-ya we li gel zanyariyên NFT-ya we li hev nayê (Your Citizenship ID does not match your NFT data)",
          variant: "destructive"
        });
        setIsVerifying(false);
        return;
      }

      // KONTROL 2: Hükümet yetkili Tiki kontrolü
      const userTikis = nftDetails.roleNFTs || [];  // DashboardContext'te roleNFTs olarak geliyor
      const hasAuthorizedTiki = userTikis.some(tiki =>
        GOVERNMENT_AUTHORIZED_TIKIS.includes(tiki.tiki_type)
      );

      if (!hasAuthorizedTiki) {
        toast({
          title: "Mafê Te Tuneye (No Authorization)",
          description: "Hûn xwedîyê Tiki-yeke hikûmetê nînin. Tenê xwedîyên Tiki-yên hikûmetê dikarin vê rûpelê bigihînin (You do not own a government Tiki. Only government Tiki holders can access this page)",
          variant: "destructive"
        });
        setIsVerifying(false);
        // Geri yönlendir
        setTimeout(() => navigate('/citizens'), 2000);
        return;
      }

      // HER İKİ KONTROL DE BAŞARILI!
      toast({
        title: "✅ Gihîştin Pejirandin (Access Granted)",
        description: "Hûn bi serkeftî ketine Deriyê Hikûmetê (You have successfully entered the Government Portal)",
      });

      setAccessGranted(true);
      setShowAccessModal(false);
      setIsVerifying(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error verifying access:', error);
      toast({
        title: "Xeletî (Error)",
        description: "Pirsgirêk di kontrolkirina mafê de (Error verifying access)",
        variant: "destructive"
      });
      setIsVerifying(false);
    }
  };

  // LEGISLATION FUNCTIONS
  const fetchLegislationProposals = async () => {
    if (!api || !isApiReady) return;

    try {
      const proposalEntries = await api.query.welati.legislationProposals.entries();
      const fetchedProposals: LegislationProposal[] = [];

      proposalEntries.forEach(([key, value]) => {
        const proposalId = key.args[0].toNumber();
        const proposal = value.unwrap();
        fetchedProposals.push({
          id: proposalId,
          proposer: proposal.proposer.toString(),
          title: proposal.title.toString(),
          description: proposal.description.toString(),
          supportVotes: proposal.supportVotes.toNumber(),
          opposeVotes: proposal.opposeVotes.toNumber(),
          status: proposal.status.toString(),
          blockNumber: proposal.blockNumber.toNumber()
        });
      });

      setProposals(fetchedProposals.reverse());
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching legislation proposals:', error);
    }
  };

  const handleProposeLegislation = async () => {
    if (!api || !selectedAccount || !proposalTitle.trim() || !proposalDescription.trim()) return;

    setIsProposing(true);

    try {
      const tx = api.tx.welati.proposeLegislation(proposalTitle, proposalDescription);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Pêşniyar hate şandin (Proposal Submitted)',
            description: 'Pêşniyara yasayê we bi serkeftî hate şandin (Your legislation proposal has been submitted successfully)',
          });

          setShowProposeModal(false);
          setProposalTitle('');
          setProposalDescription('');
          setIsProposing(false);

          fetchLegislationProposals();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error proposing legislation:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina pêşniyarê de (Error submitting proposal)',
        variant: 'destructive'
      });
      setIsProposing(false);
    }
  };

  const handleVoteOnLegislation = async (proposalId: number, support: boolean) => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.voteOnLegislation(proposalId, support);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Deng hate şandin (Vote Submitted)',
            description: support
              ? 'Hûn piştgiriya xwe nîşan da (You voted in support)'
              : 'Hûn dijberiya xwe nîşan da (You voted in opposition)',
          });

          setUserLegislationVotes(prev => new Map(prev).set(proposalId, support));
          fetchLegislationProposals();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error voting on legislation:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina dengê de (Error submitting vote)',
        variant: 'destructive'
      });
    }
  };

  // PARLIAMENT FUNCTIONS
  const fetchParliamentCandidates = async () => {
    if (!api || !isApiReady) return;

    try {
      const candidateEntries = await api.query.welati.parliamentaryCandidates.entries();
      const fetchedCandidates: Candidate[] = [];

      candidateEntries.forEach(([key, value]) => {
        const candidate = value.unwrap();
        fetchedCandidates.push({
          address: key.args[0].toString(),
          nominator: candidate.nominator.toString(),
          voteCount: candidate.voteCount.toNumber(),
          blockNumber: candidate.blockNumber.toNumber()
        });
      });

      setParliamentCandidates(fetchedCandidates.sort((a, b) => b.voteCount - a.voteCount));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching parliament candidates:', error);
    }
  };

  const handleNominateParliament = async () => {
    if (!api || !selectedAccount || !parliamentNomineeAddress.trim()) return;

    setIsNominatingParliament(true);

    try {
      const tx = api.tx.welati.nominateForParliament(parliamentNomineeAddress);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Berjewendî hate şandin (Nomination Submitted)',
            description: 'Berjewendiya parlamentê bi serkeftî hate şandin (Parliamentary nomination submitted successfully)',
          });

          setShowNominateParliamentModal(false);
          setParliamentNomineeAddress('');
          setIsNominatingParliament(false);

          fetchParliamentCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error nominating for parliament:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina berjewendiyê de (Error submitting nomination)',
        variant: 'destructive'
      });
      setIsNominatingParliament(false);
    }
  };

  const handleVoteForParliament = async (candidateAddress: string) => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.voteForParliament(candidateAddress);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Deng hate şandin (Vote Submitted)',
            description: 'Denga we ji bo berjewendî hate şandin (Your vote for the candidate has been submitted)',
          });

          setUserParliamentVote(candidateAddress);
          fetchParliamentCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error voting for parliament:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina dengê de (Error submitting vote)',
        variant: 'destructive'
      });
    }
  };

  // PRESIDENT FUNCTIONS
  const fetchPresidentialCandidates = async () => {
    if (!api || !isApiReady) return;

    try {
      const candidateEntries = await api.query.welati.presidentialCandidates.entries();
      const fetchedCandidates: Candidate[] = [];

      candidateEntries.forEach(([key, value]) => {
        const candidate = value.unwrap();
        fetchedCandidates.push({
          address: key.args[0].toString(),
          nominator: candidate.nominator.toString(),
          voteCount: candidate.voteCount.toNumber(),
          blockNumber: candidate.blockNumber.toNumber()
        });
      });

      setPresidentialCandidates(fetchedCandidates.sort((a, b) => b.voteCount - a.voteCount));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching presidential candidates:', error);
    }
  };

  const handleNominatePresident = async () => {
    if (!api || !selectedAccount || !presidentNomineeAddress.trim()) return;

    setIsNominatingPresident(true);

    try {
      const tx = api.tx.welati.nominatePresident(presidentNomineeAddress);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Berjewendî hate şandin (Nomination Submitted)',
            description: 'Berjewendiya serokbûnê bi serkeftî hate şandin (Presidential nomination submitted successfully)',
          });

          setShowNominatePresidentModal(false);
          setPresidentNomineeAddress('');
          setIsNominatingPresident(false);

          fetchPresidentialCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error nominating president:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina berjewendiyê de (Error submitting nomination)',
        variant: 'destructive'
      });
      setIsNominatingPresident(false);
    }
  };

  const handleVoteForPresident = async (candidateAddress: string) => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.voteForPresident(candidateAddress);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Deng hate şandin (Vote Submitted)',
            description: 'Denga we ji bo berjewendî hate şandin (Your vote for the candidate has been submitted)',
          });

          setUserPresidentialVote(candidateAddress);
          fetchPresidentialCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error voting for president:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina dengê de (Error submitting vote)',
        variant: 'destructive'
      });
    }
  };

  const fetchUserVotes = async () => {
    if (!api || !isApiReady || !selectedAccount) return;

    try {
      // Fetch legislation votes
      const legislationVotes = await api.query.welati.legislationVotes.entries(selectedAccount.address);
      const legVotes = new Map<number, boolean>();
      legislationVotes.forEach(([key, value]) => {
        const proposalId = key.args[1].toNumber();
        const support = value.toJSON() as boolean;
        legVotes.set(proposalId, support);
      });
      setUserLegislationVotes(legVotes);

      // Fetch parliament vote
      const parliamentVote = await api.query.welati.parliamentVotes(selectedAccount.address);
      if (!parliamentVote.isEmpty) {
        setUserParliamentVote(parliamentVote.toString());
      }

      // Fetch presidential vote
      const presidentialVote = await api.query.welati.presidentialVotes(selectedAccount.address);
      if (!presidentialVote.isEmpty) {
        setUserPresidentialVote(presidentialVote.toString());
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching user votes:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-500';
      case 'Passed':
        return 'bg-green-500';
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Clock className="h-4 w-4" />;
      case 'Passed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 via-white to-red-600 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="text-gray-700 font-medium">Deriyê Hikûmetê tê barkirin... (Loading Government Portal...)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-white to-red-600">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/citizens')}
            variant="outline"
            className="bg-red-600 hover:bg-red-700 border-yellow-400 border-2 text-white font-semibold shadow-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vegere Portala Welatiyên (Back to Citizens Portal)
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-green-700 mb-3 drop-shadow-lg">
            Deriyê Hikûmetê (Government Entrance)
          </h1>
          <p className="text-xl text-gray-800 font-semibold drop-shadow-md">
            Beşdariya Demokratîk (Democratic Participation)
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/90 backdrop-blur">
            <TabsTrigger value="legislation" className="text-lg font-semibold text-gray-800 hover:text-gray-900 hover:bg-gray-100 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:hover:bg-green-700">
              <FileText className="h-5 w-5 mr-2" />
              Yasalar (Legislation)
            </TabsTrigger>
            <TabsTrigger value="parliament" className="text-lg font-semibold text-gray-800 hover:text-gray-900 hover:bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:hover:bg-blue-700">
              <Users className="h-5 w-5 mr-2" />
              Parleman (Parliament)
            </TabsTrigger>
            <TabsTrigger value="president" className="text-lg font-semibold text-gray-800 hover:text-gray-900 hover:bg-gray-100 data-[state=active]:bg-yellow-600 data-[state=active]:text-white data-[state=active]:hover:bg-yellow-700">
              <Crown className="h-5 w-5 mr-2" />
              Serok (President)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: LEGISLATION */}
          <TabsContent value="legislation" className="space-y-6">
            <div className="flex justify-center mb-6">
              <Button
                onClick={() => setShowProposeModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 text-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Pêşniyareke Nû (New Proposal)
              </Button>
            </div>

            <div className="space-y-4">
              {proposals.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-600 text-lg">
                      Tu pêşniyar nehat dîtin (No proposals found)
                    </p>
                  </CardContent>
                </Card>
              ) : (
                proposals.map(proposal => (
                  <Card key={proposal.id} className="bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl text-gray-900 mb-2">{proposal.title}</CardTitle>
                          <CardDescription className="text-sm text-gray-600">
                            Proposal #{proposal.id} • Block #{proposal.blockNumber}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(proposal.status)} text-white flex items-center gap-1`}>
                          {getStatusIcon(proposal.status)}
                          {proposal.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{proposal.description}</p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userLegislationVotes.get(proposal.id) === true ? 'default' : 'outline'}
                            className={userLegislationVotes.get(proposal.id) === true ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => handleVoteOnLegislation(proposal.id, true)}
                            disabled={userLegislationVotes.has(proposal.id) || proposal.status !== 'Active'}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Piştgirî (Support): {proposal.supportVotes}
                          </Button>
                          <Button
                            size="sm"
                            variant={userLegislationVotes.get(proposal.id) === false ? 'default' : 'outline'}
                            className={userLegislationVotes.get(proposal.id) === false ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => handleVoteOnLegislation(proposal.id, false)}
                            disabled={userLegislationVotes.has(proposal.id) || proposal.status !== 'Active'}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Dijberî (Oppose): {proposal.opposeVotes}
                          </Button>
                        </div>
                        {userLegislationVotes.has(proposal.id) && (
                          <p className="text-sm text-gray-600 italic">
                            Hûn berê deng dane (You already voted)
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 2: PARLIAMENT */}
          <TabsContent value="parliament" className="space-y-6">
            <div className="flex justify-center mb-6">
              <Button
                onClick={() => setShowNominateParliamentModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 text-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Berjewendî Bike (Nominate Candidate)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parliamentCandidates.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur col-span-2">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-600 text-lg">
                      Tu berjewendî nehat dîtin (No candidates found)
                    </p>
                  </CardContent>
                </Card>
              ) : (
                parliamentCandidates.map(candidate => (
                  <Card key={candidate.address} className="bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">
                        {candidate.address.slice(0, 10)}...{candidate.address.slice(-8)}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Nominated by: {candidate.nominator.slice(0, 10)}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Vote className="h-5 w-5 text-purple-600" />
                          <span className="text-lg font-bold text-gray-900">{candidate.voteCount} deng (votes)</span>
                        </div>
                        <Button
                          size="sm"
                          variant={userParliamentVote === candidate.address ? 'default' : 'outline'}
                          className={userParliamentVote === candidate.address ? 'bg-purple-600 hover:bg-purple-700' : ''}
                          onClick={() => handleVoteForParliament(candidate.address)}
                          disabled={userParliamentVote !== null}
                        >
                          {userParliamentVote === candidate.address ? 'Deng da (Voted)' : 'Deng bide (Vote)'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 3: PRESIDENT */}
          <TabsContent value="president" className="space-y-6">
            <div className="flex justify-center mb-6">
              <Button
                onClick={() => setShowNominatePresidentModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 text-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Berjewendî Bike (Nominate Candidate)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presidentialCandidates.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur col-span-2">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-600 text-lg">
                      Tu berjewendî nehat dîtin (No candidates found)
                    </p>
                  </CardContent>
                </Card>
              ) : (
                presidentialCandidates.map(candidate => (
                  <Card key={candidate.address} className="bg-white/95 backdrop-blur hover:shadow-lg transition-shadow border-2 border-yellow-400">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        {candidate.address.slice(0, 10)}...{candidate.address.slice(-8)}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Nominated by: {candidate.nominator.slice(0, 10)}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Vote className="h-5 w-5 text-red-600" />
                          <span className="text-lg font-bold text-gray-900">{candidate.voteCount} deng (votes)</span>
                        </div>
                        <Button
                          size="sm"
                          variant={userPresidentialVote === candidate.address ? 'default' : 'outline'}
                          className={userPresidentialVote === candidate.address ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => handleVoteForPresident(candidate.address)}
                          disabled={userPresidentialVote !== null}
                        >
                          {userPresidentialVote === candidate.address ? 'Deng da (Voted)' : 'Deng bide (Vote)'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Access Verification Modal */}
        <Dialog open={showAccessModal} onOpenChange={setShowAccessModal}>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-700 via-white to-red-600">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-900">
                🔒 Kontrola Gihîştinê (Access Verification)
              </DialogTitle>
              <DialogDescription className="text-gray-800 font-medium">
                Ji kerema xwe Citizenship ID-ya xwe binivîse da ku gihîştina xwe bipejirînin
                (Please enter your Citizenship ID to verify your access)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">
                  Citizenship ID
                </label>
                <Input
                  type="text"
                  placeholder="Citizenship ID-ya xwe li vir binivîse (Enter your Citizenship ID here)"
                  value={inputCitizenId}
                  onChange={(e) => setInputCitizenId(e.target.value)}
                  className="bg-white border-2 border-blue-400 text-gray-900 placeholder:text-gray-500"
                  disabled={isVerifying}
                />
              </div>
              <div className="bg-yellow-100 border-l-4 border-yellow-600 p-3 rounded">
                <p className="text-sm text-yellow-900 font-medium">
                  ⚠️ Tenê xwedîyên Tiki-yên hikûmetê dikarin vê rûpelê bigihînin
                  (Only government Tiki holders can access this page)
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAccessModal(false);
                  navigate('/citizens');
                }}
                disabled={isVerifying}
                className="border-2 border-gray-400 hover:bg-gray-100"
              >
                Betal bike (Cancel)
              </Button>
              <Button
                onClick={handleVerifyAccess}
                disabled={isVerifying || !inputCitizenId.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Kontrolkirin... (Verifying...)
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Doğrula (Verify)
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Propose Legislation Modal */}
        <Dialog open={showProposeModal} onOpenChange={setShowProposeModal}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-green-700 via-white to-red-600">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-700">
                Pêşniyareke Nû (New Proposal)
              </DialogTitle>
              <DialogDescription className="text-gray-700">
                Pêşniyareke yasayê bike (Propose new legislation)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-gray-800 mb-2 block">
                  Sernav (Title)
                </label>
                <Input
                  type="text"
                  placeholder="Sernava pêşniyarê binivîse... (Enter proposal title...)"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 mb-2 block">
                  Şirove (Description)
                </label>
                <Textarea
                  placeholder="Pêşniyara xwe bi berfirehî rave bikin... (Describe your proposal in detail...)"
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleProposeLegislation}
                disabled={isProposing || !proposalTitle.trim() || !proposalDescription.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
              >
                {isProposing ? 'Tê şandin... (Submitting...)' : 'Şandin (Submit)'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Nominate Parliament Modal */}
        <Dialog open={showNominateParliamentModal} onOpenChange={setShowNominateParliamentModal}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-green-700 via-white to-red-600">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-purple-700">
                Berjewendî bike ji bo Parlamentê (Nominate for Parliament)
              </DialogTitle>
              <DialogDescription className="text-gray-700">
                Navnîşana berjewendî binivîse (Enter candidate address)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-gray-800 mb-2 block">
                  Navnîşana Berjewendî (Candidate Address)
                </label>
                <Input
                  type="text"
                  placeholder="5D..."
                  value={parliamentNomineeAddress}
                  onChange={(e) => setParliamentNomineeAddress(e.target.value)}
                />
              </div>

              <Button
                onClick={handleNominateParliament}
                disabled={isNominatingParliament || !parliamentNomineeAddress.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
              >
                {isNominatingParliament ? 'Tê şandin... (Submitting...)' : 'Berjewendî bike (Nominate)'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Nominate President Modal */}
        <Dialog open={showNominatePresidentModal} onOpenChange={setShowNominatePresidentModal}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-green-700 via-white to-red-600">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-700">
                Berjewendî bike ji bo Serokbûnê (Nominate for President)
              </DialogTitle>
              <DialogDescription className="text-gray-700">
                Navnîşana berjewendî binivîse (Enter candidate address)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-gray-800 mb-2 block">
                  Navnîşana Berjewendî (Candidate Address)
                </label>
                <Input
                  type="text"
                  placeholder="5D..."
                  value={presidentNomineeAddress}
                  onChange={(e) => setPresidentNomineeAddress(e.target.value)}
                />
              </div>

              <Button
                onClick={handleNominatePresident}
                disabled={isNominatingPresident || !presidentNomineeAddress.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
              >
                {isNominatingPresident ? 'Tê şandin... (Submitting...)' : 'Berjewendî bike (Nominate)'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
