import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-md">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Seva<span className="text-primary-400">Setu</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed pr-6">
              {t('footerDesc')}
            </p>
            <div className="flex items-center space-x-2 text-xs text-primary-400 font-semibold bg-primary-950/50 border border-primary-900/60 px-3 py-2 rounded-xl w-fit">
              <ShieldCheck className="w-4 h-4 text-primary-400" />
              <span>100% Verified Providers & 30-Day Service Warranty</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Explore Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/services" className="hover:text-primary-400 transition">
                  All Service Categories
                </Link>
              </li>
              <li>
                <Link to="/providers" className="hover:text-primary-400 transition">
                  Verified Local Providers
                </Link>
              </li>
              <li>
                <Link to="/shops" className="hover:text-primary-400 transition">
                  Nearby Spare Parts Shops
                </Link>
              </li>
              <li>
                <Link to="/customer/emergency" className="hover:text-red-400 transition text-red-400 font-medium">
                  Emergency SOS Requests
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/about" className="hover:text-primary-400 transition">
                  About SevaSetu
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-400 transition">
                  Customer Grievance & Support
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-primary-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary-400 transition">
                  Terms & Service Warranties
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Helpline & Contacts</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <p className="flex items-center">
                <Phone className="w-4 h-4 text-primary-400 mr-2 shrink-0" />
                <span>Toll-Free: 1800-7382-7388</span>
              </p>
              <p className="flex items-center">
                <Mail className="w-4 h-4 text-primary-400 mr-2 shrink-0" />
                <span>support@sevasetu.com</span>
              </p>
              <p className="flex items-center">
                <MapPin className="w-4 h-4 text-primary-400 mr-2 shrink-0" />
                <span>Mumbai / National Operations Hub</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SevaSetu Platform. {t('allRightsReserved')}</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link to="/privacy-policy" className="hover:text-slate-400">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-400">
              Terms
            </Link>
            <Link to="/about" className="hover:text-slate-400">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
