import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Ticket, Heart, Calendar, CreditCard, Settings, MapPin, User,
  Globe, Twitter, Linkedin, Instagram, ShieldCheck, QrCode, KeyRound,
  Mail, Phone, Link2, Building2, FileText, CheckCircle, AlertCircle,
  Upload,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMyOrders, fetchMyTickets } from '../store/slices/ordersSlice';
import { updateUser, fetchProfile } from '../store/slices/authSlice';
import { PasswordInput, PasswordStrengthMeter, validatePassword } from '../components/PasswordInput';
import apiClient from '../api/client';
import { TicketQRCode } from '../components/TicketQRCode';

export function UserDashboard() {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const sidebarItems = [
    { id: 'tickets', label: 'My Tickets', icon: Ticket, path: '/user/tickets' },
    { id: 'upcoming', label: 'Upcoming Events', icon: Calendar, path: '/user/upcoming' },
    { id: 'saved', label: 'Saved Events', icon: Heart, path: '/user/saved' },
    { id: 'payment', label: 'Payment History', icon: CreditCard, path: '/user/payment' },
    { id: 'profile', label: 'Profile Settings', icon: Settings, path: '/user/profile' },
    ...(user?.role === 'organizer' ? [{ id: 'kyc', label: 'KYC Verification', icon: Building2, path: '/user/kyc' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.id} to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-[#004406]/10 text-[#004406]' : 'hover:bg-gray-100 text-gray-700'}`}>
                      <Icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Routes>
              <Route path="tickets" element={<MyTickets />} />
              <Route path="upcoming" element={<UpcomingEvents />} />
              <Route path="saved" element={<SavedEvents />} />
              <Route path="payment" element={<PaymentHistory />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="kyc" element={<KycVerification />} />
              <Route index element={<MyTickets />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── My Tickets ────────────────────────────────────────────────────────────────
function MyTickets() {
  const dispatch = useAppDispatch();
  const { orders, myTickets, myTicketsLoading, isLoading, error } = useAppSelector((state) => state.orders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [transferOrderId, setTransferOrderId] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});
  const [recoveringOrder, setRecoveringOrder] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyOrders());
    dispatch(fetchMyTickets());
  }, [dispatch]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleTransfer = async (orderId: string) => {
    setActionMsg((p) => ({ ...p, [orderId]: `Transfer requests are handled by support. Please contact us via Help Center with order #${orderId.slice(-6).toUpperCase()}.` }));
    setTransferOrderId(null); setTransferEmail('');
  };

  const handleRefund = async (orderId: string) => {
    if (!refundReason.trim()) return;
    try {
      await apiClient.post(`/orders/${orderId}/refund`, { reason: refundReason });
      setActionMsg((p) => ({ ...p, [orderId]: 'Refund processed successfully. Amount will appear in 5–10 business days.' }));
    } catch (e: any) {
      setActionMsg((p) => ({ ...p, [orderId]: e.response?.data?.message || 'Refund request failed. Please contact support.' }));
    }
    setRefundOrderId(null); setRefundReason('');
  };

  const handleRecover = async (orderId: string) => {
    setRecoveringOrder(orderId);
    try {
      await apiClient.post(`/orders/${orderId}/recover-tickets`);
      dispatch(fetchMyTickets());
    } catch (e: any) {
      setActionMsg((p) => ({ ...p, [orderId]: e.response?.data?.message || 'Could not recover tickets. Please contact support.' }));
    } finally {
      setRecoveringOrder(null);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#004406] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="text-center py-12 text-destructive">{error}</div>;

  const now = new Date();
  const isValidDate = (d: any) => d && !isNaN(new Date(d).getTime());
  const completed = orders.filter((o: any) => o.status === 'completed');
  const upcoming = completed.filter((o: any) => !isValidDate(o.event?.startDate) || new Date(o.event.startDate) >= now);
  const past = completed.filter((o: any) => isValidDate(o.event?.startDate) && new Date(o.event.startDate) < now);

  // Group tickets by orderId for quick lookup
  const ticketsByOrder = myTickets.reduce((acc: Record<string, any[]>, t: any) => {
    const oid = (t.order?._id ?? t.order)?.toString();
    if (!oid) return acc;
    if (!acc[oid]) acc[oid] = [];
    acc[oid].push(t);
    return acc;
  }, {});

  const renderOrderCard = (order: any, isUpcoming: boolean) => {
    const orderTickets: any[] = ticketsByOrder[order._id?.toString()] ?? [];
    return (
      <Card key={order._id} className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg mb-1">{order.event?.title ?? 'Event'}</h3>
                <Badge className="bg-[#004406] text-white">{actionMsg[order._id] ? 'Action Taken' : 'Confirmed'}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                <QrCode className="w-4 h-4 mr-2" />{expandedOrder === order._id ? 'Hide' : 'Show'} Tickets
              </Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground mt-4">
              {isValidDate(order.event?.startDate) && <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{formatDate(order.event.startDate)}</span></div>}
              {order.event?.location?.venue && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{order.event.location.venue}</span></div>}
              <div className="flex items-center gap-2"><Ticket className="w-4 h-4" />
                {order.items?.map((item: any, i: number) => (
                  item?.ticketType ? <span key={i}>{item.quantity}x {item.ticketType.name}</span> : null
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <div><span className="text-sm text-muted-foreground">Total Paid</span><span className="ml-2 font-semibold text-lg">${order.totalAmount?.toFixed(2)}</span></div>
              <div className="text-xs text-muted-foreground">{order.orderNumber}</div>
            </div>

            {expandedOrder === order._id && (
              <div className="mt-4 pt-4 border-t">
                {myTicketsLoading ? (
                  <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-[#004406] border-t-transparent rounded-full animate-spin" /></div>
                ) : orderTickets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orderTickets.map((ticket: any) => (
                      <div key={ticket._id} className="border rounded-lg p-4 flex flex-col items-center gap-2 bg-gray-50">
                        <div className="text-xs font-medium text-muted-foreground">{ticket.ticketType?.name}</div>
                        {ticket.qrCode ? (
                          <img src={ticket.qrCode} alt={`QR code for ${ticket.ticketNumber}`} className="w-36 h-36" />
                        ) : (
                          <TicketQRCode ticketId={ticket.ticketNumber} />
                        )}
                        <div className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</div>
                        <Badge variant="outline" className="text-xs capitalize">{ticket.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground mb-2">No tickets found for this order.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={recoveringOrder === order._id}
                      onClick={() => handleRecover(order._id)}
                    >
                      {recoveringOrder === order._id ? 'Recovering…' : 'Reload Tickets'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!actionMsg[order._id] && isUpcoming && (
              <div className="mt-4 flex flex-wrap gap-2">
                {transferOrderId === order._id ? (
                  <div className="flex items-center gap-2">
                    <Input type="email" placeholder="Recipient email" value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} className="w-48" />
                    <Button size="sm" className="bg-[#004406] text-white" disabled={!transferEmail} onClick={() => handleTransfer(order._id)}>Transfer</Button>
                    <Button size="sm" variant="ghost" onClick={() => setTransferOrderId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setTransferOrderId(order._id)}>Transfer Ticket</Button>
                )}
                {refundOrderId === order._id ? (
                  <div className="flex items-center gap-2">
                    <Input placeholder="Reason for refund" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-48" />
                    <Button size="sm" className="bg-[#004406] text-white" disabled={!refundReason} onClick={() => handleRefund(order._id)}>Submit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setRefundOrderId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setRefundOrderId(order._id)}>Request Refund</Button>
                )}
              </div>
            )}
            {actionMsg[order._id] && <div className="mt-4 text-sm text-[#004406] font-medium">{actionMsg[order._id]}</div>}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">My Tickets</h2><p className="text-muted-foreground">View and manage your event tickets</p></div>
      </div>
      {completed.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No tickets yet</h3>
          <p className="text-sm text-muted-foreground">Your confirmed tickets will appear here after booking.</p>
        </div>
      ) : (
        <Tabs defaultValue={upcoming.length > 0 ? "upcoming" : "past"}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past Events ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6">
            {upcoming.length === 0 ? (
              <div className="text-center py-12"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><h3 className="font-semibold mb-2">No upcoming events</h3></div>
            ) : (
              <div className="space-y-4">{upcoming.map((o: any) => renderOrderCard(o, true))}</div>
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            {past.length === 0 ? (
              <div className="text-center py-12"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><h3 className="font-semibold mb-2">No past events</h3></div>
            ) : (
              <div className="space-y-4">{past.map((o: any) => renderOrderCard(o, false))}</div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ── Upcoming Events ───────────────────────────────────────────────────────────
function UpcomingEvents() {
  const { orders } = useAppSelector((state) => state.orders);
  const upcoming = orders.filter((o: any) => o.status === 'completed' && new Date(o.event?.startDate) >= new Date());
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      {upcoming.length === 0 ? <p className="text-muted-foreground">No upcoming events. <Link to="/discover" className="text-[#004406] hover:underline">Browse events</Link></p> : (
        <div className="space-y-3">
          {upcoming.map((o: any) => (
            <div key={o._id} className="flex items-center gap-4 p-3 border rounded-lg">
              <Calendar className="w-5 h-5 text-[#004406]" />
              <div><div className="font-medium">{o.event?.title}</div><div className="text-sm text-muted-foreground">{o.event?.startDate ? new Date(o.event.startDate).toLocaleDateString() : ''}</div></div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Saved Events ──────────────────────────────────────────────────────────────
function SavedEvents() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Saved Events</h2>
      <p className="text-muted-foreground">Events you&apos;ve favorited will appear here once the save feature is connected to your account.</p>
    </Card>
  );
}

// ── Payment History ───────────────────────────────────────────────────────────
function PaymentHistory() {
  const { orders } = useAppSelector((state) => state.orders);
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Payment History</h2>
      {orders.length === 0 ? <p className="text-muted-foreground">No payment history yet.</p> : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order._id} className="flex justify-between items-center py-3 border-b last:border-0">
              <div>
                <div className="font-medium">{order.event?.title}</div>
                <div className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${order.totalAmount?.toFixed(2)}</div>
                <Badge variant="outline" className="text-xs">{order.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Profile Settings ──────────────────────────────────────────────────────────
function ProfileSettings() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    bio: '',
    website: '', twitter: '', linkedin: '', instagram: '',
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // 2FA — TOTP
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'verify' | 'disable'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpMsg, setTotpMsg] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);

  // 2FA — Email OTP
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [emailStep, setEmailStep] = useState<'idle' | 'verify' | 'disable'>('idle');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // 2FA — SMS OTP
  const [smsOtpEnabled, setSmsOtpEnabled] = useState(false);
  const [smsStep, setSmsStep] = useState<'idle' | 'phone' | 'verify' | 'disable'>('idle');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsOtp, setSmsOtp] = useState('');
  const [smsMsg, setSmsMsg] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);

  // Connected accounts (Zoom / Google)
  const [integrations, setIntegrations] = useState<{ zoom: { connected: boolean }; google: { connected: boolean } }>({ zoom: { connected: false }, google: { connected: false } });
  const [intLoading, setIntLoading] = useState(true);
  const [intError, setIntError] = useState('');
  const [intSuccess, setIntSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        website: user.socialLinks?.website || '',
        twitter: user.socialLinks?.twitter || '',
        linkedin: user.socialLinks?.linkedin || '',
        instagram: user.socialLinks?.instagram || '',
      });
      setTotpEnabled(user.totpEnabled ?? false);
      setEmailOtpEnabled((user as any).emailOtpEnabled ?? false);
      setSmsOtpEnabled((user as any).smsOtpEnabled ?? false);
    }
    apiClient.get('/integrations/status')
      .then((r) => setIntegrations(r.data))
      .catch(() => {})
      .finally(() => setIntLoading(false));

    // Show success banner after OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('zoom') === 'connected') { setIntSuccess('Zoom connected successfully!'); window.history.replaceState({}, '', window.location.pathname); }
    if (params.get('google') === 'connected') { setIntSuccess('Google connected successfully!'); window.history.replaceState({}, '', window.location.pathname); }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async () => {
    setProfileError('');
    if (!form.firstName.trim() || !form.lastName.trim()) { setProfileError('First and last name are required.'); return; }
    setProfileLoading(true);
    try {
      const fd = new FormData();
      fd.append('firstName', form.firstName.trim());
      fd.append('lastName', form.lastName.trim());
      fd.append('phone', form.phone.trim());
      fd.append('bio', form.bio.trim());
      fd.append('socialLinks[website]', form.website.trim());
      fd.append('socialLinks[twitter]', form.twitter.trim());
      fd.append('socialLinks[linkedin]', form.linkedin.trim());
      fd.append('socialLinks[instagram]', form.instagram.trim());
      if (avatarFile) fd.append('avatar', avatarFile);
      const res = await apiClient.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(updateUser(res.data.user));
      setAvatarFile(null);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e: any) {
      setProfileError(e.response?.data?.message || 'Failed to save profile.');
    } finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (!pw.current) { setPwError('Current password is required.'); return; }
    const err = validatePassword(pw.next);
    if (err) { setPwError(err); return; }
    if (pw.next !== pw.confirm) { setPwError('New passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await apiClient.put('/auth/change-password', { currentPassword: pw.current, newPassword: pw.next });
      setPwSaved(true);
      setPw({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e: any) { setPwError(e.response?.data?.message || 'Failed to change password.'); }
    finally { setPwLoading(false); }
  };

  // ── TOTP ──────────────────────────────────────────────────────────────────
  const handle2FASetup = async () => {
    setTotpLoading(true); setTotpMsg('');
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      setQrCode(res.data.qrCode);
      setManualKey(res.data.manualKey);
      setTwoFAStep('verify');
    } catch (e: any) { setTotpMsg(e.response?.data?.message || 'Setup failed.'); }
    finally { setTotpLoading(false); }
  };

  const handle2FAVerify = async () => {
    if (!totpCode.trim()) return;
    setTotpLoading(true); setTotpMsg('');
    try {
      const res = await apiClient.post('/auth/2fa/verify', { token: totpCode });
      setBackupCodes(res.data.backupCodes || []);
      setTotpEnabled(true);
      setTwoFAStep('idle');
      setTotpCode('');
      dispatch(fetchProfile());
    } catch (e: any) { setTotpMsg(e.response?.data?.message || 'Invalid code.'); }
    finally { setTotpLoading(false); }
  };

  const handle2FADisable = async () => {
    if (!totpCode.trim()) return;
    setTotpLoading(true); setTotpMsg('');
    try {
      await apiClient.post('/auth/2fa/disable', { token: totpCode });
      setTotpEnabled(false);
      setTwoFAStep('idle');
      setTotpCode('');
      dispatch(fetchProfile());
    } catch (e: any) { setTotpMsg(e.response?.data?.message || 'Invalid code.'); }
    finally { setTotpLoading(false); }
  };

  // ── Email OTP ────────────────────────────────────────────────────────────
  const handleEmailSetup = async () => {
    setEmailLoading(true); setEmailMsg('');
    try {
      await apiClient.post('/auth/2fa/email/setup');
      setEmailStep('verify');
      setEmailMsg('A 6-digit code has been sent to your email.');
    } catch (e: any) { setEmailMsg(e.response?.data?.message || 'Failed to send code.'); }
    finally { setEmailLoading(false); }
  };

  const handleEmailVerify = async () => {
    if (!emailOtp.trim()) return;
    setEmailLoading(true); setEmailMsg('');
    try {
      await apiClient.post('/auth/2fa/email/verify', { otp: emailOtp });
      setEmailOtpEnabled(true);
      setEmailStep('idle');
      setEmailOtp('');
      setEmailMsg('Email 2FA enabled!');
      dispatch(fetchProfile());
    } catch (e: any) { setEmailMsg(e.response?.data?.message || 'Invalid code.'); }
    finally { setEmailLoading(false); }
  };

  const handleEmailDisable = async () => {
    if (!emailOtp.trim()) return;
    setEmailLoading(true); setEmailMsg('');
    try {
      await apiClient.post('/auth/2fa/email/disable', { otp: emailOtp });
      setEmailOtpEnabled(false);
      setEmailStep('idle');
      setEmailOtp('');
      dispatch(fetchProfile());
    } catch (e: any) { setEmailMsg(e.response?.data?.message || 'Invalid code.'); }
    finally { setEmailLoading(false); }
  };

  const handleEmailResend = async () => {
    setEmailLoading(true);
    try { await apiClient.post('/auth/2fa/email/setup'); setEmailMsg('Code resent.'); }
    catch { setEmailMsg('Failed to resend.'); }
    finally { setEmailLoading(false); }
  };

  // ── SMS OTP ──────────────────────────────────────────────────────────────
  const handleSmsSetup = async () => {
    if (!smsPhone.trim()) { setSmsMsg('Enter a phone number first.'); return; }
    setSmsLoading(true); setSmsMsg('');
    try {
      await apiClient.post('/auth/2fa/sms/setup', { phone: smsPhone });
      setSmsStep('verify');
      setSmsMsg('A 6-digit code has been sent to your phone.');
    } catch (e: any) { setSmsMsg(e.response?.data?.message || 'Failed to send code.'); }
    finally { setSmsLoading(false); }
  };

  const handleSmsVerify = async () => {
    if (!smsOtp.trim()) return;
    setSmsLoading(true); setSmsMsg('');
    try {
      await apiClient.post('/auth/2fa/sms/verify', { otp: smsOtp });
      setSmsOtpEnabled(true);
      setSmsStep('idle');
      setSmsOtp('');
      setSmsMsg('SMS 2FA enabled!');
      dispatch(fetchProfile());
    } catch (e: any) { setSmsMsg(e.response?.data?.message || 'Invalid code.'); }
    finally { setSmsLoading(false); }
  };

  const handleSmsDisable = async () => {
    if (!smsOtp.trim()) return;
    setSmsLoading(true); setSmsMsg('');
    try {
      await apiClient.post('/auth/2fa/sms/disable', { otp: smsOtp });
      setSmsOtpEnabled(false);
      setSmsStep('idle');
      setSmsOtp('');
      dispatch(fetchProfile());
    } catch (e: any) { setSmsMsg(e.response?.data?.message || 'Invalid code.'); }
    finally { setSmsLoading(false); }
  };

  const handleSmsResend = async () => {
    setSmsLoading(true);
    try { await apiClient.post('/auth/2fa/sms/setup', { phone: smsPhone }); setSmsMsg('Code resent.'); }
    catch { setSmsMsg('Failed to resend.'); }
    finally { setSmsLoading(false); }
  };

  // ── Integrations ─────────────────────────────────────────────────────────
  const handleZoomConnect = () => {
    setIntError('');
    apiClient.get('/integrations/zoom/auth')
      .then((r) => { if (r.data.url) window.location.href = r.data.url; })
      .catch((e) => setIntError(e.response?.data?.message || 'Zoom is not configured on this server.'));
  };

  const handleZoomDisconnect = async () => {
    await apiClient.post('/integrations/zoom/disconnect').catch(() => null);
    setIntegrations((p) => ({ ...p, zoom: { connected: false } }));
  };

  const handleGoogleConnect = () => {
    setIntError('');
    apiClient.get('/integrations/google/auth')
      .then((r) => { if (r.data.url) window.location.href = r.data.url; })
      .catch((e) => setIntError(e.response?.data?.message || 'Google integration is not configured on this server.'));
  };

  const handleGoogleDisconnect = async () => {
    await apiClient.post('/integrations/google/disconnect').catch(() => null);
    setIntegrations((p) => ({ ...p, google: { connected: false } }));
  };

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview || user?.avatar ? (
                <img src={avatarPreview || user?.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 bg-[#004406] rounded-full flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
              <label className="text-xs text-[#004406] cursor-pointer hover:underline">
                Change Photo
                <input type="file" accept="image/*" aria-label="Change profile photo" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} /></div>
            <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
            <div className="md:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} disabled className="bg-gray-50 text-muted-foreground cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
            </div>
            <div className="md:col-span-2">
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 123-4567" />
            </div>
            <div className="md:col-span-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell people a little about yourself…" rows={3} maxLength={500} />
              <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/500 characters</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-sm mb-3">Social Links</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([
                { icon: Globe, key: 'website', placeholder: 'https://yoursite.com' },
                { icon: Twitter, key: 'twitter', placeholder: 'https://twitter.com/username' },
                { icon: Linkedin, key: 'linkedin', placeholder: 'https://linkedin.com/in/username' },
                { icon: Instagram, key: 'instagram', placeholder: 'https://instagram.com/username' },
              ] as const).map(({ icon: Icon, key, placeholder }) => (
                <div key={key} className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="pl-9" />
                </div>
              ))}
            </div>
          </div>
          {profileError && <p className="text-sm text-destructive">{profileError}</p>}
          {profileSaved && <p className="text-sm text-[#004406]">Profile saved successfully!</p>}
          <Button className="bg-[#004406] hover:bg-[#003305] text-white" onClick={handleProfileSave} disabled={profileLoading}>
            {profileLoading ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {/* Organizer request */}
      {user?.role === 'attendee' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Become an Organizer</h3>
          <p className="text-sm text-muted-foreground mb-4">Want to create and host events? Request organizer access.</p>
          <OrganizerRequestButton currentStatus={user.organizerStatus} />
        </Card>
      )}

      {/* Admin setup */}
      {user?.role !== 'admin' && user?.role !== 'superadmin' && (
        <Card className="p-6 border-dashed border-amber-300 bg-amber-50/50">
          <h3 className="text-lg font-semibold mb-2">Admin Setup</h3>
          <p className="text-sm text-muted-foreground mb-4">Promote your account to admin. Only works when no admin exists on the platform.</p>
          <AdminSetupButton />
        </Card>
      )}

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-5 h-5 text-[#004406]" />
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Add extra security to your account. You can enable multiple 2FA methods.</p>

        {backupCodes.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-semibold text-sm mb-2 text-amber-800">Save your backup codes — each can only be used once:</p>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {backupCodes.map((code) => <code key={code} className="text-xs font-mono bg-white border rounded px-2 py-1">{code}</code>)}
            </div>
            <Button variant="outline" size="sm" onClick={() => setBackupCodes([])}>I&apos;ve saved these codes</Button>
          </div>
        )}

        <div className="space-y-4">
          {/* Authenticator App */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#004406]" />
                <span className="font-medium text-sm">Authenticator App (TOTP)</span>
              </div>
              <Badge className={totpEnabled ? 'bg-[#004406]/10 text-[#004406]' : 'bg-gray-100 text-gray-600'}>{totpEnabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Use Google Authenticator, Authy, or similar apps.</p>

            {twoFAStep === 'idle' && (
              !totpEnabled
                ? <Button size="sm" onClick={() => { setTwoFAStep('verify'); handle2FASetup(); }} disabled={totpLoading} className="bg-[#004406] hover:bg-[#003305] text-white">{totpLoading ? 'Loading…' : 'Set Up'}</Button>
                : <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setTwoFAStep('disable')}>Disable</Button>
            )}

            {twoFAStep === 'verify' && qrCode && (
              <div className="space-y-3 mt-2">
                <img src={qrCode} alt="QR code" className="w-40 h-40 border rounded" />
                <p className="text-xs text-muted-foreground">Manual key: <code className="font-mono bg-gray-100 px-1 rounded">{manualKey}</code></p>
                <div className="flex gap-2 items-center">
                  <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="6-digit code" maxLength={6} className="w-32 font-mono text-center" />
                  <Button size="sm" onClick={handle2FAVerify} disabled={totpLoading || totpCode.length < 6} className="bg-[#004406] text-white">{totpLoading ? '…' : 'Verify'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setTwoFAStep('idle'); setTotpCode(''); }}>Cancel</Button>
                </div>
                {totpMsg && <p className="text-xs text-red-600">{totpMsg}</p>}
              </div>
            )}

            {twoFAStep === 'disable' && (
              <div className="flex gap-2 items-center mt-2">
                <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="6-digit code" maxLength={6} className="w-32 font-mono text-center" />
                <Button size="sm" variant="outline" className="text-red-600" onClick={handle2FADisable} disabled={totpLoading || totpCode.length < 6}>{totpLoading ? '…' : 'Disable'}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setTwoFAStep('idle'); setTotpCode(''); }}>Cancel</Button>
              </div>
            )}
          </div>

          {/* Email OTP */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#004406]" />
                <span className="font-medium text-sm">Email OTP</span>
              </div>
              <Badge className={emailOtpEnabled ? 'bg-[#004406]/10 text-[#004406]' : 'bg-gray-100 text-gray-600'}>{emailOtpEnabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Receive a one-time code to {user?.email} at login.</p>

            {emailStep === 'idle' && (
              !emailOtpEnabled
                ? <Button size="sm" onClick={handleEmailSetup} disabled={emailLoading} className="bg-[#004406] hover:bg-[#003305] text-white">{emailLoading ? 'Sending…' : 'Enable Email 2FA'}</Button>
                : <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => { setEmailStep('disable'); handleEmailSetup(); }}>Disable</Button>
            )}

            {(emailStep === 'verify' || emailStep === 'disable') && (
              <div className="space-y-2 mt-2">
                <div className="flex gap-2 items-center">
                  <Input value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} placeholder="6-digit code" maxLength={6} className="w-32 font-mono text-center" />
                  {emailStep === 'verify'
                    ? <Button size="sm" onClick={handleEmailVerify} disabled={emailLoading || emailOtp.length < 6} className="bg-[#004406] text-white">{emailLoading ? '…' : 'Verify'}</Button>
                    : <Button size="sm" variant="outline" className="text-red-600" onClick={handleEmailDisable} disabled={emailLoading || emailOtp.length < 6}>{emailLoading ? '…' : 'Confirm Disable'}</Button>}
                  <Button size="sm" variant="ghost" onClick={() => { setEmailStep('idle'); setEmailOtp(''); setEmailMsg(''); }}>Cancel</Button>
                </div>
                <button type="button" onClick={handleEmailResend} className="text-xs text-[#004406] hover:underline" disabled={emailLoading}>Resend code</button>
                {emailMsg && <p className="text-xs text-muted-foreground">{emailMsg}</p>}
              </div>
            )}

            {emailStep === 'idle' && emailMsg && <p className="text-xs text-[#004406] mt-1">{emailMsg}</p>}
          </div>

          {/* SMS OTP */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#004406]" />
                <span className="font-medium text-sm">SMS OTP</span>
              </div>
              <Badge className={smsOtpEnabled ? 'bg-[#004406]/10 text-[#004406]' : 'bg-gray-100 text-gray-600'}>{smsOtpEnabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Receive a one-time code via text message at login.</p>

            {smsStep === 'idle' && !smsOtpEnabled && (
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Input value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} placeholder="+1 555 000 0000" className="w-48" />
                  <Button size="sm" onClick={handleSmsSetup} disabled={smsLoading} className="bg-[#004406] hover:bg-[#003305] text-white">{smsLoading ? 'Sending…' : 'Send Code'}</Button>
                </div>
                {smsMsg && <p className="text-xs text-red-600">{smsMsg}</p>}
              </div>
            )}

            {smsStep === 'idle' && smsOtpEnabled && (
              <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => { setSmsStep('disable'); handleSmsSetup(); }}>Disable</Button>
            )}

            {(smsStep === 'verify' || smsStep === 'disable') && (
              <div className="space-y-2 mt-2">
                <div className="flex gap-2 items-center">
                  <Input value={smsOtp} onChange={(e) => setSmsOtp(e.target.value)} placeholder="6-digit code" maxLength={6} className="w-32 font-mono text-center" />
                  {smsStep === 'verify'
                    ? <Button size="sm" onClick={handleSmsVerify} disabled={smsLoading || smsOtp.length < 6} className="bg-[#004406] text-white">{smsLoading ? '…' : 'Verify'}</Button>
                    : <Button size="sm" variant="outline" className="text-red-600" onClick={handleSmsDisable} disabled={smsLoading || smsOtp.length < 6}>{smsLoading ? '…' : 'Confirm Disable'}</Button>}
                  <Button size="sm" variant="ghost" onClick={() => { setSmsStep('idle'); setSmsOtp(''); setSmsMsg(''); }}>Cancel</Button>
                </div>
                <button type="button" onClick={handleSmsResend} className="text-xs text-[#004406] hover:underline" disabled={smsLoading}>Resend code</button>
                {smsMsg && <p className="text-xs text-muted-foreground">{smsMsg}</p>}
              </div>
            )}

            {smsStep === 'idle' && smsOtpEnabled && smsMsg && <p className="text-xs text-[#004406] mt-1">{smsMsg}</p>}
          </div>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <Link2 className="w-5 h-5 text-[#004406]" />
          <h3 className="text-lg font-semibold">Connected Accounts</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Link external accounts to use Zoom/Google Meet for events and sync calendar bookings automatically.</p>

        {intError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{intError}</div>
        )}
        {intSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{intSuccess}</div>
        )}

        <div className="space-y-3">
          {/* Zoom */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">Z</div>
              <div>
                <p className="font-medium text-sm">Zoom</p>
                <p className="text-xs text-muted-foreground">Create and host Zoom meetings for your events</p>
              </div>
            </div>
            {intLoading ? (
              <div className="w-20 h-8 bg-gray-100 animate-pulse rounded" />
            ) : integrations.zoom.connected ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle className="w-3 h-3" />Connected</Badge>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={handleZoomDisconnect}>Disconnect</Button>
              </div>
            ) : (
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleZoomConnect}>Connect Zoom</Button>
            )}
          </div>

          {/* Google */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center text-sm font-bold">
                <span className="text-[#4285F4]">G</span>
              </div>
              <div>
                <p className="font-medium text-sm">Google</p>
                <p className="text-xs text-muted-foreground">Google Meet events + auto-add bookings to Google Calendar</p>
              </div>
            </div>
            {intLoading ? (
              <div className="w-20 h-8 bg-gray-100 animate-pulse rounded" />
            ) : integrations.google.connected ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle className="w-3 h-3" />Connected</Badge>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={handleGoogleDisconnect}>Disconnect</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="border-gray-300" onClick={handleGoogleConnect}>Connect Google</Button>
            )}
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-5 h-5 text-[#004406]" />
          <h3 className="text-lg font-semibold">Change Password</h3>
        </div>
        <div className="space-y-4">
          <div><Label>Current Password</Label><PasswordInput value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="Enter current password" /></div>
          <div>
            <Label>New Password</Label>
            <PasswordInput value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="Enter new password" />
            <PasswordStrengthMeter password={pw.next} />
          </div>
          <div><Label>Confirm New Password</Label><PasswordInput value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" /></div>
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          {pwSaved && <p className="text-sm text-[#004406]">Password changed successfully!</p>}
          <Button className="bg-[#004406] hover:bg-[#003305] text-white" onClick={handlePasswordChange} disabled={pwLoading}>
            {pwLoading ? 'Updating…' : 'Update Password'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── KYC Verification (organizers only) ───────────────────────────────────────
function KycVerification() {
  const idDocRef = useRef<HTMLInputElement>(null);
  const bizDocRef = useRef<HTMLInputElement>(null);

  const [kyc, setKyc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'individual',
    taxId: '',
    country: 'US',
    address: '',
    website: '',
  });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [bizFile, setBizFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    apiClient.get('/kyc/me')
      .then((r) => {
        setKyc(r.data.kyc);
        if (r.data.kyc) {
          setForm({
            businessName: r.data.kyc.businessName || '',
            businessType: r.data.kyc.businessType || 'individual',
            taxId: r.data.kyc.taxId || '',
            country: r.data.kyc.country || 'US',
            address: r.data.kyc.address || '',
            website: r.data.kyc.website || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.businessName.trim() || !form.country.trim()) {
      setMsg('Business name and country are required.');
      setMsgType('error');
      return;
    }
    setSubmitting(true);
    setMsg('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (idFile) fd.append('idDocument', idFile);
      if (bizFile) fd.append('businessDocument', bizFile);
      const res = await apiClient.post('/kyc', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setKyc(res.data.kyc);
      setMsg('KYC submitted! Our team will review it within 2–3 business days.');
      setMsgType('success');
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Submission failed.');
      setMsgType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const KYC_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    requires_resubmission: 'bg-orange-100 text-orange-800',
  };

  const canSubmit = !kyc || ['requires_resubmission', 'rejected'].includes(kyc.status);

  if (isLoading) {
    return <Card className="p-6"><div className="h-32 bg-gray-100 animate-pulse rounded" /></Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">KYC Verification</h2>
        <p className="text-muted-foreground text-sm mt-1">Complete verification to host paid events and receive payouts. Documents are stored securely.</p>
      </div>

      {kyc && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{kyc.businessName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Submitted {new Date(kyc.createdAt).toLocaleDateString()}</p>
              {kyc.adminNote && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-muted-foreground border">
                  <span className="font-medium">Note from admin:</span> {kyc.adminNote}
                </div>
              )}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${KYC_STATUS_COLORS[kyc.status] || 'bg-gray-100'}`}>
              {kyc.status?.replace(/_/g, ' ')}
            </span>
          </div>
          {kyc.status === 'approved' && (
            <div className="mt-3 flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              Your identity has been verified. Verified badge granted!
            </div>
          )}
        </Card>
      )}

      {canSubmit && (
        <Card className="p-6">
          <h3 className="font-semibold mb-5">{kyc ? 'Resubmit KYC' : 'Submit KYC'}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Business / Full Legal Name *</Label>
                <Input value={form.businessName} onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))} placeholder="e.g. Acme Events LLC" className="mt-1" />
              </div>
              <div>
                <Label>Business Type</Label>
                <Select value={form.businessType} onValueChange={(v) => setForm((p) => ({ ...p, businessType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual / Sole Trader</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="nonprofit">Non-profit</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tax ID / EIN <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input value={form.taxId} onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))} placeholder="e.g. 12-3456789" className="mt-1" />
              </div>
              <div>
                <Label>Country *</Label>
                <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="US" className="mt-1" />
              </div>
              <div>
                <Label>Website <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://yoursite.com" className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label>Business Address</Label>
                <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="123 Main St, New York, NY 10001" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="mb-1.5 block">Government-issued ID *</Label>
                <input ref={idDocRef} type="file" accept="image/*,.pdf" aria-label="Upload government-issued ID" className="hidden" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => idDocRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-lg py-5 flex flex-col items-center gap-1 text-sm transition-colors ${idFile ? 'border-[#004406] bg-[#004406]/5 text-[#004406]' : 'border-gray-300 text-muted-foreground hover:border-[#004406]/50'}`}>
                  {idFile ? <><CheckCircle className="w-5 h-5" />{idFile.name}</> : <><Upload className="w-5 h-5" />Passport, Driver&apos;s License</>}
                </button>
                {kyc?.idDocumentUrl && !idFile && (
                  <a href={kyc.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 block">View current document</a>
                )}
              </div>
              <div>
                <Label className="mb-1.5 block">Business Document <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <input ref={bizDocRef} type="file" accept="image/*,.pdf" aria-label="Upload business document" className="hidden" onChange={(e) => setBizFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => bizDocRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-lg py-5 flex flex-col items-center gap-1 text-sm transition-colors ${bizFile ? 'border-[#004406] bg-[#004406]/5 text-[#004406]' : 'border-gray-300 text-muted-foreground hover:border-[#004406]/50'}`}>
                  {bizFile ? <><CheckCircle className="w-5 h-5" />{bizFile.name}</> : <><FileText className="w-5 h-5" />Business registration, etc.</>}
                </button>
                {kyc?.businessDocumentUrl && !bizFile && (
                  <a href={kyc.businessDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 block">View current document</a>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Your documents are encrypted and reviewed only by our compliance team. We never share your data with third parties.
            </div>

            {msg && (
              <p className={`text-sm font-medium ${msgType === 'success' ? 'text-[#004406]' : 'text-red-600'}`}>{msg}</p>
            )}

            <Button onClick={handleSubmit} disabled={submitting} className="bg-[#004406] hover:bg-[#003305] text-white">
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </Button>
          </div>
        </Card>
      )}

      {!canSubmit && kyc?.status !== 'approved' && (
        <Card className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Your submission is currently being reviewed. You&apos;ll be notified once a decision is made.</p>
        </Card>
      )}
    </div>
  );
}

// ── Admin Setup ───────────────────────────────────────────────────────────────
function AdminSetupButton() {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true); setMsg('');
    try {
      const res = await apiClient.post('/admin/setup');
      setMsg(res.data.message);
      setDone(true);
      await dispatch(fetchProfile());
    } catch (e: any) { setMsg(e.response?.data?.message || 'Setup failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  if (done) {
    return (
      <div>
        <p className="text-sm text-[#004406] font-medium mb-3">✅ {msg}</p>
        <a href="/admin/dashboard" className="inline-flex items-center px-4 py-2 bg-[#004406] text-white text-sm font-medium rounded-lg hover:bg-[#003305]">Go to Admin Dashboard →</a>
      </div>
    );
  }

  return (
    <>
      <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSetup} disabled={isLoading}>{isLoading ? 'Activating…' : 'Activate Admin Access'}</Button>
      {msg && <p className="text-sm text-destructive mt-2">{msg}</p>}
    </>
  );
}

// ── Organizer Request ─────────────────────────────────────────────────────────
function OrganizerRequestButton({ currentStatus }: { currentStatus?: string }) {
  const [status, setStatus] = useState(currentStatus || 'none');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleRequest = async () => {
    setIsLoading(true); setMsg('');
    try {
      const res = await apiClient.post('/auth/request-organizer');
      setStatus('pending');
      setMsg(res.data.message);
    } catch (e: any) { setMsg(e.response?.data?.message || 'Request failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  if (status === 'pending') return <p className="text-sm text-yellow-600 font-medium">⏳ Your organizer request is pending admin approval.</p>;
  if (status === 'approved') return <p className="text-sm text-[#004406] font-medium">✅ Organizer access approved.</p>;
  if (status === 'rejected') return <p className="text-sm text-destructive font-medium">❌ Your request was not approved. <a href="/help" className="underline">Contact support</a> for more info.</p>;

  return (
    <>
      <Button className="bg-[#004406] hover:bg-[#003305] text-white" onClick={handleRequest} disabled={isLoading}>{isLoading ? 'Submitting...' : 'Request Organizer Access'}</Button>
      {msg && <p className="text-sm text-[#004406] mt-2">{msg}</p>}
    </>
  );
}
