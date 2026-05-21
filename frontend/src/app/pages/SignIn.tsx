import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Ticket } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, clearError, fetchProfile } from '../store/slices/authSlice';
import { PasswordInput } from '../components/PasswordInput';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleError, setGoogleError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/user/tickets';

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      (window as any).google?.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
      );
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleGoogleCredential = async (response: any) => {
    setGoogleError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) { setGoogleError(data.message || 'Google sign-in failed.'); return; }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      await dispatch(fetchProfile());
      navigate(from, { replace: true });
    } catch {
      setGoogleError('Google sign-in failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#004406] p-3 rounded-xl mb-3"><Ticket className="w-7 h-7 text-white" /></div>
            <h1 className="text-2xl font-bold">Sign in to EventHub</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back!</p>
          </div>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="flex justify-center mb-4">
                <div id="google-signin-btn" />
              </div>
              {googleError && <p className="text-sm text-destructive mb-2">{googleError}</p>}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-white px-2">or sign in with email</span></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full bg-[#004406] hover:bg-[#003305] text-white" size="lg" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up free</Link>
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
