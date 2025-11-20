import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Info, TrendingUp, Users, Award } from 'lucide-react';

const DelegateProfile: React.FC = () => {
  const { t } = useTranslation();
  const [isDelegate, setIsDelegate] = useState(false);
  const [profileData, setProfileData] = useState({
    statement: '',
    expertise: [],
    commitments: '',
    website: '',
    twitter: '',
    acceptingDelegations: true,
    minDelegation: '100',
    maxDelegation: '100000'
  });

  const expertiseOptions = [
    'Treasury Management',
    'Technical Development',
    'Community Building',
    'Governance Design',
    'Security',
    'Economics',
    'Marketing',
    'Legal'
  ];

  const handleBecomeDelegate = () => {
    setIsDelegate(true);
    if (import.meta.env.DEV) console.log('Becoming a delegate with:', profileData);
  };

  if (!isDelegate) {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle>{t('delegation.becomeDelegate')}</CardTitle>
          <CardDescription>
            {t('delegation.becomeDelegateDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50 text-gray-900">
            <Info className="w-4 h-4 text-gray-900" />
            <AlertDescription className="text-gray-900">
              {t('delegation.delegateRequirements')}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold mb-1">{t('delegation.buildReputation')}</h4>
                <p className="text-sm text-gray-600">{t('delegation.buildReputationDesc')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                <h4 className="font-semibold mb-1">{t('delegation.earnTrust')}</h4>
                <p className="text-sm text-gray-600">{t('delegation.earnTrustDesc')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <h4 className="font-semibold mb-1">{t('delegation.getRewards')}</h4>
                <p className="text-sm text-gray-600">{t('delegation.getRewardsDesc')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="statement">{t('delegation.delegateStatement')}</Label>
              <Textarea
                id="statement"
                placeholder={t('delegation.statementPlaceholder')}
                value={profileData.statement}
                onChange={(e) => setProfileData({...profileData, statement: e.target.value})}
                rows={4}
              />
            </div>

            <div>
              <Label>{t('delegation.expertise')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {expertiseOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfileData({
                            ...profileData,
                            expertise: [...profileData.expertise, option]
                          });
                        } else {
                          setProfileData({
                            ...profileData,
                            expertise: profileData.expertise.filter(e => e !== option)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="commitments">{t('delegation.commitments')}</Label>
              <Textarea
                id="commitments"
                placeholder={t('delegation.commitmentsPlaceholder')}
                value={profileData.commitments}
                onChange={(e) => setProfileData({...profileData, commitments: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">{t('delegation.website')}</Label>
                <Input
                  id="website"
                  placeholder="https://..."
                  value={profileData.website}
                  onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="twitter">{t('delegation.twitter')}</Label>
                <Input
                  id="twitter"
                  placeholder="@username"
                  value={profileData.twitter}
                  onChange={(e) => setProfileData({...profileData, twitter: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minDelegation">{t('delegation.minDelegation')}</Label>
                <Input
                  id="minDelegation"
                  type="number"
                  placeholder="Min HEZ"
                  value={profileData.minDelegation}
                  onChange={(e) => setProfileData({...profileData, minDelegation: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="maxDelegation">{t('delegation.maxDelegation')}</Label>
                <Input
                  id="maxDelegation"
                  type="number"
                  placeholder="Max HEZ"
                  value={profileData.maxDelegation}
                  onChange={(e) => setProfileData({...profileData, maxDelegation: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="accepting">{t('delegation.acceptingDelegations')}</Label>
                <p className="text-sm text-gray-600">{t('delegation.acceptingDesc')}</p>
              </div>
              <Switch
                id="accepting"
                checked={profileData.acceptingDelegations}
                onCheckedChange={(checked) => 
                  setProfileData({...profileData, acceptingDelegations: checked})
                }
              />
            </div>
          </div>

          <Button 
            onClick={handleBecomeDelegate}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={!profileData.statement || profileData.expertise.length === 0}
          >
            {t('delegation.activateDelegate')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('delegation.yourDelegateProfile')}
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="border-green-200 bg-green-50 mb-6 text-gray-900">
          <CheckCircle className="w-4 h-4 text-gray-900" />
          <AlertDescription className="text-gray-900">
            {t('delegation.delegateActive')}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">{t('delegation.delegators')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">0 HEZ</div>
              <div className="text-sm text-gray-600">{t('delegation.totalReceived')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">0%</div>
              <div className="text-sm text-gray-600">{t('delegation.successRate')}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{t('delegation.yourStatement')}</h4>
            <p className="text-gray-700">{profileData.statement}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('delegation.yourExpertise')}</h4>
            <div className="flex flex-wrap gap-2">
              {profileData.expertise.map((exp) => (
                <Badge key={exp} variant="secondary">{exp}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('delegation.delegationLimits')}</h4>
            <p className="text-gray-700">
              Min: {profileData.minDelegation} HEZ | Max: {profileData.maxDelegation} HEZ
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline">
            {t('delegation.editProfile')}
          </Button>
          <Button variant="outline">
            {t('delegation.pauseDelegations')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DelegateProfile;