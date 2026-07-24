import { createBrowserRouter } from 'react-router';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;
import { LandingPage } from './pages/LandingPage';
import { EventDiscovery } from './pages/EventDiscovery';
import { EventDetails } from './pages/EventDetails';
import { BookingFlow } from './pages/BookingFlow';
import { UserDashboard } from './pages/UserDashboard';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { HelpCenter } from './pages/HelpCenter';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';
import { VerifyEmail } from './pages/VerifyEmail';
import { ResetPassword } from './pages/ResetPassword';
import { ForgotPassword } from './pages/ForgotPassword';
import { CreateEventPage } from './pages/CreateEventPage';
import { LiveEventRoom } from './pages/LiveEventRoom';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ContactPage } from './pages/ContactPage';

export const router = createBrowserRouter([
  { path: '/', Component: LandingPage },
  { path: '/discover', Component: EventDiscovery },
  { path: '/event/:id', Component: EventDetails },
  { path: '/help', Component: HelpCenter },
  { path: '/contact', Component: ContactPage },
  { path: '/blog', Component: BlogPage },
  { path: '/blog/:slug', Component: BlogPostPage },
  { path: '/signin', Component: SignIn },
  { path: '/signup', Component: SignUp },
  { path: '/verify-email/:token', Component: VerifyEmail },
  { path: '/reset-password/:token', Component: ResetPassword },
  { path: '/forgot-password', Component: ForgotPassword },
  {
    path: '/book/:id',
    element: (
      <ProtectedRoute>
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <BookingFlow />
          </Elements>
        ) : (
          <div className="min-h-screen flex items-center justify-center text-center p-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">Stripe not configured</h2>
              <p className="text-muted-foreground">The <code>VITE_STRIPE_PUBLISHABLE_KEY</code> environment variable is missing. Add it to your Vercel project settings or local .env file.</p>
            </div>
          </div>
        )}
      </ProtectedRoute>
    ),
  },
  {
    path: '/live/:sessionId',
    element: <ProtectedRoute><LiveEventRoom /></ProtectedRoute>,
  },
  {
    path: '/user/*',
    element: <ProtectedRoute><UserDashboard /></ProtectedRoute>,
  },
  {
    path: '/user',
    element: <ProtectedRoute><UserDashboard /></ProtectedRoute>,
  },
  // Standalone multi-step event creation wizard (has its own Navbar)
  // Must be declared before /organizer/* so it takes precedence over the wildcard
  {
    path: '/organizer/create',
    element: <ProtectedRoute requiredRole="organizer"><CreateEventPage /></ProtectedRoute>,
  },
  {
    path: '/organizer/*',
    element: <ProtectedRoute requiredRole="organizer"><OrganizerDashboard /></ProtectedRoute>,
  },
  {
    path: '/organizer',
    element: <ProtectedRoute requiredRole="organizer"><OrganizerDashboard /></ProtectedRoute>,
  },
  // Admin and superadmin can access admin dashboard
  {
    path: '/admin/*',
    element: <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/admin',
    element: <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>,
  },
  { path: '*', Component: NotFound },
]);
