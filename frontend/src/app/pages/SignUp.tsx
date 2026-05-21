import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Ticket } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { registerUser, clearError } from '../store/slices/authSlice';
import { PasswordInput, PasswordStrengthMeter, validatePassword } from '../components/PasswordInput';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function SignUp() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'attendee' as 'attendee' | 'organizer' });
  const [localError, setLocalError] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  // Google One Tap / button init
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
        document.getElementById('google-signup-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signup_with' }
      );
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleGoogleCredential = async (response: any) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) { setLocalError(data.message || 'Google sign-in failed.'); return; }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      window.location.href = '/user/tickets';
    } catch {
      setLocalError('Google sign-in failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());
    const pwError = validatePassword(form.password);
    if (pwError) { setLocalError(pwError); return; }
    if (form.password !== form.confirmPassword) { setLocalError('Passwords do not match.'); return; }
    const result = await dispatch(registerUser({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role: form.role }));
    if (registerUser.fulfilled.match(result)) setRegistered(true);
  };

  if (registered) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="bg-[#004406] p-3 rounded-xl mb-4 w-fit mx-auto"><Ticket className="w-7 h-7 text-white" /></div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-6">
              We sent a verification link to <span className="font-medium text-foreground">{form.email}</span>. Click the link to activate your account before signing in.
            </p>
            <Link to="/signin" className="text-primary font-medium hover:underline text-sm">Back to Sign In</Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#004406] p-3 rounded-xl mb-3"><Ticket className="w-7 h-7 text-white" /></div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Join EventHub for free</p>
          </div>

          {GOOGLE_CLIENT_ID && (
            <>
              <div id="google-signup-btn" className="w-full mb-4" />
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-white px-2">or sign up with email</span></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" placeholder="Jane" value={form.firstName} onChange={handleChange} required /></div>
              <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} required /></div>
            </div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required /></div>
            <div>
              <Label htmlFor="role">I want to</Label>
              <select id="role" value={form.role} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="attendee">Attend events</option>
                <option value="organizer">Organize events</option>
              </select>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
              <PasswordStrengthMeter password={form.password} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} required />
            </div>

            {(localError || error) && <p className="text-sm text-destructive">{localError || error}</p>}

            <Button type="submit" className="w-full bg-[#004406] hover:bg-[#003305] text-white" size="lg" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary font-medium hover:underline">Sign in</Link>
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
