import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { verifyEmailLink } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const userId = searchParams.get('id');

  useEffect(() => {
    async function executeVerification() {
      if (!userId) {
        setStatus('error');
        setErrorMsg('Invalid or missing verification code parameters.');
        return;
      }

      try {
        await verifyEmailLink(userId);
        setStatus('success');
        showToast('Email verified successfully!');
        
        // Auto redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message || 'Verification link is expired or invalid.');
      }
    }

    executeVerification();
  }, [userId, navigate, verifyEmailLink, showToast]);

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 bg-slate-50 dark:bg-brand-dark">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-brand-card-dark p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl text-center">
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="inline-flex bg-sport-green/10 p-4 rounded-3xl text-sport-green animate-spin">
              <Loader2 className="h-10 w-10 text-sport-green" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
              Verifying Your Email
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please wait while we validate your secure registration credentials...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex bg-sport-green/15 p-4 rounded-3xl text-sport-green shadow-inner">
              <CheckCircle className="h-10 w-10 text-sport-green" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
              Verification Successful!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your email has been verified. Redirecting you to the booking dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex bg-red-500/10 p-4 rounded-3xl text-red-500 shadow-inner">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
              Verification Failed
            </h2>
            <p className="text-xs text-red-500 font-medium">
              {errorMsg}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="px-6 py-2.5 bg-slate-900 dark:bg-brand-dark text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
