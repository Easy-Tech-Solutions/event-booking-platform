import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAppSelector } from '../store';
import { Button } from './ui/button';
import { ShieldX, Home, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'attendee' | 'organizer' | 'admin' | 'superadmin' | 'support_agent';
}

function AccessDenied({ requiredRole }: { requiredRole?: string }) {
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  const roleLabel: Record<string, string> = {
    superadmin: 'Super Administrator',
    admin: 'Administrator',
    support_agent: 'Support Agent',
    organizer: 'Event Organizer',
    attendee: 'Attendee',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Access Denied</h1>
        <p className="text-muted-foreground mb-2">
          You don't have permission to view this page.
        </p>
        {requiredRole && (
          <p className="text-sm text-muted-foreground mb-8">
            This area requires{' '}
            <span className="font-semibold text-gray-700">
              {roleLabel[requiredRole] ?? requiredRole}
            </span>{' '}
            access. Your current role is{' '}
            <span className="font-semibold text-gray-700">
              {roleLabel[user?.role ?? ''] ?? user?.role ?? 'unknown'}
            </span>
            .
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button
            className="bg-[#004406] hover:bg-[#003305] text-white"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#004406] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <AccessDenied requiredRole={requiredRole} />;
  }

  return <>{children}</>;
}
