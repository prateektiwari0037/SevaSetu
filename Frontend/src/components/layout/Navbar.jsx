import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  MapPin,
  Globe,
  Bell,
  User,
  LogOut,
  AlertCircle,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth, getDashboardRoute } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Navbar() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [userPincode, setUserPincode] = useState(() => localStorage.getItem('sevasetu_pincode') || '400001');
  const [pincodeModalOpen, setPincodeModalOpen] = useState(false);
  const [tempPincode, setTempPincode] = useState('');
  const navigate = useNavigate();

  const handleSavePincode = (e) => {
    e.preventDefault();
    if (tempPincode.trim().length === 6) {
      setUserPincode(tempPincode.trim());
      localStorage.setItem('sevasetu_pincode', tempPincode.trim());
      setPincodeModalOpen(false);
    }
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem('sevasetu_lat', pos.coords.latitude);
          localStorage.setItem('sevasetu_lon', pos.coords.longitude);
          setUserPincode('GPS Locked');
          setPincodeModalOpen(false);
        },
        () => {
          alert('Location permission denied. Please enter your 6-digit pincode manually.');
        }
      );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-nav border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Seva<span className="text-primary-600">Setu</span>
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider -mt-1">
                    Hyperlocal Marketplace
                  </span>
                </div>
              </Link>

              {/* Location Badge */}
              <button
                onClick={() => setPincodeModalOpen(true)}
                className="hidden md:flex items-center text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-primary-600 mr-1.5" />
                <span>{userPincode}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-700">
              <Link to="/services" className="hover:text-primary-600 transition">
                {t('navServices')}
              </Link>
              <Link to="/providers" className="hover:text-primary-600 transition">
                {t('navProviders')}
              </Link>
              <Link to="/shops" className="hover:text-primary-600 transition">
                {t('navShops')}
              </Link>
              <Link to="/about" className="hover:text-primary-600 transition">
                {t('navAbout')}
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Emergency SOS Button */}
              <Link
                to={isAuthenticated && role === 'CUSTOMER' ? '/customer/emergency' : '/login?redirect=/customer/emergency'}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full transition animate-pulse"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span>{t('navEmergency')}</span>
              </Link>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                title="Switch Language / भाषा बदलें"
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
              </button>

              {isAuthenticated ? (
                <>
                  {/* Notifications Icon */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setNotificationDropdownOpen(!notificationDropdownOpen);
                        setUserDropdownOpen(false);
                      }}
                      className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {notificationDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Notifications ({unreadCount})
                          </span>
                          <Link
                            to={role === 'CUSTOMER' ? '/customer/notifications' : '/provider/notifications'}
                            onClick={() => setNotificationDropdownOpen(false)}
                            className="text-xs text-primary-600 hover:underline font-medium"
                          >
                            View all
                          </Link>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {notifications.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">No new notifications</p>
                          ) : (
                            notifications.slice(0, 5).map((n) => (
                              <div
                                key={n.id}
                                onClick={() => {
                                  if (!n.isRead) markAsRead(n.id);
                                  if (n.link) navigate(n.link);
                                  setNotificationDropdownOpen(false);
                                }}
                                className={`p-2.5 rounded-xl cursor-pointer text-left transition ${
                                  n.isRead ? 'bg-slate-50 opacity-70' : 'bg-primary-50/50 hover:bg-primary-50'
                                }`}
                              >
                                <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                                <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(!userDropdownOpen);
                        setNotificationDropdownOpen(false);
                      }}
                      className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                        <div className="px-3 py-2 border-b border-slate-100 mb-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-primary-100 text-primary-700 rounded-md">
                            {role}
                          </span>
                        </div>
                        <Link
                          to={getDashboardRoute(role)}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                        >
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="flex items-center w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-primary-600 transition"
                  >
                    {t('navLogin')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition"
                  >
                    {t('navRegister')}
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-primary-600"
            >
              {t('navServices')}
            </Link>
            <Link
              to="/providers"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-primary-600"
            >
              {t('navProviders')}
            </Link>
            <Link
              to="/shops"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-primary-600"
            >
              {t('navShops')}
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-primary-600"
            >
              {t('navAbout')}
            </Link>
            {isAuthenticated && (
              <Link
                to={getDashboardRoute(role)}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-primary-600"
              >
                Go to Dashboard ({role})
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Pincode Selection Modal */}
      {pincodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <MapPin className="w-4 h-4 text-primary-600 mr-2" /> Select Your Location
              </h3>
              <button onClick={() => setPincodeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter your 6-digit delivery pincode to discover verified technicians and shops in your neighborhood.
            </p>
            <form onSubmit={handleSavePincode} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={tempPincode}
                onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 400001"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs rounded-xl shadow-xs"
              >
                Update Pincode
              </button>
            </form>
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                onClick={handleDetectLocation}
                className="text-xs text-primary-600 hover:underline font-semibold flex items-center justify-center mx-auto"
              >
                <MapPin className="w-3.5 h-3.5 mr-1" /> Use My Current GPS Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
