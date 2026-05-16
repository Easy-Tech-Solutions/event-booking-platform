import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card } from '../components/ui/card';
import { Ticket, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../api/client';

export function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    apiClient.get(`/auth/verify-email/${token}`)
      .then((res) => { setStatus('success'); setMessage(res.data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.'); });
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-10 h-10 border-4 border-[#004406] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="w-14 h-14 text-[#004406] mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link to="/signin" className="inline-block bg-[#004406] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#003305] transition-colors">
                Sign In
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link to="/signup" className="text-primary font-medium hover:underline text-sm">
                Back to Sign Up
              </Link>
            </>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}
