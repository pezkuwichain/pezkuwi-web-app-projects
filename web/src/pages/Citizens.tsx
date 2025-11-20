import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { FileText, Building2, Home, Bell, ChevronLeft, ChevronRight, Upload, User, Sun, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { getCitizenSession } from '@pezkuwi/lib/citizenship-workflow';
import { getUserRoleCategories } from '@pezkuwi/lib/tiki';
import { supabase } from '@/lib/supabase';

// Mock announcements data
const announcements = [
  {
    id: 1,
    title: "Bijî Azadiya Kurdistanê! (Long Live Free Kurdistan!)",
    description: "Bi serkeftina sîstema me ya dijîtal, em gaveke din li pêşiya azadiya xwe datînin. (With the success of our digital system, we take another step towards our freedom.)",
    date: "2025-01-19"
  },
  {
    id: 2,
    title: "Daxuyaniya Nû ya Hikûmetê (New Government Announcement)",
    description: "Pergalên nû yên xizmetguzariya dijîtal ji bo hemû welatiyan aktîv bûn. (New digital service systems have been activated for all citizens.)",
    date: "2025-01-18"
  },
  {
    id: 3,
    title: "Civîna Giştî ya Welatiyên (Citizens General Assembly)",
    description: "Civîna mehane ya welatiyên di 25ê vê mehê de pêk tê. Beşdarî bibin! (Monthly citizens assembly takes place on the 25th of this month. Participate!)",
    date: "2025-01-17"
  }
];

export default function Citizens() {
  const { selectedAccount } = usePolkadot();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, nftDetails, citizenNumber, loading } = useDashboard();
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGovDialog, setShowGovDialog] = useState(false);
  const [showCitizensDialog, setShowCitizensDialog] = useState(false);
  const [citizenNumberInput, setCitizenNumberInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [dialogType, setDialogType] = useState<'gov' | 'citizens'>('gov');

  useEffect(() => {
    if (profile?.avatar_url) {
      setPhotoUrl(profile.avatar_url);
    }
  }, [profile]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !user) return;

    const file = event.target.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Dosya hatası (File error)",
        description: "Lütfen resim dosyası yükleyin (Please upload an image file)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Dosya çok büyük (File too large)",
        description: "Maksimum dosya boyutu 5MB (Maximum file size is 5MB)",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;

        // Update profile with data URL (for now - until storage bucket is created)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: dataUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setPhotoUrl(dataUrl);
        setUploadingPhoto(false);
        toast({
          title: "Fotoğraf yüklendi (Photo uploaded)",
          description: "Profil fotoğrafınız başarıyla güncellendi (Your profile photo has been updated successfully)"
        });
      };

      reader.onerror = () => {
        setUploadingPhoto(false);
        toast({
          title: "Yükleme hatası (Upload error)",
          description: "Fotoğraf okunamadı (Could not read photo)",
          variant: "destructive"
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Photo upload error:', error);
      setUploadingPhoto(false);
      toast({
        title: "Yükleme hatası (Upload error)",
        description: error instanceof Error ? error.message : "Fotoğraf yüklenemedi (Could not upload photo)",
        variant: "destructive"
      });
    }
  };

  // Handle case where no wallet is connected
  if (!selectedAccount && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 via-white to-red-600 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-xl font-bold text-red-700">Ji kerema xwe re Wallet-ê xwe girêbide</p>
              <p className="text-lg text-gray-700">(Please connect your wallet)</p>
              <Button
                onClick={() => navigate('/')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Home className="mr-2 h-4 w-4" />
                Vegere Malê (Back to Home)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCitizensIssue = () => {
    // Check if user has Tiki NFT
    if (!nftDetails.citizenNFT) {
      toast({
        title: "Mafê Te Tuneye (No Access)",
        description: "Divê hûn xwedîyê Tiki NFT bin ku vê rûpelê bigihînin (You must own a Tiki NFT to access this page)",
        variant: "destructive"
      });
      return;
    }

    // Show citizen number verification dialog for Citizens Issues
    setDialogType('citizens');
    setShowCitizensDialog(true);
  };

  const handleGovEntrance = () => {
    // Check if user has Tiki NFT
    if (!nftDetails.citizenNFT) {
      toast({
        title: "Mafê Te Tuneye (No Access)",
        description: "Divê hûn xwedîyê Tiki NFT bin ku vê rûpelê bigihînin (You must own a Tiki NFT to access this page)",
        variant: "destructive"
      });
      return;
    }

    // Show citizen number verification dialog for Government
    setDialogType('gov');
    setShowGovDialog(true);
  };

  const handleVerifyCitizenNumber = () => {
    setIsVerifying(true);

    // Construct the full citizen number format: #42-0-123456
    const actualCitizenNumber = nftDetails.citizenNFT
      ? `#${nftDetails.citizenNFT.collectionId}-${nftDetails.citizenNFT.itemId}-${citizenNumber}`
      : '';

    // Clean and compare
    const inputCleaned = citizenNumberInput.trim().toUpperCase();

    if (inputCleaned === actualCitizenNumber.toUpperCase()) {
      setShowGovDialog(false);
      setShowCitizensDialog(false);
      setCitizenNumberInput('');

      if (dialogType === 'gov') {
        toast({
          title: "✅ Girêdayî Destûrdar (Authentication Successful)",
          description: "Hûn dikarin dest bi hikûmetê bikin (You can now access government portal)",
        });
        navigate('/citizens/government');
      } else {
        toast({
          title: "✅ Girêdayî Destûrdar (Authentication Successful)",
          description: "Hûn dikarin dest bi karên welatiyên bikin (You can now access citizens issues)",
        });
        navigate('/citizens/issues');
      }
    } else {
      toast({
        title: "❌ Hejmara Welatî Şaş e (Wrong Citizen Number)",
        description: "Hejmara welatîbûna ku hûn nivîsandiye rast nine (The citizen number you entered is incorrect)",
        variant: "destructive"
      });
    }

    setIsVerifying(false);
  };

  const nextAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
  };

  const prevAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 via-white to-red-600 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="text-gray-700 font-medium">Portala Welatiyên tê barkirin... (Loading Citizens Portal...)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get role categories for display
  const roleCategories = getUserRoleCategories(nftDetails.roleNFTs) || {
    government: [],
    citizen: [],
    business: [],
    judicial: []
  };
  if (import.meta.env.DEV) console.log('Role categories:', roleCategories);

  const currentAnnouncement = announcements[currentAnnouncementIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-white to-red-600">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-red-600 hover:bg-red-700 border-yellow-400 border-2 text-white font-semibold shadow-lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Vegere Malê (Back to Home)
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-red-700 mb-3 drop-shadow-lg">
            Portala Welatiyên (Citizen Portal)
          </h1>
          <p className="text-xl text-gray-800 font-semibold drop-shadow-md">
            Kurdistana Dijîtal (Digital Kurdistan)
          </p>
        </div>

        {/* Announcements Widget - Modern Carousel */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 rounded-3xl shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevAnnouncement}
                  className="z-10 text-white/80 hover:text-white transition-all hover:scale-110"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>

                <div className="flex-1 text-center px-6">
                  <div className="flex items-center justify-center mb-3">
                    <Bell className="h-7 w-7 text-white mr-3 animate-pulse" />
                    <h3 className="text-3xl font-bold text-white">Daxuyanî</h3>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{currentAnnouncement.title}</h4>
                  <p className="text-white/90 text-base leading-relaxed max-w-2xl mx-auto">{currentAnnouncement.description}</p>
                  <p className="text-white/70 text-sm mt-3">{currentAnnouncement.date}</p>

                  {/* Modern dots indicator */}
                  <div className="flex justify-center gap-3 mt-5">
                    {announcements.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentAnnouncementIndex(idx)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          idx === currentAnnouncementIndex
                            ? 'bg-white w-8'
                            : 'bg-white/40 w-2.5 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={nextAnnouncement}
                  className="z-10 text-white/80 hover:text-white transition-all hover:scale-110"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Entrance Cards - Grid with exactly 2 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* LEFT: Citizens Issues */}
          <Card
            className="bg-white/95 backdrop-blur border-4 border-purple-400 hover:border-purple-600 transition-all shadow-2xl cursor-pointer group hover:scale-105"
            onClick={handleCitizensIssue}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="mb-6">
                <div className="bg-purple-500 w-24 h-24 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <FileText className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-purple-700 mb-2 text-center">
                Karên Welatiyên
              </h2>
              <p className="text-lg text-gray-600 font-medium text-center">
                (Citizens Issues)
              </p>
            </CardContent>
          </Card>

          {/* RIGHT: Gov Entrance */}
          <Card
            className="bg-white/95 backdrop-blur border-4 border-green-400 hover:border-green-600 transition-all shadow-2xl cursor-pointer group hover:scale-105"
            onClick={handleGovEntrance}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="mb-6">
                <div className="bg-green-600 w-24 h-24 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <Building2 className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-green-700 mb-2 text-center">
                Deriyê Hikûmetê
              </h2>
              <p className="text-lg text-gray-600 font-medium text-center">
                (Gov. Entrance)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Digital Citizen ID Card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 shadow-2xl">
          <div className="relative">
            {/* Background card image */}
            <img
              src="/shared/digital_citizen_card.png"
              alt="Digital Citizen Card"
              className="w-full h-auto rounded-xl"
            />

            {/* Overlay content on the card */}
            <div className="absolute inset-0">
              {/* Left side - NFT ID box (below "NFT" text) */}
              <div className="absolute" style={{ left: '7%', top: '57%', width: '18%' }}>
                <div className="bg-white/10 backdrop-blur-sm rounded px-2 py-1 text-center">
                  <div className="text-[8px] font-semibold text-gray-800">NFT ID</div>
                  <div className="text-[11px] font-bold text-black">
                    {nftDetails.citizenNFT ? `#${nftDetails.citizenNFT.collectionId}-${nftDetails.citizenNFT.itemId}` : 'N/A'}
                  </div>
                  <div className="border-t border-gray-400 mt-0.5 pt-0.5">
                    <div className="text-[7px] text-gray-700">Citizen No</div>
                    <div className="text-[9px] font-semibold text-black">
                      {nftDetails.citizenNFT ? `#${nftDetails.citizenNFT.collectionId}-${nftDetails.citizenNFT.itemId}-${citizenNumber}` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle - Identity information (3 lines matching the gray bars) */}
              <div className="absolute" style={{ left: '30%', top: '40%', width: '38%' }}>
                <div className="flex flex-col">
                  <div className="px-2 py-0.5">
                    <div className="text-[7px] text-gray-600 uppercase tracking-wide">Name</div>
                    <div className="text-[10px] font-bold text-black truncate">{profile?.full_name || 'N/A'}</div>
                  </div>
                  <div className="px-2 py-0.5" style={{ marginTop: '30px' }}>
                    <div className="text-[7px] text-gray-600 uppercase tracking-wide">Father&apos;s Name</div>
                    <div className="text-[10px] font-bold text-black truncate">{profile?.father_name || 'N/A'}</div>
                  </div>
                  <div className="px-2 py-0.5" style={{ marginTop: '27px' }}>
                    <div className="text-[7px] text-gray-600 uppercase tracking-wide">Location</div>
                    <div className="text-[10px] font-bold text-black truncate">{profile?.location || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Right side - Photo placeholder */}
              <div className="absolute" style={{ right: '7%', top: '39%', width: '18%', height: '35%' }}>
                <div className="relative w-full h-full bg-white/10 backdrop-blur-sm border border-white/30 rounded overflow-hidden group">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Citizen Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white/50" />
                    </div>
                  )}
                  {/* Upload button overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="text-white text-[6px] px-1 py-0.5 h-auto"
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin h-3 w-3 border border-white rounded-full border-t-transparent"></div>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 mr-0.5" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Government Entrance - Citizen Number Verification Dialog */}
      <Dialog open={showGovDialog} onOpenChange={setShowGovDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-700 via-white to-red-600">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-red-700">
              <div className="flex items-center justify-center mb-4">
                <Sun className="h-16 w-16 text-yellow-500 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              Deriyê Hikûmetê (Government Entrance)
            </DialogTitle>
            <DialogDescription className="text-center text-gray-700 font-medium">
              Ji kerema xwe hejmara welatîbûna xwe binivîse
              <br />
              <span className="text-sm italic">(Please enter your citizen number)</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">
                Hejmara Welatîbûnê (Citizen Number)
              </label>
              <Input
                type="text"
                placeholder="#42-0-123456"
                value={citizenNumberInput}
                onChange={(e) => setCitizenNumberInput(e.target.value)}
                className="text-center font-mono text-lg border-2 border-green-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isVerifying) {
                    handleVerifyCitizenNumber();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleVerifyCitizenNumber}
              disabled={isVerifying || !citizenNumberInput.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              {isVerifying ? 'Kontrolkirina... (Verifying...)' : 'Daxelbûn (Enter)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Citizens Issues - Citizen Number Verification Dialog */}
      <Dialog open={showCitizensDialog} onOpenChange={setShowCitizensDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-700 via-white to-red-600">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-purple-700">
              <div className="flex items-center justify-center mb-4">
                <Sun className="h-16 w-16 text-yellow-500 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              Karên Welatiyên (Citizens Issues)
            </DialogTitle>
            <DialogDescription className="text-center text-gray-700 font-medium">
              Ji kerema xwe hejmara welatîbûna xwe binivîse
              <br />
              <span className="text-sm italic">(Please enter your citizen number)</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">
                Hejmara Welatîbûnê (Citizen Number)
              </label>
              <Input
                type="text"
                placeholder="#42-0-123456"
                value={citizenNumberInput}
                onChange={(e) => setCitizenNumberInput(e.target.value)}
                className="text-center font-mono text-lg border-2 border-purple-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isVerifying) {
                    handleVerifyCitizenNumber();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleVerifyCitizenNumber}
              disabled={isVerifying || !citizenNumberInput.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              {isVerifying ? 'Kontrolkirina... (Verifying...)' : 'Daxelbûn (Enter)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
