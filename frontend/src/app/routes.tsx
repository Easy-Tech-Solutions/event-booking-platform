import { createBrowserRouter } from 'react-router';
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

export const router = createBrowserRouter([
  { path: '/', Component: LandingPage },
  { path: '/discover', Component: EventDiscovery },
  { path: '/event/:id', Component: EventDetails },
  { path: '/help', Component: HelpCenter },
  { path: '/signin', Component: SignIn },
  { path: '/signup', Component: SignUp },
  { path: '/verify-email/:token', Component: VerifyEmail },
  { path: '/reset-password/:token', Component: ResetPassword },
  { path: '/forgot-password', Component: ForgotPassword },
  {
    path: '/book/:id',
    element: <ProtectedRoute><BookingFlow /></ProtectedRoute>,
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
