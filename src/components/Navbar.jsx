import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Activity, Sun, Moon, Menu, X, User, LogOut, LayoutDashboard, History, MapPin
} from 'lucide-react';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error', err);
    }
  };

  const activeClass = (path) => {
    return location.pathname === path
      ? "text-sport-green font-semibold border-b-2 border-sport-green pb-1"
      : "text-slate-600 dark:text-slate-300 hover:text-sport-green transition-colors pb-1";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-sport-green to-sport-green-light p-2 rounded-xl text-white shadow-md glow-green transition-transform hover:scale-105">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Sportify
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={activeClass('/')}>Home</Link>
            <Link to="/explore" className={activeClass('/explore')}>Explore Grounds</Link>
            <Link to="/categories" className={activeClass('/categories')}>Categories</Link>
            {user && (
              <Link 
                to="/profile"
                className={activeClass('/profile')}
              >
                Profile & Bookings
              </Link>
            )}
          </div>

          {/* Right Side Buttons (Auth, Theme, Mobile Toggle) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sport-green hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-sport-green transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sport-green to-brand-secondary flex items-center justify-center text-white font-semibold shadow-inner">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 pr-2">
                    {user.full_name?.split(' ')[0]}
                  </span>
                </button>

                {showProfileDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-brand-card-dark p-2 shadow-xl ring-1 ring-black/5 z-20">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Logged in as
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {user.full_name}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sport-green/20 text-sport-green uppercase">
                          {user.role}
                        </span>
                      </div>
                      
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 mt-1 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        My Profile
                      </Link>

                      {!isAdmin ? (
                        <Link
                          to="/history"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <History className="h-4 w-4 text-slate-400" />
                          Booking History
                        </Link>
                      ) : (
                        <Link
                          to="/manage-grounds"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-slate-400" />
                          Manage Arenas
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleSignOut();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 mt-1 border-t border-slate-100 dark:border-slate-800 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-sport-green transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sport-green to-sport-green-dark rounded-xl hover:from-sport-green-dark hover:to-sport-green shadow-md hover:shadow-lg glow-green transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sport-green"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sport-green"
              aria-label="Open Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-brand-dark px-4 pt-2 pb-4 space-y-2 shadow-lg transition-colors">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sport-green"
          >
            Home
          </Link>
          <Link
            to="/explore"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sport-green"
          >
            Explore Grounds
          </Link>
          <Link
            to="/categories"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sport-green"
          >
            Categories
          </Link>
          {user && (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sport-green"
            >
              Profile & Bookings
            </Link>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">Profile</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{user.full_name}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sport-green"
                >
                  My Profile
                </Link>
                {!isAdmin ? (
                  <Link
                    to="/history"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sport-green"
                  >
                    Booking History
                  </Link>
                ) : (
                  <Link
                    to="/manage-grounds"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sport-green"
                  >
                    Manage Arenas
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 bg-sport-green rounded-lg text-base font-medium text-white shadow-md hover:bg-sport-green-dark"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
