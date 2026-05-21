import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Ticket } from 'lucide-react';
import apiClient from '../api/client';
import { PasswordInput, PasswordStrengthMeter, validatePassword } from '../components/PasswordInput';

export function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setIsLoading(true);
    try {
      await apiClient.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#004406] p-3 rounded-xl mb-3"><Ticket className="w-7 h-7 text-white" /></div>
            <h1 className="text-2xl font-bold">Reset your password</h1>
          </div>

          {success ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-6">Your password has been reset successfully.</p>
              <Link to="/signin" className="inline-block bg-[#004406] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#003305] transition-colors">Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <PasswordStrengthMeter password={password} />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm New Password</Label>
                <PasswordInput id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-[#004406] hover:bg-[#003305] text-white" size="lg" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}
