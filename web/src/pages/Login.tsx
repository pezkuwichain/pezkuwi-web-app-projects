import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Wallet, Mail, Lock, User, AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { connectWallet, selectedAccount } = usePolkadot();
  const { signIn, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          setError('Email or password is incorrect. Please try again.');
        } else {
          setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
        }
      } else {
        navigate('/');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (signupData.password !== signupData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      if (signupData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }
      
      const { error } = await signUp(
        signupData.email, 
        signupData.password, 
        signupData.name, 
        signupData.referralCode
      );
      
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    setLoading(true);
    setError('');
    try {
      await connectWallet();
      if (selectedAccount) {
        navigate('/');
      } else {
        setError('Please select an account from your Polkadot.js extension');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Wallet connection failed:', err);
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg?.includes('extension')) {
        setError('Polkadot.js extension not found. Please install it first.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-gray-900/90 backdrop-blur-xl border-gray-800">
        <CardHeader className="space-y-1">
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
            PezkuwiChain
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {t('login.subtitle', 'Access your governance account')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="login">{t('login.signin', 'Sign In')}</TabsTrigger>
              <TabsTrigger value="signup">{t('login.signup', 'Sign Up')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    {t('login.email', 'Email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    {t('login.password', 'Password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer">
                      {t('login.rememberMe', 'Remember me')}
                    </Label>
                  </div>
                  <button 
                    type="button" 
                    className="text-sm text-green-500 hover:text-green-400"
                    onClick={() => navigate('/reset-password')}
                  >
                    {t('login.forgotPassword', 'Forgot password?')}
                  </button>
                </div>

                {error && (
                  <Alert className="bg-red-900/20 border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                  disabled={loading}
                >
                  {loading ? t('login.signingIn', 'Signing in...') : t('login.signin', 'Sign In')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    {t('login.fullName', 'Full Name')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                      value={signupData.name}
                      onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300">
                    {t('login.email', 'Email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                      value={signupData.email}
                      onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300">
                    {t('login.password', 'Password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white"
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-300">
                    {t('login.confirmPassword', 'Confirm Password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referral-code" className="text-gray-300">
                    {t('login.referralCode', 'Referral Code')} 
                    <span className="text-gray-500 text-xs ml-1">({t('login.optional', 'Optional')})</span>
                  </Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <Input
                      id="referral-code"
                      type="text"
                      placeholder={t('login.enterReferralCode', 'Referral code (optional)')}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 placeholder:opacity-50"
                      value={signupData.referralCode}
                      onChange={(e) => setSignupData({...signupData, referralCode: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('login.referralDescription', 'If someone referred you, enter their code here')}
                  </p>
                </div>

                {error && (
                  <Alert className="bg-red-900/20 border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400"
                  disabled={loading}
                >
                  {loading ? t('login.creatingAccount', 'Creating account...') : t('login.createAccount', 'Create Account')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <Separator className="bg-gray-800" />
            <div className="relative -top-3 text-center">
              <span className="bg-gray-900 px-2 text-sm text-gray-500">
                {t('login.or', 'Or continue with')}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full border-gray-700 bg-gray-800 hover:bg-gray-700 text-white"
            onClick={handleWalletConnect}
            disabled={loading}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {t('login.connectWallet', 'Connect with Polkadot.js')}
          </Button>

          <p className="mt-2 text-xs text-center text-gray-500">
            {t('login.walletHint', 'Connect your Polkadot wallet for instant access')}
          </p>
        </CardContent>
        
        <CardFooter className="text-center text-sm text-gray-500">
          <p>
            {t('login.terms', 'By continuing, you agree to our')}{' '}
            <a href="#" className="text-green-500 hover:text-green-400">
              {t('login.termsOfService', 'Terms of Service')}
            </a>{' '}
            {t('login.and', 'and')}{' '}
            <a href="#" className="text-green-500 hover:text-green-400">
              {t('login.privacyPolicy', 'Privacy Policy')}
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;