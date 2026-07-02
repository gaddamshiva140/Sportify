import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Mail, Lock, Eye, EyeOff, Loader2, Activity, Globe
} from 'lucide-react';

export default function Login() {
  const { signIn, signInWithGoogle, user, verifyEmailLink, signOut, resendVerification } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user && user.email_verified) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.trim())
        .single();
      
      if (!profile) {
        showToast('Email not registered. Redirecting you to sign up...', 'warning');
        setTimeout(() => {
          navigate('/register', { state: { prefilledEmail: email.trim() } });
        }, 1500);
        return;
      }

      await signIn(email, password);
      
      if (profile.email_verified) {
        showToast('Welcome back! Successfully logged in.');
      } else {
        showToast('Please verify your email to log in.', 'warning');
      }
    } catch (err) {
      showToast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      showToast('Redirecting to Google Sign-In...');
    } catch (err) {
      showToast(err.message || 'Google Auth failed.', 'error');
    } finally {
      setLoading(false);
    }
  };



  // Intercept if logged in but email verification is pending
  if (user && !user.email_verified) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-brand-card-dark p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl text-center">
          <div className="inline-flex bg-sport-green/10 p-4 rounded-3xl text-sport-green mb-2 animate-pulse">
            <Mail className="h-10 w-10 text-sport-green" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
            Verify Your Email
          </h2>
          <p className="text-xs text-slate-505 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            We sent a secure verification link to <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong>. Please check your inbox and click the verification link to proceed.
          </p>

          {/* Simulated Inbox Message Notification Box */}
          <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-900 text-left text-xs font-semibold text-indigo-300 space-y-2">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Simulated Gmail Inbox</span>
            <p className="leading-relaxed">
              Subject: Welcome to Sportify! Please verify your email.<br />
              Link: <span className="underline text-sport-green font-bold cursor-pointer" onClick={async () => {
                setLoading(true);
                try {
                  await verifyEmailLink(user.id);
                  showToast('Email verified successfully!');
                } catch(err) {
                  showToast(err.message, 'error');
                } finally {
                  setLoading(false);
                }
              }}>http://localhost:5173/verify-email?id={user.id}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  await verifyEmailLink(user.id);
                  showToast('Email verified successfully!');
                } catch (err) {
                  showToast(err.message, 'error');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green text-white text-xs font-bold rounded-xl shadow-md glow-green transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Gmail Verification Link'}
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  await resendVerification(user.email);
                  showToast('Verification email resent successfully!', 'success');
                } catch (err) {
                  showToast(err.message || 'Failed to resend verification.', 'error');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-2.5 bg-slate-105 hover:bg-slate-200 dark:bg-brand-dark dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend Verification Email'}
            </button>
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 border border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 hover:text-slate-755 dark:hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-brand-card-dark p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl transition-colors duration-300 relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex bg-sport-green/10 p-3 rounded-2xl text-sport-green mb-4">
            <Activity className="h-8 w-8 text-sport-green" />
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-1.5 text-xs text-slate-550 dark:text-slate-400 font-medium">
            Sign in to reserve slots and manage grounds
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-2">
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
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-2">
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
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-sport-green"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green shadow-md glow-green transition-all focus:outline-none disabled:bg-slate-400 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Log In'}
          </button>
        </form>

        {/* OAuth SSO Section */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/85">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2.5 py-3 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-dark hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 transition-colors shadow-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <Globe className="h-4.5 w-4.5 text-red-500 shrink-0" />
                Continue with Google
              </>
            )}
          </button>
        </div>



        <p className="text-center text-xs text-slate-505 dark:text-slate-450 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-sport-green hover:underline">
            Register now
          </Link>
        </p>

      </div>
    </div>
  );
}
