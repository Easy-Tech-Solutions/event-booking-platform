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

export const router = createBrowserRouter([
  { path: '/', Component: LandingPage },
  { path: '/discover', Component: EventDiscovery },
  { path: '/event/:id', Component: EventDetails },
  { path: '/help', Component: HelpCenter },
  { path: '/signin', Component: SignIn },
  { path: '/signup', Component: SignUp },
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
