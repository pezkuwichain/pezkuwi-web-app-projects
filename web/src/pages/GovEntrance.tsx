import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  ArrowLeft,
  Vote,
  Users,
  FileText,
  Scale,
  Megaphone,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GovEntrance() {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const { nftDetails, kycStatus, loading: dashboardLoading } = useDashboard();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkGovernmentRole();
  }, [nftDetails, dashboardLoading]);

  const checkGovernmentRole = () => {
    if (dashboardLoading) {
      setLoading(true);
      return;
    }

    // Check if user has government role NFT
    const hasGovernmentRole = nftDetails.roleNFTs.some(nft => {
      // Check if NFT is a government role (collection 42, items 10-99 are government roles)
      return nft.collectionId === 42 && nft.itemId >= 10 && nft.itemId < 100;
    });

    if (!hasGovernmentRole) {
      toast({
        title: "Mafê Te Tuneye (No Access)",
        description: "Divê hûn xwedîyê Rola Hikûmetê bin ku vê rûpelê bigihînin (You must have a Government Role to access this page)",
        variant: "destructive"
      });
      navigate('/citizens');
      return;
    }

    setLoading(false);
  };

  const handleFeatureClick = (feature: string) => {
    toast({
      title: "Çalakiyê di bin nîgehdariyek de ye (Under Development)",
      description: `${feature} nûve tê avakirin (${feature} is currently under development)`,
    });
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

  // Show government portal
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

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-red-700 mb-3 drop-shadow-lg">
            🏛️ Deriyê Hikûmetê (Government Entrance)
          </h1>
          <p className="text-xl text-gray-800 font-semibold drop-shadow-md mb-2">
            Beşdariya Demokratîk (Democratic Participation)
          </p>
          <p className="text-base text-gray-700">
            Mafên xwe yên demokratîk bi kar bînin û di rêveberiya welêt de beşdar bibin
          </p>
          <p className="text-sm text-gray-600 italic">
            (Exercise your democratic rights and participate in governance)
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* 1. Elections - Hilbijartinên (Elections) */}
          <Card
            className="bg-white/95 backdrop-blur border-2 border-blue-400 hover:border-blue-600 transition-all shadow-xl cursor-pointer group hover:scale-105"
            onClick={() => handleFeatureClick('Hilbijartinên (Elections)')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-blue-500 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Vote className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  Aktîf (Active)
                </Badge>
              </div>
              <CardTitle className="text-2xl text-blue-800">Hilbijartinên</CardTitle>
              <CardDescription className="text-gray-600">(Elections & Voting)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Hilbijartina Serok (Presidential Election)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Hilbijartina Parlamentoyê (Parliamentary Elections)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Hilbijartina Serokê Meclisê (Speaker Election)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Dadgeha Destûrî (Constitutional Court)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 2. Candidacy - Berjewendî (Candidacy) */}
          <Card
            className="bg-white/95 backdrop-blur border-2 border-green-400 hover:border-green-600 transition-all shadow-xl cursor-pointer group hover:scale-105"
            onClick={() => handleFeatureClick('Berjewendî (Candidacy)')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-green-500 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  Mafên Te (Your Rights)
                </Badge>
              </div>
              <CardTitle className="text-2xl text-green-800">Berjewendî</CardTitle>
              <CardDescription className="text-gray-600">(Run for Office)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Bibe Berjewendiyê Serokbûnê (Presidential Candidate)</span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Bibe Parlementêr (Parliamentary Candidate)</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-yellow-700">Pêdiviya Trust Score: 300-750</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-yellow-700">Piştgiriya pêwîst: 100-1000 endorsements</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. Proposals - Pêşniyar (Legislative Proposals) */}
          <Card
            className="bg-white/95 backdrop-blur border-2 border-purple-400 hover:border-purple-600 transition-all shadow-xl cursor-pointer group hover:scale-105"
            onClick={() => handleFeatureClick('Pêşniyar (Proposals)')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-purple-500 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                  Yasayan (Legislative)
                </Badge>
              </div>
              <CardTitle className="text-2xl text-purple-800">Pêşniyar</CardTitle>
              <CardDescription className="text-gray-600">(Submit Proposals)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <FileText className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Pêşniyarên Yasayê (Legislative Proposals)</span>
                </li>
                <li className="flex items-start">
                  <FileText className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Guheztinên Destûrî (Constitutional Amendments)</span>
                </li>
                <li className="flex items-start">
                  <FileText className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Pêşniyarên Budçeyê (Budget Proposals)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Voting on Proposals - Dengdayîn (Vote on Proposals) */}
          <Card
            className="bg-white/95 backdrop-blur border-2 border-orange-400 hover:border-orange-600 transition-all shadow-xl cursor-pointer group hover:scale-105"
            onClick={() => handleFeatureClick('Dengdayîn (Voting)')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-orange-500 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                  Parlamenter (MPs Only)
                </Badge>
              </div>
              <CardTitle className="text-2xl text-orange-800">Dengdayîn</CardTitle>
              <CardDescription className="text-gray-600">(Parliamentary Voting)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Erê (Aye)</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Na (Nay)</span>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Bêalî (Abstain)</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-blue-700">Majority types: Simple (50%+1), Super (2/3), Absolute (3/4)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 5. Veto & Override - Veto û Têperbûn (Veto System) */}
          <Card
            className="bg-white/95 backdrop-blur border-2 border-red-400 hover:border-red-600 transition-all shadow-xl cursor-pointer group hover:scale-105"
            onClick={() => handleFeatureClick('Veto û Têperbûn (Veto System)')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-red-500 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                  Serok (President)
                </Badge>
              </div>
              <CardTitle className="text-2xl text-red-800">Veto û Têperbûn</CardTitle>
              <CardDescription className="text-gray-600">(Veto & Override)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Vetoya Serok (Presidential Veto)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Têperbûna Parlamentoyê (Parliamentary Override - 2/3)</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-yellow-700">Pêdiviya 134 deng ji 201 (Requires 134 of 201 votes)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 6. Government Appointments - Tayinên Hikûmetê (Official Appointments) */}
          <Card
            className="bg-white/95 backdrop-blur border-2 border-indigo-400 hover:border-indigo-600 transition-all shadow-xl cursor-pointer group hover:scale-105"
            onClick={() => handleFeatureClick('Tayinên Hikûmetê (Appointments)')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-indigo-500 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Megaphone className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                  Wezîr (Ministers)
                </Badge>
              </div>
              <CardTitle className="text-2xl text-indigo-800">Tayinên Hikûmetê</CardTitle>
              <CardDescription className="text-gray-600">(Government Officials)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Wezîrên Kabîneyê (Cabinet Ministers)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Dadger, Xezinedar, Noter (Judges, Treasury, Notary)</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-yellow-700">Piştgiriya Serok pêwîst e (Presidential approval required)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <Card className="bg-gradient-to-r from-green-50 to-red-50 border-2 border-yellow-400 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800 flex items-center">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
              Statûya Te ya Welatîbûnê (Your Citizenship Status)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">KYC Status</p>
                <div className="flex items-center">
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {kycStatus}
                  </Badge>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Mafên Dengdayînê (Voting Rights)</p>
                <div className="flex items-center">
                  <Badge className="bg-blue-500 text-white">
                    <Vote className="h-3 w-3 mr-1" />
                    Aktîf (Active)
                  </Badge>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Beşdariya Rêveberiyê (Participation)</p>
                <div className="flex items-center">
                  <Badge className="bg-purple-500 text-white">
                    <Users className="h-3 w-3 mr-1" />
                    Amade (Ready)
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Bala xwe bidin (Important):</strong> Hemû mafên welatîbûnê yên te çalak in.
                Tu dikarî di hemû hilbijartinên demokratîk de beşdar bibî û deng bidî.
                <br />
                <span className="italic text-xs">
                (All your citizenship rights are active. You can participate and vote in all democratic elections.)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
