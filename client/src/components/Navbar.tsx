import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Headphones,
  Edit3,
  Layers,
  Award,
  History,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  Users,
  Clock,
  Settings as SettingsIcon,
  LayoutDashboard,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Listening', path: '/student/listening', icon: Headphones },
    { name: 'Reading', path: '/student/reading', icon: BookOpen },
    { name: 'Writing', path: '/student/writing', icon: Edit3 },
    { name: 'Full Mock', path: '/student/mock', icon: Layers },
    { name: 'Results', path: '/student/results', icon: Award },
    { name: 'History', path: '/student/history', icon: History },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Tests', path: '/admin/tests', icon: Layers },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Attempts', path: '/admin/attempts', icon: Clock },
    { name: 'Results', path: '/admin/results', icon: Award },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
  ];

  const navLinks = isAdmin ? adminLinks : studentLinks;

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Metadata Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <Link
              to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
              className="flex items-center space-x-2.5"
            >
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-sm">
                CDI
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-wide text-white">
                  IELTS MOCK PLATFORM
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                  COMPUTER-DELIVERED SIMULATION
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-200">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {isAdmin ? (
                  <span className="inline-flex items-center text-blue-400 font-bold">
                    <Shield className="w-2.5 h-2.5 mr-1" /> ADMIN
                  </span>
                ) : (
                  <span>{user?.candidateNumber || 'CANDIDATE'}</span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 border-b border-slate-800 mb-2">
            <div className="text-xs font-semibold text-white">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {isAdmin ? 'ADMINISTRATOR' : user?.candidateNumber}
            </div>
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-slate-800 rounded-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
