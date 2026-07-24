import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Calendar,
  Tags,
  CreditCard,
  Settings,
  Tag,
  Link as LinkIcon,
  Star,
  Sparkles,
} from 'lucide-react';

import MyOrders from '../components/Dashboard/MyOrders';
import MyEvents from '../components/Dashboard/MyEvents';
import CreateEvent from '../components/Dashboard/CreateEvent';
import Categories from '../components/Dashboard/Categories';
import PromoCodes from '../components/Dashboard/PromoCodes';
import TrackingLinks from '../components/Dashboard/TrackingLinks';
import VIPComp from '../components/Dashboard/VIPComp';
import AIDescription from '../components/Dashboard/AIDescription';
import EditEvent from './EditEvent';

const NavItem = ({ href, icon: Icon, label, current }) => (
  <Link
    to={href}
    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      current ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Icon className="h-5 w-5 flex-shrink-0" />
    <span>{label}</span>
  </Link>
);

const Dashboard = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
  const path = location.pathname;

  const attendeeNav = [
    { name: 'Orders', href: '/dashboard/orders', icon: CreditCard },
    { name: 'Profile', href: '/dashboard/profile', icon: Settings },
  ];

  const organizerNav = [
    { name: 'My Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Create Event', href: '/dashboard/create-event', icon: Calendar },
    { name: 'Categories', href: '/dashboard/categories', icon: Tags },
    { name: 'Promo Codes', href: '/dashboard/promo-codes', icon: Tag },
    { name: 'Tracking Links', href: '/dashboard/tracking-links', icon: LinkIcon },
    { name: 'VIP & Comp', href: '/dashboard/vip-comp', icon: Star },
    { name: 'AI Content', href: '/dashboard/ai-content', icon: Sparkles },
  ];

  const navigation = isOrganizer
    ? [...attendeeNav.slice(0, 1), ...organizerNav, attendeeNav[1]]
    : attendeeNav;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {navigation.map((item) => (
                  <NavItem
                    key={item.name}
                    href={item.href}
                    icon={item.icon}
                    label={item.name}
                    current={path === item.href || path.startsWith(item.href + '/')}
                  />
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Routes>
              <Route index element={<MyOrders />} />
              <Route path="orders" element={<MyOrders />} />

              {isOrganizer && (
                <>
                  <Route path="events" element={<MyEvents />} />
                  <Route path="create-event" element={<CreateEvent />} />
                  <Route path="edit-event/:id" element={<EditEvent />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="promo-codes" element={<PromoCodes />} />
                  <Route path="tracking-links" element={<TrackingLinks />} />
                  <Route path="vip-comp" element={<VIPComp />} />
                  <Route path="ai-content" element={<AIDescription />} />
                </>
              )}

              <Route
                path="profile"
                element={
                  <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
                    <p className="text-gray-500 mt-2 text-sm">Profile management coming soon.</p>
                  </div>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
