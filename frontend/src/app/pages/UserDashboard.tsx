import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Ticket, Heart, Calendar, CreditCard, Settings, Download, MapPin, User, Globe, Twitter, Linkedin, Instagram, ShieldCheck, QrCode, KeyRound } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMyOrders } from '../store/slices/ordersSlice';
import { updateUser, fetchProfile } from '../store/slices/authSlice';
import { TicketQRCode } from '../components/TicketQRCode';
import { PasswordInput, PasswordStrengthMeter, validatePassword } from '../components/PasswordInput';
import apiClient from '../api/client';

export function UserDashboard() {
  const location = useLocation();
  const sidebarItems = [
    { id: 'tickets', label: 'My Tickets', icon: Ticket, path: '/user/tickets' },
    { id: 'upcoming', label: 'Upcoming Events', icon: Calendar, path: '/user/upcoming' },
    { id: 'saved', label: 'Saved Events', icon: Heart, path: '/user/saved' },
    { id: 'payment', label: 'Payment History', icon: CreditCard, path: '/user/payment' },
    { id: 'profile', label: 'Profile Settings', icon: Settings, path: '/user/profile' },
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
              <Route index element={<MyTickets />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyTickets() {
  const dispatch = useAppDispatch();
  const { orders, tickets, isLoading, error } = useAppSelector((state) => state.orders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [transferOrderId, setTransferOrderId] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleTransfer = async (orderId: string) => {
    // Transfer is not yet supported — inform the user gracefully
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

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#004406] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="text-center py-12 text-destructive">{error}</div>;

  const upcoming = orders.filter((o: any) => o.status === 'completed' && new Date(o.event?.startDate) >= new Date());
  const past = orders.filter((o: any) => o.status === 'completed' && new Date(o.event?.startDate) < new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">My Tickets</h2><p className="text-muted-foreground">View and manage your event tickets</p></div>
      </div>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past Events ({past.length})</TabsTrigger>
        </TabsList>
        {[{ value: 'upcoming', list: upcoming }, { value: 'past', list: past }].map(({ value, list }) => (
          <TabsContent key={value} value={value} className="mt-6">
            {list.length === 0 ? (
              <div className="text-center py-12"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><h3 className="font-semibold mb-2">No {value} events</h3></div>
            ) : (
              <div className="space-y-4">
                {list.map((order: any) => (
                  <Card key={order._id} className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{order.event?.title}</h3>
                            <Badge className="bg-[#004406] text-white">{actionMsg[order._id] ? 'Action Taken' : 'Confirmed'}</Badge>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                            <Download className="w-4 h-4 mr-2" />{expandedOrder === order._id ? 'Hide' : 'Show'} Tickets
                          </Button>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground mt-4">
                          {order.event?.startDate && <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{formatDate(order.event.startDate)}</span></div>}
                          {order.event?.location?.venue && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{order.event.location.venue}</span></div>}
                          <div className="flex items-center gap-2"><Ticket className="w-4 h-4" />{order.items?.map((item: any, i: number) => <span key={i}>{item.quantity}x {item.ticketType?.name}</span>)}</div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div><span className="text-sm text-muted-foreground">Total Paid</span><span className="ml-2 font-semibold text-lg">${order.totalAmount?.toFixed(2)}</span></div>
                          <div className="text-xs text-muted-foreground">{order.orderNumber}</div>
                        </div>

                        {expandedOrder === order._id && (
                          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 justify-center">
                            {/* Tickets with QR codes are fetched from the order detail endpoint */}
                            <p className="text-sm text-muted-foreground">QR codes are available after check-in confirmation from the organizer.</p>
                          </div>
                        )}

                        {!actionMsg[order._id] && value === 'upcoming' && (
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
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

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

function SavedEvents() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Saved Events</h2>
      <p className="text-muted-foreground">Events you've favorited will appear here once the save feature is connected to your account.</p>
    </Card>
  );
}

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

  // 2FA state
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFAMsg, setTwoFAMsg] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.totpEnabled ?? false);

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
      setTwoFAEnabled(user.totpEnabled ?? false);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async () => {
    setProfileError('');
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setProfileError('First and last name are required.');
      return;
    }
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName.trim());
      formData.append('lastName', form.lastName.trim());
      formData.append('phone', form.phone.trim());
      formData.append('bio', form.bio.trim());
      formData.append('socialLinks[website]', form.website.trim());
      formData.append('socialLinks[twitter]', form.twitter.trim());
      formData.append('socialLinks[linkedin]', form.linkedin.trim());
      formData.append('socialLinks[instagram]', form.instagram.trim());
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await apiClient.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(updateUser(res.data.user));
      setAvatarFile(null);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e: any) {
      setProfileError(e.response?.data?.message || 'Failed to save profile.');
    } finally {
      setProfileLoading(false);
    }
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
    } catch (e: any) {
      setPwError(e.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handle2FASetup = async () => {
    setTwoFALoading(true); setTwoFAMsg('');
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      setQrCode(res.data.qrCode);
      setManualKey(res.data.manualKey);
      setTwoFAStep('verify');
    } catch (e: any) {
      setTwoFAMsg(e.response?.data?.message || 'Setup failed.');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (!totpCode.trim()) return;
    setTwoFALoading(true); setTwoFAMsg('');
    try {
      const res = await apiClient.post('/auth/2fa/verify', { token: totpCode });
      setBackupCodes(res.data.backupCodes || []);
      setTwoFAEnabled(true);
      setTwoFAStep('idle');
      setTotpCode('');
      dispatch(fetchProfile());
    } catch (e: any) {
      setTwoFAMsg(e.response?.data?.message || 'Invalid code.');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FADisable = async () => {
    if (!totpCode.trim()) return;
    setTwoFALoading(true); setTwoFAMsg('');
    try {
      await apiClient.post('/auth/2fa/disable', { token: totpCode });
      setTwoFAEnabled(false);
      setTwoFAStep('idle');
      setTotpCode('');
      dispatch(fetchProfile());
    } catch (e: any) {
      setTwoFAMsg(e.response?.data?.message || 'Invalid code.');
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
        <div className="space-y-5">
          {/* Avatar */}
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
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
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
          {/* Social Links */}
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
                  <Input
                    value={(form as any)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="pl-9"
                  />
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
          <p className="text-sm text-muted-foreground mb-4">Want to create and host events? Request organizer access — an admin will review your request.</p>
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

      {/* 2FA */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#004406]" />
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
          <Badge className={twoFAEnabled ? 'bg-[#004406]/10 text-[#004406]' : 'bg-gray-100 text-gray-600'}>
            {twoFAEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account using an authenticator app like Google Authenticator or Authy.</p>

        {backupCodes.length > 0 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-semibold text-sm mb-2 text-amber-800">Save your backup codes — each can only be used once:</p>
            <div className="grid grid-cols-2 gap-1">
              {backupCodes.map((code) => (
                <code key={code} className="text-xs font-mono bg-white border rounded px-2 py-1">{code}</code>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setBackupCodes([])}>I've saved these codes</Button>
          </div>
        )}

        {twoFAStep === 'idle' && (
          <div className="flex gap-2">
            {!twoFAEnabled ? (
              <Button onClick={() => { setTwoFAStep('setup'); handle2FASetup(); }} className="bg-[#004406] hover:bg-[#003305] text-white" disabled={twoFALoading}>
                <QrCode className="w-4 h-4 mr-2" />
                {twoFALoading ? 'Loading…' : 'Set Up 2FA'}
              </Button>
            ) : (
              <Button variant="outline" className="text-red-600 border-red-200" onClick={() => setTwoFAStep('disable')}>
                Disable 2FA
              </Button>
            )}
          </div>
        )}

        {twoFAStep === 'verify' && qrCode && (
          <div className="space-y-4">
            <p className="text-sm font-medium">1. Scan this QR code with your authenticator app:</p>
            <img src={qrCode} alt="QR code" className="w-48 h-48 border rounded" />
            <p className="text-xs text-muted-foreground">Or enter the key manually: <code className="font-mono bg-gray-100 px-1 rounded">{manualKey}</code></p>
            <p className="text-sm font-medium">2. Enter the 6-digit code shown in your app:</p>
            <div className="flex gap-2 items-center">
              <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="123456" maxLength={6} className="w-32 font-mono text-center text-lg" />
              <Button onClick={handle2FAVerify} className="bg-[#004406] text-white" disabled={twoFALoading || totpCode.length < 6}>
                {twoFALoading ? 'Verifying…' : 'Verify & Enable'}
              </Button>
              <Button variant="ghost" onClick={() => { setTwoFAStep('idle'); setTotpCode(''); setTwoFAMsg(''); }}>Cancel</Button>
            </div>
            {twoFAMsg && <p className="text-sm text-red-600">{twoFAMsg}</p>}
          </div>
        )}

        {twoFAStep === 'disable' && (
          <div className="space-y-3">
            <p className="text-sm">Enter your current authenticator code to disable 2FA:</p>
            <div className="flex gap-2 items-center">
              <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="123456" maxLength={6} className="w-32 font-mono text-center text-lg" />
              <Button onClick={handle2FADisable} variant="outline" className="text-red-600 border-red-200" disabled={twoFALoading || totpCode.length < 6}>
                {twoFALoading ? 'Disabling…' : 'Disable 2FA'}
              </Button>
              <Button variant="ghost" onClick={() => { setTwoFAStep('idle'); setTotpCode(''); setTwoFAMsg(''); }}>Cancel</Button>
            </div>
            {twoFAMsg && <p className="text-sm text-red-600">{twoFAMsg}</p>}
          </div>
        )}
      </Card>

      {/* Change password */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-5 h-5 text-[#004406]" />
          <h3 className="text-lg font-semibold">Change Password</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <PasswordInput value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="Enter current password" />
          </div>
          <div>
            <Label>New Password</Label>
            <PasswordInput value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="Enter new password" />
            <PasswordStrengthMeter password={pw.next} />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <PasswordInput value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" />
          </div>
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

function AdminSetupButton() {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    setMsg('');
    try {
      const res = await apiClient.post('/admin/setup');
      setMsg(res.data.message);
      setDone(true);
      // Refresh Redux user state so the new role takes effect immediately
      await dispatch(fetchProfile());
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div>
        <p className="text-sm text-[#004406] font-medium mb-3">✅ {msg}</p>
        <a href="/admin/dashboard" className="inline-flex items-center px-4 py-2 bg-[#004406] text-white text-sm font-medium rounded-lg hover:bg-[#003305]">
          Go to Admin Dashboard →
        </a>
      </div>
    );
  }

  return (
    <>
      <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSetup} disabled={isLoading}>
        {isLoading ? 'Activating…' : 'Activate Admin Access'}
      </Button>
      {msg && <p className="text-sm text-destructive mt-2">{msg}</p>}
    </>
  );
}

function OrganizerRequestButton({ currentStatus }: { currentStatus?: string }) {
  const [status, setStatus] = useState(currentStatus || 'none');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleRequest = async () => {
    setIsLoading(true);
    setMsg('');
    try {
      const res = await apiClient.post('/auth/request-organizer');
      setStatus('pending');
      setMsg(res.data.message);
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'pending') return <p className="text-sm text-yellow-600 font-medium">⏳ Your organizer request is pending admin approval.</p>;
  if (status === 'approved') return <p className="text-sm text-[#004406] font-medium">✅ Organizer access approved.</p>;
  if (status === 'rejected') return <p className="text-sm text-destructive font-medium">❌ Your request was not approved. <a href="/help" className="underline">Contact support</a> for more info.</p>;

  return (
    <>
      <Button className="bg-[#004406] hover:bg-[#003305] text-white" onClick={handleRequest} disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Request Organizer Access'}
      </Button>
      {msg && <p className="text-sm text-[#004406] mt-2">{msg}</p>}
    </>
  );
}
