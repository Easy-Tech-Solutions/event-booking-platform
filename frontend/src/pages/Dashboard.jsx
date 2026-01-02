import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, Users, CreditCard, Settings } from 'lucide-react';
import MyOrders from '../components/Dashboard/MyOrders';
import MyEvents from '../components/Dashboard/MyEvents';
import CreateEvent from '../components/Dashboard/CreateEvent';
import EditEvent from './EditEvent';

const Dashboard = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    { name: 'Orders', href: '/dashboard/orders', icon: CreditCard, current: location.pathname === '/dashboard/orders' },
    ...(user?.role === 'organizer' || user?.role === 'admin' ? [
      { name: 'My Events', href: '/dashboard/events', icon: Calendar, current: location.pathname === '/dashboard/events' },
      { name: 'Create Event', href: '/dashboard/create-event', icon: Calendar, current: location.pathname === '/dashboard/create-event' },
    ] : []),
    { name: 'Profile', href: '/dashboard/profile', icon: Settings, current: location.pathname === '/dashboard/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        item.current
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Routes>
              <Route index element={<MyOrders />} />
              <Route path="orders" element={<MyOrders />} />
              {(user?.role === 'organizer' || user?.role === 'admin') && (
                <>
                  <Route path="events" element={<MyEvents />} />
                  <Route path="create-event" element={<CreateEvent />} />
                  <Route path="edit-event/:id" element={<EditEvent />} />
                </>
              )}
              <Route path="profile" element={<div className="card"><h2 className="text-xl font-semibold">Profile Settings</h2><p className="text-gray-600 mt-2">Profile management coming soon...</p></div>} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;