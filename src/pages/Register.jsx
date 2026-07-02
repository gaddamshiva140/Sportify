import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Activity, Globe
} from 'lucide-react';

export default function Register() {
  const { signUp, signInWithGoogle, user, verifyEmailLink, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(location.state?.prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const role = 'player';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle redirect if logged in
  React.useEffect(() => {
    if (user && user.email_verified) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const isStrongPassword = (pass) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(pass);
    const hasLowercase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return pass.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !phoneNumber) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (phoneNumber.length !== 10) {
      showToast('Mobile number must be exactly 10 digits.', 'error');
      return;
    }

    if (!isStrongPassword(password)) {
      showToast('Password is too weak. Ensure it is at least 8 characters, with uppercase, lowercase, numbers, and special symbols.', 'error');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName, role, phoneNumber);
      showToast('We sent a verification link to this gmail.', 'success');
      // Sign out simulated active state so they must log in manually after verifying
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      if (err.message?.includes('User already exists')) {
        showToast('User already registered!', 'error');
      } else {
        showToast(err.message || 'Error occurred during registration.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await signInWithGoogle(role);
      showToast('Redirecting to Google Sign-In...');
    } catch (err) {
      showToast(err.message || 'Google Auth failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-brand-card-dark p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl transition-colors duration-300 relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex bg-sport-green/10 p-3 rounded-2xl text-sport-green mb-4">
            <Activity className="h-8 w-8 text-sport-green" />
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-1.5 text-xs text-slate-550 dark:text-slate-400 font-medium">
            Sign up to find and book sports arenas
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rohit Sharma"
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-850 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-855 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green text-sm"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Phone className="h-4.5 w-4.5" />
              </span>
              <input
                type="tel"
                required
                maxLength="10"
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setPhoneNumber(val);
                }}
                placeholder="8555057959"
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-855 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-855 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
              Requirements: At least 8 characters, 1 uppercase letter, 1 number, and 1 special symbol.
            </p>
          </div>



          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green shadow-md glow-green focus:outline-none disabled:bg-slate-450 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        {/* OAuth SSO Section */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2.5 py-3 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-dark hover:bg-slate-55 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <Globe className="h-4.5 w-4.5 text-red-500 shrink-0" />
                Sign up with Google
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-505 dark:text-slate-450 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sport-green hover:underline">
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}
