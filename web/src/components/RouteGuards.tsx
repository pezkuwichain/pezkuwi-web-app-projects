// ========================================
// Route Guard Components
// ========================================
// Protected route wrappers that check user permissions

import React, { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkCitizenStatus,
  checkValidatorStatus,
  checkEducatorRole,
  checkModeratorRole,
} from '@pezkuwi/lib/guards';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Users, GraduationCap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

// ========================================
// LOADING COMPONENT
// ========================================

const LoadingGuard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Card className="bg-gray-900 border-gray-800 p-8">
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
          <p className="text-gray-400">Checking permissions...</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ========================================
// CITIZEN ROUTE GUARD
// ========================================

/**
 * CitizenRoute - Requires approved KYC (citizenship)
 * Use for: Voting, Education, Elections, etc.
 *
 * @example
 * <Route path="/vote" element={
 *   <CitizenRoute>
 *     <VotingPage />
 *   </CitizenRoute>
 * } />
 */
export const CitizenRoute: React.FC<RouteGuardProps> = ({
  children,
  fallbackPath = '/be-citizen',
}) => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const { user } = useAuth();
  const [isCitizen, setIsCitizen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!isApiReady || !api) {
        setLoading(true);
        return;
      }

      if (!selectedAccount?.address) {
        setIsCitizen(false);
        setLoading(false);
        return;
      }

      try {
        const citizenStatus = await checkCitizenStatus(api, selectedAccount.address);
        setIsCitizen(citizenStatus);
      } catch (error) {
        console.error('Citizen check failed:', error);
        setIsCitizen(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [api, isApiReady, selectedAccount]);

  // Loading state
  if (loading || !isApiReady) {
    return <LoadingGuard />;
  }

  // Not connected to wallet
  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <Users className="w-16 h-16 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">Wallet Not Connected</h2>
              <p className="text-gray-400">
                Please connect your Polkadot wallet to access this feature.
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-green-600 hover:bg-green-700"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not a citizen
  if (isCitizen === false) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Authorized
  return <>{children}</>;
};

// ========================================
// VALIDATOR ROUTE GUARD
// ========================================

/**
 * ValidatorRoute - Requires validator pool membership
 * Use for: Validator pool dashboard, validator settings
 *
 * @example
 * <Route path="/validator-pool" element={
 *   <ValidatorRoute>
 *     <ValidatorPoolDashboard />
 *   </ValidatorRoute>
 * } />
 */
export const ValidatorRoute: React.FC<RouteGuardProps> = ({
  children,
  fallbackPath = '/staking',
}) => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const [isValidator, setIsValidator] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!isApiReady || !api) {
        setLoading(true);
        return;
      }

      if (!selectedAccount?.address) {
        setIsValidator(false);
        setLoading(false);
        return;
      }

      try {
        const validatorStatus = await checkValidatorStatus(api, selectedAccount.address);
        setIsValidator(validatorStatus);
      } catch (error) {
        console.error('Validator check failed:', error);
        setIsValidator(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [api, isApiReady, selectedAccount]);

  // Loading state
  if (loading || !isApiReady) {
    return <LoadingGuard />;
  }

  // Not connected to wallet
  if (!selectedAccount) {
    return <Navigate to="/" replace />;
  }

  // Not in validator pool
  if (isValidator === false) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-8">
            <Alert className="bg-red-900/20 border-red-500">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-gray-300">
                <strong className="block mb-2">Validator Access Required</strong>
                You must be registered in the Validator Pool to access this feature.
                <div className="mt-4">
                  <Button
                    onClick={() => window.location.href = fallbackPath}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Go to Staking
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
};

// ========================================
// EDUCATOR ROUTE GUARD
// ========================================

/**
 * EducatorRoute - Requires educator Tiki role
 * Use for: Creating courses in Perwerde (Education platform)
 *
 * @example
 * <Route path="/education/create-course" element={
 *   <EducatorRoute>
 *     <CourseCreator />
 *   </EducatorRoute>
 * } />
 */
export const EducatorRoute: React.FC<RouteGuardProps> = ({
  children,
  fallbackPath = '/education',
}) => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const [isEducator, setIsEducator] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!isApiReady || !api) {
        setLoading(true);
        return;
      }

      if (!selectedAccount?.address) {
        setIsEducator(false);
        setLoading(false);
        return;
      }

      try {
        const educatorStatus = await checkEducatorRole(api, selectedAccount.address);
        setIsEducator(educatorStatus);
      } catch (error) {
        console.error('Educator check failed:', error);
        setIsEducator(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [api, isApiReady, selectedAccount]);

  // Loading state
  if (loading || !isApiReady) {
    return <LoadingGuard />;
  }

  // Not connected to wallet
  if (!selectedAccount) {
    return <Navigate to="/" replace />;
  }

  // Not an educator
  if (isEducator === false) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-8">
            <Alert className="bg-red-900/20 border-red-500">
              <GraduationCap className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-gray-300">
                <strong className="block mb-2">Educator Role Required</strong>
                You need one of these Tiki roles to create courses:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Perwerdekar (Educator)</li>
                  <li>Mamoste (Teacher)</li>
                  <li>WezireCand (Education Minister)</li>
                  <li>Rewsenbîr (Intellectual)</li>
                </ul>
                <div className="mt-4">
                  <Button
                    onClick={() => window.location.href = fallbackPath}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Browse Courses
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
};

// ========================================
// MODERATOR ROUTE GUARD
// ========================================

/**
 * ModeratorRoute - Requires moderator Tiki role
 * Use for: Forum moderation, governance moderation
 *
 * @example
 * <Route path="/moderate" element={
 *   <ModeratorRoute>
 *     <ModerationPanel />
 *   </ModeratorRoute>
 * } />
 */
export const ModeratorRoute: React.FC<RouteGuardProps> = ({
  children,
  fallbackPath = '/',
}) => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!isApiReady || !api) {
        setLoading(true);
        return;
      }

      if (!selectedAccount?.address) {
        setIsModerator(false);
        setLoading(false);
        return;
      }

      try {
        const moderatorStatus = await checkModeratorRole(api, selectedAccount.address);
        setIsModerator(moderatorStatus);
      } catch (error) {
        console.error('Moderator check failed:', error);
        setIsModerator(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [api, isApiReady, selectedAccount]);

  // Loading state
  if (loading || !isApiReady) {
    return <LoadingGuard />;
  }

  // Not connected to wallet
  if (!selectedAccount) {
    return <Navigate to="/" replace />;
  }

  // Not a moderator
  if (isModerator === false) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-8">
            <Alert className="bg-red-900/20 border-red-500">
              <Shield className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-gray-300">
                <strong className="block mb-2">Moderator Access Required</strong>
                You need moderator privileges to access this feature.
                <div className="mt-4">
                  <Button
                    onClick={() => window.location.href = fallbackPath}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Go to Home
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
};

// ========================================
// ADMIN ROUTE GUARD (Supabase-based)
// ========================================

/**
 * AdminRoute - Requires Supabase admin role
 * Use for: Admin panel, system settings
 * Note: This is separate from blockchain permissions
 */
export const AdminRoute: React.FC<RouteGuardProps> = ({
  children,
  fallbackPath = '/',
}) => {
  const { user, isAdmin, loading } = useAuth();

  // Loading state
  if (loading) {
    return <LoadingGuard />;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-8">
            <Alert className="bg-red-900/20 border-red-500">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-gray-300">
                <strong className="block mb-2">Admin Access Required</strong>
                You do not have permission to access the admin panel.
                <div className="mt-4">
                  <Button
                    onClick={() => window.location.href = fallbackPath}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Go to Home
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
};
