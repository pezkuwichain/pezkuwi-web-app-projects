import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  ArrowLeft,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Search,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Crown,
  FileText,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Issue categories
const CATEGORIES = [
  { value: 'Governance', label: 'Rêveberî (Governance)', color: 'bg-blue-500' },
  { value: 'Security', label: 'Ewlehî (Security)', color: 'bg-red-500' },
  { value: 'Economy', label: 'Aborî (Economy)', color: 'bg-green-500' },
  { value: 'Infrastructure', label: 'Binesaz (Infrastructure)', color: 'bg-gray-500' },
  { value: 'Education', label: 'Perwerde (Education)', color: 'bg-purple-500' },
  { value: 'Healthcare', label: 'Tenduristî (Healthcare)', color: 'bg-pink-500' },
  { value: 'Environment', label: 'Jîngeh (Environment)', color: 'bg-emerald-500' },
  { value: 'Other', label: 'Din (Other)', color: 'bg-orange-500' }
];

// Issue statuses
const STATUSES = [
  { value: 'Pending', label: 'Li Benda (Pending)', color: 'bg-yellow-500' },
  { value: 'InProgress', label: 'Di Pêşketin de (In Progress)', color: 'bg-blue-500' },
  { value: 'Resolved', label: 'Çareser kirin (Resolved)', color: 'bg-green-500' },
  { value: 'Closed', label: 'Girtî (Closed)', color: 'bg-gray-500' }
];

interface Issue {
  id: number;
  submitter: string;
  description: string;
  category: string;
  status: string;
  supportVotes: number;
  opposeVotes: number;
  response?: string;
  blockNumber: number;
}

interface ParliamentCandidate {
  address: string;
  votes: number;
  isNominated: boolean;
}

interface PresidentCandidate {
  address: string;
  votes: number;
  isNominated: boolean;
}

interface LegislationProposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  supportVotes: number;
  opposeVotes: number;
  status: string;
  blockNumber: number;
}

export default function CitizensIssues() {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const {} = useAuth();
  const {} = useDashboard();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('issues');
  const [loading, setLoading] = useState(true);

  // Tab 1: Issues
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [userVotes, setUserVotes] = useState<Map<number, boolean>>(new Map());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [newIssueCategory, setNewIssueCategory] = useState('Governance');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab 2: Parliament
  const [parliamentCandidates, setParliamentCandidates] = useState<ParliamentCandidate[]>([]);
  const [userParliamentVote, setUserParliamentVote] = useState<string | null>(null);
  const [userParliamentNomination, setUserParliamentNomination] = useState<string | null>(null);
  const [showNominateParliamentModal, setShowNominateParliamentModal] = useState(false);
  const [nominateParliamentAddress, setNominateParliamentAddress] = useState('');

  // Tab 3: President
  const [presidentCandidates, setPresidentCandidates] = useState<PresidentCandidate[]>([]);
  const [userPresidentVote, setUserPresidentVote] = useState<string | null>(null);
  const [userPresidentNomination, setUserPresidentNomination] = useState<string | null>(null);
  const [showNominatePresidentModal, setShowNominatePresidentModal] = useState(false);
  const [nominatePresidentAddress, setNominatePresidentAddress] = useState('');

  // Tab 4: Legislation
  const [legislationProposals, setLegislationProposals] = useState<LegislationProposal[]>([]);
  const [userLegislationVotes, setUserLegislationVotes] = useState<Map<number, boolean>>(new Map());
  const [showProposeLegislationModal, setShowProposeLegislationModal] = useState(false);
  const [legislationTitle, setLegislationTitle] = useState('');
  const [legislationDescription, setLegislationDescription] = useState('');

  useEffect(() => {
    if (isApiReady && selectedAccount) {
      fetchAllData();

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiReady, selectedAccount, activeTab]);
     

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, categorystatussearchQuery]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'issues') {
        await fetchIssues();
        await fetchUserVotes();
      } else if (activeTab === 'parliament') {
        await fetchParliamentCandidates();
      } else if (activeTab === 'president') {
        await fetchPresidentCandidates();
      } else if (activeTab === 'legislation') {
        await fetchLegislationProposals();
      }
    } finally {
      setLoading(false);
    }
  };

  // ============= TAB 1: ISSUES =============

  const fetchIssues = async () => {
    if (!api || !isApiReady) return;

    try {
      // Check if welati pallet exists
      if (!api.query.welati) {
        if (import.meta.env.DEV) console.log('Welati pallet not available yet');
        setIssues([]);
        return;
      }

      const issueCountResult = await api.query.welati.issueCount();
      const issueCount = issueCountResult.toNumber();

      const fetchedIssues: Issue[] = [];
      for (let i = 0; i < issueCount; i++) {
        const issueOption = await api.query.welati.issues(i);
        if (!issueOption.isEmpty) {
          const issue = issueOption.unwrap();
          fetchedIssues.push({
            id: i,
            submitter: issue.submitter.toString(),
            description: issue.description.toString(),
            category: issue.category.toString(),
            status: issue.status.toString(),
            supportVotes: issue.supportVotes.toNumber(),
            opposeVotes: issue.opposeVotes.toNumber(),
            response: issue.response.isSome ? issue.response.unwrap().toString() : undefined,
            blockNumber: issue.blockNumber.toNumber()
          });
        }
      }

      setIssues(fetchedIssues.reverse());
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching issues:', error);
      setIssues([]);
    }
  };

  const fetchUserVotes = async () => {
    if (!api || !isApiReady || !selectedAccount) return;

    try {
      // Check if welati pallet exists
      if (!api.query.welati) {
        if (import.meta.env.DEV) console.log('Welati pallet not available yet');
        setUserVotes(new Map());
        return;
      }

      const votesEntries = await api.query.welati.issueVotes.entries(selectedAccount.address);
      const votes = new Map<number, boolean>();

      votesEntries.forEach(([key, value]) => {
        const issueId = key.args[1].toNumber();
        const support = value.toJSON() as boolean;
        votes.set(issueId, support);
      });

      setUserVotes(votes);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching user votes:', error);
      setUserVotes(new Map());
    }
  };

  const applyFilters = () => {
    let filtered = [...issues];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(issue =>
        issue.description.toLowerCase().includes(query)
      );
    }

    setFilteredIssues(filtered);
  };

  const handleSubmitIssue = async () => {
    if (!api || !selectedAccount || !newIssueDescription.trim()) return;

    setIsSubmitting(true);

    try {
      const tx = api.tx.welati.submitIssue(newIssueDescription, newIssueCategory);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Pirsgirêk hate şandin (Issue Submitted)',
            description: 'Pirsgirêka we bi serkeftî hate şandin (Your issue has been submitted successfully)',
          });

          setShowSubmitModal(false);
          setNewIssueDescription('');
          setNewIssueCategory('Governance');
          setIsSubmitting(false);
          fetchIssues();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error submitting issue:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina pirsgirêkê de (Error submitting issue)',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  const handleVote = async (issueId: number, support: boolean) => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.voteOnIssue(issueId, support);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Deng hate şandin (Vote Submitted)',
            description: support
              ? 'Hûn piştgiriya xwe nîşan da (You voted in support)'
              : 'Hûn dijberiya xwe nîşan da (You voted in opposition)',
          });

          setUserVotes(prev => new Map(prev).set(issueId, support));
          fetchIssues();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error voting:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina dengê de (Error submitting vote)',
        variant: 'destructive'
      });
    }
  };

  // ============= TAB 2: PARLIAMENT =============

  const fetchParliamentCandidates = async () => {
    if (!api || !isApiReady) return;

    try {
      // Check if welati pallet exists
      if (!api.query.welati) {
        if (import.meta.env.DEV) console.log('Welati pallet not available yet');
        setParliamentCandidates([]);
        return;
      }

      const candidatesEntries = await api.query.welati.parliamentCandidates.entries();
      const candidates: ParliamentCandidate[] = [];

      candidatesEntries.forEach(([key, value]) => {
        const address = key.args[0].toString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidateData: any = value.toJSON();
        candidates.push({
          address,
          votes: candidateData.votes || 0,
          isNominated: candidateData.isNominated || true
        });
      });

      setParliamentCandidates(candidates.sort((a, b) => b.votes - a.votes));

      // Check user's vote and nomination
      if (selectedAccount) {
        const userVoteResult = await api.query.welati.parliamentVotes(selectedAccount.address);
        if (!userVoteResult.isEmpty) {
          setUserParliamentVote(userVoteResult.toString());
        }

        const isNominated = candidates.some(c => c.address === selectedAccount.address);
        if (isNominated) {
          setUserParliamentNomination(selectedAccount.address);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching parliament candidates:', error);
      setParliamentCandidates([]);
    }
  };

  const handleSelfNominateParliament = async () => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.nominateForParliament(selectedAccount.address);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Namzedî hate şandin (Nomination Submitted)',
            description: 'Hûn bi serkeftî bûne namzed (You have successfully become a candidate)',
          });

          fetchParliamentCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error self-nominating for parliament:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina namzediyê de (Error submitting nomination)',
        variant: 'destructive'
      });
    }
  };

  const handleNominateParliament = async () => {
    if (!api || !selectedAccount || !nominateParliamentAddress.trim()) return;

    try {
      const tx = api.tx.welati.nominateForParliament(nominateParliamentAddress);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Namzedî hate şandin (Nomination Submitted)',
            description: 'Namzediya Parlamentoyê bi serkeftî hate şandin (Parliament nomination submitted successfully)',
          });

          setShowNominateParliamentModal(false);
          setNominateParliamentAddress('');
          fetchParliamentCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error nominating for parliament:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina namzediyê de (Error submitting nomination)',
        variant: 'destructive'
      });
    }
  };

  const handleVoteParliament = async (address: string) => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.voteForParliament(address);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Deng hate şandin (Vote Submitted)',
            description: 'Denga we ji bo Parlamentoyê hate şandin (Your vote for Parliament has been submitted)',
          });

          setUserParliamentVote(address);
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

  const handleRemoveParliamentNomination = async () => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.removeParliamentNomination(selectedAccount.address);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Namzedî hate jêbirin (Nomination Removed)',
            description: 'Namzediya we hate jêbirin (Your nomination has been removed)',
          });

          setUserParliamentNomination(null);
          fetchParliamentCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error removing parliament nomination:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di jêbirina namzediyê de (Error removing nomination)',
        variant: 'destructive'
      });
    }
  };

  // ============= TAB 3: PRESIDENT =============

  const fetchPresidentCandidates = async () => {
    if (!api || !isApiReady) return;

    try {
      // Check if welati pallet exists
      if (!api.query.welati) {
        if (import.meta.env.DEV) console.log('Welati pallet not available yet');
        setPresidentCandidates([]);
        return;
      }

      const candidatesEntries = await api.query.welati.presidentCandidates.entries();
      const candidates: PresidentCandidate[] = [];

      candidatesEntries.forEach(([key, value]) => {
        const address = key.args[0].toString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidateData: any = value.toJSON();
        candidates.push({
          address,
          votes: candidateData.votes || 0,
          isNominated: candidateData.isNominated || true
        });
      });

      setPresidentCandidates(candidates.sort((a, b) => b.votes - a.votes));

      // Check user's vote and nomination
      if (selectedAccount) {
        const userVoteResult = await api.query.welati.presidentVotes(selectedAccount.address);
        if (!userVoteResult.isEmpty) {
          setUserPresidentVote(userVoteResult.toString());
        }

        const isNominated = candidates.some(c => c.address === selectedAccount.address);
        if (isNominated) {
          setUserPresidentNomination(selectedAccount.address);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching president candidates:', error);
      setPresidentCandidates([]);
    }
  };

  const handleSelfNominatePresident = async () => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.nominateForPresident(selectedAccount.address);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Namzedî hate şandin (Nomination Submitted)',
            description: 'Hûn bi serkeftî bûne namzedê Serokê (You have successfully become a presidential candidate)',
          });

          fetchPresidentCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error self-nominating for president:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina namzediyê de (Error submitting nomination)',
        variant: 'destructive'
      });
    }
  };

  const handleNominatePresident = async () => {
    if (!api || !selectedAccount || !nominatePresidentAddress.trim()) return;

    try {
      const tx = api.tx.welati.nominateForPresident(nominatePresidentAddress);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Namzedî hate şandin (Nomination Submitted)',
            description: 'Namzediya Serokê bi serkeftî hate şandin (President nomination submitted successfully)',
          });

          setShowNominatePresidentModal(false);
          setNominatePresidentAddress('');
          fetchPresidentCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error nominating for president:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di şandina namzediyê de (Error submitting nomination)',
        variant: 'destructive'
      });
    }
  };

  const handleVotePresident = async (address: string) => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.voteForPresident(address);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Deng hate şandin (Vote Submitted)',
            description: 'Denga we ji bo Serokê hate şandin (Your vote for President has been submitted)',
          });

          setUserPresidentVote(address);
          fetchPresidentCandidates();
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

  const handleRemovePresidentNomination = async () => {
    if (!api || !selectedAccount) return;

    try {
      const tx = api.tx.welati.removePresidentNomination(selectedAccount.address);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Namzedî hate jêbirin (Nomination Removed)',
            description: 'Namzediya we hate jêbirin (Your nomination has been removed)',
          });

          setUserPresidentNomination(null);
          fetchPresidentCandidates();
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error removing president nomination:', error);
      toast({
        title: 'Xeletî (Error)',
        description: 'Pirsgirêk di jêbirina namzediyê de (Error removing nomination)',
        variant: 'destructive'
      });
    }
  };

  // ============= TAB 4: LEGISLATION =============

  const fetchLegislationProposals = async () => {
    if (!api || !isApiReady) return;

    try {
      // Check if welati pallet exists
      if (!api.query.welati) {
        if (import.meta.env.DEV) console.log('Welati pallet not available yet');
        setLegislationProposals([]);
        setUserLegislationVotes(new Map());
        return;
      }

      const proposalsEntries = await api.query.welati.legislationProposals.entries();
      const proposals: LegislationProposal[] = [];

      proposalsEntries.forEach(([key, value]) => {
        const proposalId = key.args[0].toNumber();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proposalData: any = value.toJSON();
        proposals.push({
          id: proposalId,
          proposer: proposalData.proposer,
          title: proposalData.title,
          description: proposalData.description,
          supportVotes: proposalData.supportVotes || 0,
          opposeVotes: proposalData.opposeVotes || 0,
          status: proposalData.status || 'Active',
          blockNumber: proposalData.blockNumber || 0
        });
      });

      setLegislationProposals(proposals.reverse());

      // Fetch user votes
      if (selectedAccount) {
        const votesEntries = await api.query.welati.legislationVotes.entries(selectedAccount.address);
        const votes = new Map<number, boolean>();

        votesEntries.forEach(([key, value]) => {
          const proposalId = key.args[1].toNumber();
          const support = value.toJSON() as boolean;
          votes.set(proposalId, support);
        });

        setUserLegislationVotes(votes);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching legislation proposals:', error);
      setLegislationProposals([]);
      setUserLegislationVotes(new Map());
    }
  };

  const handleProposeLegislation = async () => {
    if (!api || !selectedAccount || !legislationTitle.trim() || !legislationDescription.trim()) return;

    try {
      const tx = api.tx.welati.proposeLegislation(legislationTitle, legislationDescription);

      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          toast({
            title: '✅ Pêşniyar hate şandin (Proposal Submitted)',
            description: 'Pêşniyara Yasayê bi serkeftî hate şandin (Legislation proposal submitted successfully)',
          });

          setShowProposeLegislationModal(false);
          setLegislationTitle('');
          setLegislationDescription('');
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
    }
  };

  const handleVoteLegislation = async (proposalId: number, support: boolean) => {
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

  // ============= HELPER FUNCTIONS =============

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    return STATUSES.find(s => s.value === status)?.color || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'InProgress':
        return <AlertCircle className="h-4 w-4" />;
      case 'Resolved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading && activeTab === 'issues' && issues.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 via-white to-red-600 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="text-gray-700 font-medium">Pirsgirêkên Welatî tê barkirin... (Loading Citizens Issues...)</p>
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
          <h1 className="text-5xl md:text-6xl font-bold text-purple-700 mb-3 drop-shadow-lg">
            Karên Welatiyên (Citizens Portal)
          </h1>
          <p className="text-xl text-gray-800 font-semibold drop-shadow-md">
            Beşdarî rêveberiyê bibin (Participate in Governance)
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur mb-6">
            <TabsTrigger value="issues" className="text-gray-800 font-semibold hover:text-gray-900 hover:bg-gray-100 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:hover:bg-purple-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              Pirsgirêk (Issues)
            </TabsTrigger>
            <TabsTrigger value="parliament" className="text-gray-800 font-semibold hover:text-gray-900 hover:bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:hover:bg-blue-700">
              <Users className="h-4 w-4 mr-2" />
              Parleman (Parliament)
            </TabsTrigger>
            <TabsTrigger value="president" className="text-gray-800 font-semibold hover:text-gray-900 hover:bg-gray-100 data-[state=active]:bg-yellow-600 data-[state=active]:text-white data-[state=active]:hover:bg-yellow-700">
              <Crown className="h-4 w-4 mr-2" />
              Serok (President)
            </TabsTrigger>
            <TabsTrigger value="legislation" className="text-gray-800 font-semibold hover:text-gray-900 hover:bg-gray-100 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:hover:bg-green-700">
              <FileText className="h-4 w-4 mr-2" />
              Yasa (Legislation)
            </TabsTrigger>
          </TabsList>

          {/* ========== TAB 1: ISSUES ========== */}
          <TabsContent value="issues">
            {/* Submit Issue Button */}
            <div className="mb-6 flex justify-center">
              <Button
                onClick={() => setShowSubmitModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 text-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Pirsgirêkeke Nû Şandin (Submit New Issue)
              </Button>
            </div>

            {/* Filters */}
            <Card className="bg-white/95 backdrop-blur mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Kategorî (Category)
                    </label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hemû (All)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Hemû (All)</SelectItem>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Rewş (Status)
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hemû (All)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Hemû (All)</SelectItem>
                        {STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Lêgerîn (Search)
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Pirsgirêk bigere... (Search issues...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues List */}
            <div className="space-y-4">
              {filteredIssues.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-600 text-lg">
                      Tu pirsgirêk nehat dîtin (No issues found)
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredIssues.map(issue => (
                  <Card key={issue.id} className="bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getCategoryColor(issue.category)} text-white`}>
                              {CATEGORIES.find(c => c.value === issue.category)?.label}
                            </Badge>
                            <Badge className={`${getStatusColor(issue.status)} text-white flex items-center gap-1`}>
                              {getStatusIcon(issue.status)}
                              {STATUSES.find(s => s.value === issue.status)?.label}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs text-gray-500">
                            Pirsgirêk #{issue.id} • Block #{issue.blockNumber}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{issue.description}</p>

                      {issue.response && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-blue-800 mb-1">
                                Bersiva Hikûmetê (Government Response)
                              </p>
                              <p className="text-sm text-gray-700">{issue.response}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userVotes.get(issue.id) === true ? 'default' : 'outline'}
                            className={userVotes.get(issue.id) === true ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => handleVote(issue.id, true)}
                            disabled={userVotes.has(issue.id)}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {issue.supportVotes}
                          </Button>
                          <Button
                            size="sm"
                            variant={userVotes.get(issue.id) === false ? 'default' : 'outline'}
                            className={userVotes.get(issue.id) === false ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => handleVote(issue.id, false)}
                            disabled={userVotes.has(issue.id)}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            {issue.opposeVotes}
                          </Button>
                        </div>
                        {userVotes.has(issue.id) && (
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

            {/* Submit Issue Modal */}
            <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
              <DialogContent className="sm:max-w-lg bg-gradient-to-br from-green-700 via-white to-red-600">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-purple-700">
                    Pirsgirêkeke Nû Şandin (Submit New Issue)
                  </DialogTitle>
                  <DialogDescription className="text-gray-700">
                    Pirsgirêka xwe bi rêveberiyê re parve bikin (Share your concern with governance)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-2 block">
                      Kategorî (Category)
                    </label>
                    <Select value={newIssueCategory} onValueChange={setNewIssueCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-2 block">
                      Şiroveya Pirsgirêkê (Issue Description)
                    </label>
                    <Textarea
                      placeholder="Pirsgirêka xwe bi berfirehî rave bikin... (Describe your issue in detail...)"
                      value={newIssueDescription}
                      onChange={(e) => setNewIssueDescription(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitIssue}
                    disabled={isSubmitting || !newIssueDescription.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
                  >
                    {isSubmitting ? 'Tê şandin... (Submitting...)' : 'Şandin (Submit)'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ========== TAB 2: PARLIAMENT ========== */}
          <TabsContent value="parliament">
            <div className="mb-6 flex justify-center gap-4 flex-wrap">
              <Button
                onClick={handleSelfNominateParliament}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 text-lg"
                disabled={!selectedAccount}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Xwe Namzed bike (Become Candidate)
              </Button>
              <Button
                onClick={() => setShowNominateParliamentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 text-lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Kesekî Din Namzed bike (Nominate Someone)
              </Button>
              {userParliamentNomination && (
                <Button
                  onClick={handleRemoveParliamentNomination}
                  variant="outline"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 text-lg border-2"
                >
                  <UserMinus className="mr-2 h-5 w-5" />
                  Namzediyê Jêbibe (Remove Nomination)
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {parliamentCandidates.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-600 text-lg">
                      Tu namzed tune (No candidates found)
                    </p>
                  </CardContent>
                </Card>
              ) : (
                parliamentCandidates.map(candidate => (
                  <Card key={candidate.address} className="bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-mono text-sm text-gray-700 mb-2">
                            {candidate.address.slice(0, 10)}...{candidate.address.slice(-10)}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-600 text-white">
                              {candidate.votes} Deng (Votes)
                            </Badge>
                            {candidate.address === selectedAccount?.address && (
                              <Badge className="bg-yellow-500 text-white">
                                We (You)
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          {userParliamentVote ? (
                            <Button disabled variant="outline">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {userParliamentVote === candidate.address ? 'Dengdayî (Voted)' : 'Dengdayî (Already Voted)'}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleVoteParliament(candidate.address)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Deng bide (Vote)
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Nominate Parliament Modal */}
            <Dialog open={showNominateParliamentModal} onOpenChange={setShowNominateParliamentModal}>
              <DialogContent className="sm:max-w-lg bg-gradient-to-br from-green-700 via-white to-red-600">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-blue-700">
                    Namzedî bike ji bo Parlamentoyê (Nominate for Parliament)
                  </DialogTitle>
                  <DialogDescription className="text-gray-700">
                    Navnîşana namzedê binivîse (Enter candidate address)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Candidate address"
                    value={nominateParliamentAddress}
                    onChange={(e) => setNominateParliamentAddress(e.target.value)}
                    className="placeholder:text-gray-500 placeholder:opacity-50"
                  />
                  <Button
                    onClick={handleNominateParliament}
                    disabled={!nominateParliamentAddress.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                  >
                    Namzedî bike (Nominate)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ========== TAB 3: PRESIDENT ========== */}
          <TabsContent value="president">
            <div className="mb-6 flex justify-center gap-4 flex-wrap">
              <Button
                onClick={handleSelfNominatePresident}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 text-lg"
                disabled={!selectedAccount}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Xwe Namzed bike (Become Candidate)
              </Button>
              <Button
                onClick={() => setShowNominatePresidentModal(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 text-lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Kesekî Din Namzed bike (Nominate Someone)
              </Button>
              {userPresidentNomination && (
                <Button
                  onClick={handleRemovePresidentNomination}
                  variant="outline"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 text-lg border-2"
                >
                  <UserMinus className="mr-2 h-5 w-5" />
                  Namzediyê Jêbibe (Remove Nomination)
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {presidentCandidates.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-600 text-lg">
                      Tu namzed tune (No candidates found)
                    </p>
                  </CardContent>
                </Card>
              ) : (
                presidentCandidates.map(candidate => (
                  <Card key={candidate.address} className="bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-mono text-sm text-gray-700 mb-2">
                            {candidate.address.slice(0, 10)}...{candidate.address.slice(-10)}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-600 text-white">
                              {candidate.votes} Deng (Votes)
                            </Badge>
                            {candidate.address === selectedAccount?.address && (
                              <Badge className="bg-blue-500 text-white">
                                We (You)
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          {userPresidentVote ? (
                            <Button disabled variant="outline">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {userPresidentVote === candidate.address ? 'Dengdayî (Voted)' : 'Dengdayî (Already Voted)'}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleVotePresident(candidate.address)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Deng bide (Vote)
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Nominate President Modal */}
            <Dialog open={showNominatePresidentModal} onOpenChange={setShowNominatePresidentModal}>
              <DialogContent className="sm:max-w-lg bg-gradient-to-br from-green-700 via-white to-red-600">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-yellow-700">
                    Namzedî bike ji bo Serokê (Nominate for President)
                  </DialogTitle>
                  <DialogDescription className="text-gray-700">
                    Navnîşana namzedê binivîse (Enter candidate address)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Candidate address"
                    value={nominatePresidentAddress}
                    onChange={(e) => setNominatePresidentAddress(e.target.value)}
                    className="placeholder:text-gray-500 placeholder:opacity-50"
                  />
                  <Button
                    onClick={handleNominatePresident}
                    disabled={!nominatePresidentAddress.trim()}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3"
                  >
                    Namzedî bike (Nominate)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ========== TAB 4: LEGISLATION ========== */}
          <TabsContent value="legislation">
            <div className="mb-6 flex justify-center">
              <Button
                onClick={() => setShowProposeLegislationModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 text-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Pêşniyara Nû (New Proposal)
              </Button>
            </div>

            <div className="space-y-4">
              {legislationProposals.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-600 text-lg">
                      Tu pêşniyar tune (No proposals found)
                    </p>
                  </CardContent>
                </Card>
              ) : (
                legislationProposals.map(proposal => (
                  <Card key={proposal.id} className="bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-800">{proposal.title}</CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        Pêşniyar #{proposal.id} • Block #{proposal.blockNumber}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{proposal.description}</p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userLegislationVotes.get(proposal.id) === true ? 'default' : 'outline'}
                            className={userLegislationVotes.get(proposal.id) === true ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => handleVoteLegislation(proposal.id, true)}
                            disabled={userLegislationVotes.has(proposal.id)}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {proposal.supportVotes}
                          </Button>
                          <Button
                            size="sm"
                            variant={userLegislationVotes.get(proposal.id) === false ? 'default' : 'outline'}
                            className={userLegislationVotes.get(proposal.id) === false ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => handleVoteLegislation(proposal.id, false)}
                            disabled={userLegislationVotes.has(proposal.id)}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            {proposal.opposeVotes}
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

            {/* Propose Legislation Modal */}
            <Dialog open={showProposeLegislationModal} onOpenChange={setShowProposeLegislationModal}>
              <DialogContent className="sm:max-w-lg bg-gradient-to-br from-green-700 via-white to-red-600">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-green-700">
                    Pêşniyara Yasayê (Propose Legislation)
                  </DialogTitle>
                  <DialogDescription className="text-gray-700">
                    Pêşniyara yasaya nû bike (Submit a new legislation proposal)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-2 block">
                      Sernavê Yasayê (Legislation Title)
                    </label>
                    <Input
                      placeholder="Sernavê pêşniyarê binivîse... (Enter proposal title...)"
                      value={legislationTitle}
                      onChange={(e) => setLegislationTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-2 block">
                      Şirove (Description)
                    </label>
                    <Textarea
                      placeholder="Pêşniyara xwe bi berfirehî rave bikin... (Describe your proposal in detail...)"
                      value={legislationDescription}
                      onChange={(e) => setLegislationDescription(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleProposeLegislation}
                    disabled={!legislationTitle.trim() || !legislationDescription.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                  >
                    Pêşniyar bike (Propose)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
