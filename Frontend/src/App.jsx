import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Route Guards
import { PublicRoute } from './routes/PublicRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleBasedRoute } from './routes/RoleBasedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import ServiceDetail from './pages/public/ServiceDetail';
import Providers from './pages/public/Providers';
import ProviderDetail from './pages/public/ProviderDetail';
import Shops from './pages/public/Shops';
import ShopDetail from './pages/public/ShopDetail';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import Contact from './pages/public/Contact';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import Terms from './pages/public/Terms';
import Forbidden from './pages/public/Forbidden';
import NotFound from './pages/public/NotFound';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerBookings from './pages/customer/CustomerBookings';
import BookingDetails from './pages/customer/BookingDetails';
import BookService from './pages/customer/BookService';
import CompareQuotations from './pages/customer/CompareQuotations';
import EmergencyBooking from './pages/customer/EmergencyBooking';
import Addresses from './pages/customer/Addresses';
import Favorites from './pages/customer/Favorites';
import CustomerReviews from './pages/customer/CustomerReviews';
import CustomerNotifications from './pages/customer/CustomerNotifications';
import CustomerSubscriptions from './pages/customer/CustomerSubscriptions';
import CustomerComplaints from './pages/customer/CustomerComplaints';
import CustomerSupport from './pages/customer/CustomerSupport';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerSettings from './pages/customer/CustomerSettings';

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderBookings from './pages/provider/ProviderBookings';
import ProviderBookingDetails from './pages/provider/ProviderBookingDetails';
import ProviderQuotations from './pages/provider/ProviderQuotations';
import ProviderServices from './pages/provider/ProviderServices';
import AddProviderService from './pages/provider/AddProviderService';
import ProviderAvailability from './pages/provider/ProviderAvailability';
import ProviderEarnings from './pages/provider/ProviderEarnings';
import ProviderVerification from './pages/provider/ProviderVerification';
import ProviderReviews from './pages/provider/ProviderReviews';
import ProviderProfile from './pages/provider/ProviderProfile';
import ProviderSettings from './pages/provider/ProviderSettings';

// Shop Owner Pages
import ShopDashboard from './pages/shop/ShopDashboard';
import ShopCatalog from './pages/shop/ShopCatalog';
import ShopInquiries from './pages/shop/ShopInquiries';
import ShopVerification from './pages/shop/ShopVerification';
import ShopProfile from './pages/shop/ShopProfile';
import ShopSettings from './pages/shop/ShopSettings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProviders from './pages/admin/AdminProviders';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminCategories from './pages/admin/AdminCategories';
import AdminServices from './pages/admin/AdminServices';
import AdminBookings from './pages/admin/AdminBookings';
import AdminQuotations from './pages/admin/AdminQuotations';
import AdminShops from './pages/admin/AdminShops';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <Routes>
      {/* Public Pages Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/providers/:id" element={<ProviderDetail />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/shops/:id" element={<ShopDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Public-only Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Fallbacks under Public Layout */}
        <Route path="/forbidden" element={<Forbidden />} />
      </Route>

      {/* Customer Panel */}
      <Route
        path="/customer"
        element={
          <RoleBasedRoute allowedRoles={['CUSTOMER']}>
            <DashboardLayout />
          </RoleBasedRoute>
        }
      >
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="bookings" element={<CustomerBookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="book" element={<BookService />} />
        <Route path="quotations" element={<CompareQuotations />} />
        <Route path="emergency" element={<EmergencyBooking />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="reviews" element={<CustomerReviews />} />
        <Route path="notifications" element={<CustomerNotifications />} />
        <Route path="subscriptions" element={<CustomerSubscriptions />} />
        <Route path="complaints" element={<CustomerComplaints />} />
        <Route path="support" element={<CustomerSupport />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="settings" element={<CustomerSettings />} />
      </Route>

      {/* Provider Panel */}
      <Route
        path="/provider"
        element={
          <RoleBasedRoute allowedRoles={['PROVIDER']}>
            <DashboardLayout />
          </RoleBasedRoute>
        }
      >
        <Route index element={<Navigate to="/provider/dashboard" replace />} />
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="bookings" element={<ProviderBookings />} />
        <Route path="bookings/:id" element={<ProviderBookingDetails />} />
        <Route path="quotations" element={<ProviderQuotations />} />
        <Route path="services" element={<ProviderServices />} />
        <Route path="services/add" element={<AddProviderService />} />
        <Route path="availability" element={<ProviderAvailability />} />
        <Route path="earnings" element={<ProviderEarnings />} />
        <Route path="verification" element={<ProviderVerification />} />
        <Route path="reviews" element={<ProviderReviews />} />
        <Route path="profile" element={<ProviderProfile />} />
        <Route path="settings" element={<ProviderSettings />} />
      </Route>

      {/* Shop Owner Panel */}
      <Route
        path="/shop"
        element={
          <RoleBasedRoute allowedRoles={['SHOP_OWNER']}>
            <DashboardLayout />
          </RoleBasedRoute>
        }
      >
        <Route index element={<Navigate to="/shop/dashboard" replace />} />
        <Route path="dashboard" element={<ShopDashboard />} />
        <Route path="catalog" element={<ShopCatalog />} />
        <Route path="inquiries" element={<ShopInquiries />} />
        <Route path="verification" element={<ShopVerification />} />
        <Route path="profile" element={<ShopProfile />} />
        <Route path="settings" element={<ShopSettings />} />
      </Route>

      {/* Admin Panel */}
      <Route
        path="/admin"
        element={
          <RoleBasedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </RoleBasedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="providers" element={<AdminProviders />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="quotations" element={<AdminQuotations />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="complaints" element={<AdminComplaints />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
