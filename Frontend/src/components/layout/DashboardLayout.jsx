import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Wrench,
  LayoutDashboard,
  CalendarCheck,
  FileText,
  AlertCircle,
  MapPin,
  Star,
  Layers,
  Heart,
  LifeBuoy,
  User,
  Settings,
  Briefcase,
  DollarSign,
  ShieldCheck,
  Clock,
  Store,
  Users,
  CheckCircle,
  Grid,
  CreditCard,
  BarChart3,
  Sliders,
  LogOut,
  Bell,
  Menu,
  X,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';

export default function DashboardLayout() {
  const { user, role, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation configurations per role
  const customerLinks = [
    { name: t('cNavDashboard'), path: '/customer/dashboard', icon: LayoutDashboard },
    { name: t('cNavServices'), path: '/customer/services', icon: Wrench },
    { name: t('cNavProviders'), path: '/customer/providers', icon: Users },
    { name: t('cNavBookings'), path: '/customer/bookings', icon: CalendarCheck },
    { name: t('cNavEmergency'), path: '/customer/emergency', icon: AlertCircle, alert: true },
    { name: t('cNavFavorites'), path: '/customer/favorites', icon: Heart },
    { name: t('cNavReviews'), path: '/customer/reviews', icon: Star },
    { name: t('cNavAddresses'), path: '/customer/addresses', icon: MapPin },
    { name: t('cNavNotifications'), path: '/customer/notifications', icon: Bell, badge: unreadCount },
    { name: t('cNavComplaints'), path: '/customer/complaints', icon: LifeBuoy },
    { name: t('cNavSubscriptions'), path: '/customer/subscriptions', icon: Layers },
    { name: t('cNavProfile'), path: '/customer/profile', icon: User },
    { name: t('cNavSettings'), path: '/customer/settings', icon: Settings },
  ];

  const providerLinks = [
    { name: 'Dashboard', path: '/provider/dashboard', icon: LayoutDashboard },
    { name: 'Booking Requests', path: '/provider/bookings', icon: CalendarCheck },
    { name: 'Multiple Quotations', path: '/provider/quotations', icon: FileText },
    { name: 'My Services', path: '/provider/services', icon: Briefcase },
    { name: 'Add Service', path: '/provider/services/add', icon: Wrench },
    { name: 'Availability', path: '/provider/availability', icon: Clock },
    { name: 'Earnings & Payouts', path: '/provider/earnings', icon: DollarSign },
    { name: 'Verification Desk', path: '/provider/verification', icon: ShieldCheck },
    { name: 'Customer Reviews', path: '/provider/reviews', icon: Star },
    { name: 'Provider Profile', path: '/provider/profile', icon: User },
    { name: 'Settings', path: '/provider/settings', icon: Settings },
  ];

  const shopLinks = [
    { name: 'Dashboard', path: '/shop/dashboard', icon: LayoutDashboard },
    { name: 'Catalog Management', path: '/shop/catalog', icon: Store },
    { name: 'Customer Inquiries', path: '/shop/inquiries', icon: LifeBuoy },
    { name: 'Shop Verification', path: '/shop/verification', icon: ShieldCheck },
    { name: 'Shop Profile', path: '/shop/profile', icon: User },
    { name: 'Settings', path: '/shop/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'Dashboard Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Provider Management', path: '/admin/providers', icon: Briefcase },
    { name: 'Verification Desk', path: '/admin/verifications', icon: CheckCircle },
    { name: 'Category Management', path: '/admin/categories', icon: Grid },
    { name: 'Service Management', path: '/admin/services', icon: Layers },
    { name: 'Booking Monitor', path: '/admin/bookings', icon: CalendarCheck },
    { name: 'Quotation Monitor', path: '/admin/quotations', icon: FileText },
    { name: 'Shop Management', path: '/admin/shops', icon: Store },
    { name: 'Complaints Resolution', path: '/admin/complaints', icon: LifeBuoy },
    { name: 'Payments & Comm.', path: '/admin/payments', icon: CreditCard },
    { name: 'Subscription Plans', path: '/admin/subscriptions', icon: Layers },
    { name: 'Analytics & Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Platform Settings', path: '/admin/settings', icon: Sliders },
  ];

  let currentLinks = customerLinks;
  if (role === 'PROVIDER') currentLinks = providerLinks;
  else if (role === 'SHOP_OWNER') currentLinks = shopLinks;
  else if (role === 'ADMIN') currentLinks = adminLinks;

  // Highlight the most specific link matching the current path (so /customer/bookings/123
  // highlights "My Bookings", and /provider/services/add highlights "Add Service" only).
  const activePath = currentLinks
    .map((l) => l.path)
    .filter((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];

  const roleBadgeColors = {
    ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    PROVIDER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    SHOP_OWNER: 'bg-blue-100 text-blue-700 border-blue-200',
    CUSTOMER: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-lg">
            Seva<span className="text-primary-600">Setu</span>
          </span>
        </Link>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">
                Seva<span className="text-primary-600">Setu</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider -mt-1">
                Portal Desk
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div className="p-3.5 mx-3 mt-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user?.customerProfile?.fullName ||
                user?.providerProfile?.fullName ||
                user?.shopProfile?.shopName ||
                user?.adminProfile?.fullName ||
                user?.email}
            </p>
            <span
              className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                roleBadgeColors[role] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {currentLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === activePath;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2 text-xs font-medium rounded-xl transition ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-xs font-semibold'
                    : item.alert
                    ? 'text-red-700 bg-red-50 hover:bg-red-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mr-2.5 shrink-0 ${
                    isActive ? 'text-white' : item.alert ? 'text-red-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {item.badge > 0 && (
                  <span
                    className={`ml-auto min-w-[1.25rem] px-1 text-center rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-red-600 text-white'
                    }`}
                    aria-label={`${item.badge} unread`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Bar in Sidebar */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <button
            onClick={toggleLanguage}
            className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <Globe className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Language: {lang === 'en' ? 'English' : 'हिन्दी'}</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4 mr-2.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="hidden lg:flex items-center justify-between h-16 bg-white border-b border-slate-200 px-8 sticky top-0 z-20">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-primary-600">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium capitalize">
              {location.pathname.split('/')[1]}
            </span>
            <span>/</span>
            <span className="text-primary-600 font-semibold capitalize">
              {location.pathname.split('/')[2]?.replace('-', ' ') || 'Overview'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to={role === 'CUSTOMER' ? '/customer/notifications' : '/provider/notifications'}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 hover:text-primary-600 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50"
            >
              Public Website
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden"
        />
      )}
    </div>
  );
}
