import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Ticket } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { registerUser, clearError } from '../store/slices/authSlice';

export function SignUp() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'attendee' as 'attendee' | 'organizer' });
  const [localError, setLocalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    const result = await dispatch(registerUser({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role: form.role }));
    if (registerUser.fulfilled.match(result)) {
      navigate('/user/tickets');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#004406] p-3 rounded-xl mb-3">
              <Ticket className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Join EventHub for free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Jane" value={form.firstName} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="role">I want to</Label>
              <select id="role" value={form.role} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="attendee">Attend events</option>
                <option value="organizer">Organize events</option>
              </select>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required />
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
