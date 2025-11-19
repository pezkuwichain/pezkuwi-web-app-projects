import React, { useState } from 'react';
import { useReferral } from '@/contexts/ReferralContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InviteUserModal } from './InviteUserModal';
import { Users, UserPlus, Trophy, Award, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ReferralDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { stats, myReferrals, loading } = useReferral();
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-green-500" />
            Referral System
          </h2>
          <p className="text-gray-400 mt-1">
            Invite friends to PezkuwiChain and earn trust score
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Friend
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Referral Count */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Total Referrals
            </CardTitle>
            <CardDescription className="text-gray-400">
              Confirmed referrals (KYC completed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">
              {stats?.referralCount ?? 0}
            </div>
          </CardContent>
        </Card>

        {/* Trust Score */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Trust Score
            </CardTitle>
            <CardDescription className="text-gray-400">
              Reputation score from referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-500">
              {stats?.referralScore ?? 0}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Max: 500 points
            </div>
          </CardContent>
        </Card>

        {/* Who Invited Me */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Invited By
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your referrer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.whoInvitedMe ? (
              <div className="text-sm font-mono text-blue-400 break-all">
                {stats.whoInvitedMe.slice(0, 8)}...{stats.whoInvitedMe.slice(-6)}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                No referrer
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Score Calculation</CardTitle>
          <CardDescription className="text-gray-400">
            How referrals contribute to your trust score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">1-10 referrals</span>
              <span className="text-green-400 font-semibold">10 points each</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">11-50 referrals</span>
              <span className="text-blue-400 font-semibold">100 + 5 points each</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">51-100 referrals</span>
              <span className="text-yellow-400 font-semibold">300 + 4 points each</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">101+ referrals</span>
              <span className="text-red-400 font-semibold">500 points (max)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Referrals List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            My Referrals ({myReferrals.length})
          </CardTitle>
          <CardDescription className="text-gray-400">
            Users you have successfully referred
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No referrals yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Invite friends to start building your network
              </p>
              <Button
                onClick={() => setShowInviteModal(true)}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Send First Invitation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myReferrals.map((address, index) => (
                <div
                  key={address}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center">
                      <span className="text-green-400 font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-mono text-white">
                        {address.slice(0, 10)}...{address.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        KYC Completed
                      </div>
                    </div>
                  </div>
                  <div className="text-green-400 text-sm font-semibold">
                    +{index < 10 ? 10 : index < 50 ? 5 : index < 100 ? 4 : 0} points
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Referral Notification */}
      {stats?.pendingReferral && (
        <Card className="bg-blue-900/20 border-blue-600/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">Pending Invitation</div>
                <div className="text-sm text-blue-300">
                  Complete KYC to confirm your referral from{' '}
                  <span className="font-mono">
                    {stats.pendingReferral.slice(0, 8)}...{stats.pendingReferral.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};
