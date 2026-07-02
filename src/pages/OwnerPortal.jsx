import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, Calendar, BarChart, ShieldCheck, CheckCircle2, BadgeDollarSign, Sparkles, RefreshCw, Key
} from 'lucide-react';

export default function OwnerPortal() {
  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-brand-dark pb-20">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white py-20 px-6 sm:px-12 text-center border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sport-green/20 via-brand-dark to-slate-900 opacity-60 z-0" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1 bg-sport-green/20 text-sport-green px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-sport-green/30">
            <Building className="h-3.5 w-3.5" />
            Arena Host Hub
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
            Manage Sports Venues & <br />
            <span className="bg-gradient-to-r from-sport-green to-sport-green-light bg-clip-text text-transparent">
              Maximize Your Occupancy.
            </span>
          </h1>
          <p className="text-slate-355 text-base font-light max-w-2xl mx-auto">
            Schedule hourly slots, configure pricing rules, verify player check-in codes, and monitor venue earnings in real-time.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-sport-green to-sport-green-dark text-white font-bold rounded-xl shadow-lg glow-green hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
            >
              <Sparkles className="h-4.5 w-4.5" />
              Register as Ground Owner
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-4 border border-slate-700 bg-slate-950 text-slate-300 font-bold rounded-xl hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
            >
              Host Portal Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-16">
        
        {/* Three core pillars for owners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-sport-green/10 text-sport-green rounded-2xl flex items-center justify-center font-bold text-lg">
              📅
            </div>
            <h3 className="font-display font-bold text-lg text-slate-850 dark:text-white">Smart Scheduler</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Add time slots recursively or block specific slots for club maintenance. Change prices dynamically based on peak hours.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-amber-500/10 text-amber-505 rounded-2xl flex items-center justify-center font-bold text-lg">
              💵
            </div>
            <h3 className="font-display font-bold text-lg text-slate-855 dark:text-white">Occupancy Analytics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Inspect total earnings, reservations counts, and track peak performance metrics via detailed interactive analytics dashboards.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center font-bold text-lg">
              🔑
            </div>
            <h3 className="font-display font-bold text-lg text-slate-850 dark:text-white">Secure OTP Check-Ins</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Prevent unauthorized entry. Players receive a secure 6-digit check-in code that you verify on your dashboard to log attendance.
            </p>
          </div>
        </div>

        {/* Feature section: Verification Checklist */}
        <div className="flex flex-col md:flex-row items-center gap-12 p-8 bg-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sport-green/10 to-transparent pointer-events-none" />
          <div className="space-y-4 md:w-1/2">
            <span className="text-[10px] font-extrabold uppercase bg-sport-green/20 text-sport-green px-2.5 py-1 rounded-full border border-sport-green/30 tracking-wider">
              Verification Engine
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              Anti-Fraud Deeds Verification Checklist
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed font-light">
              To keep the marketplace completely trustworthy, all owners verify their grounds by ticking the registry checklist. You must confirm that the land registry ID matches deeds records, local municipal licenses match the listing, and your profile matches the documents. Once verified, a verified check badge is rendered!
            </p>
            <div className="pt-2">
              <span className="text-xs text-sport-green font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Safeguards your brand credibility
              </span>
            </div>
          </div>
          
          <div className="md:w-1/2 w-full bg-slate-950 rounded-2xl p-5 border border-slate-800 text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Owner Deeds Verification Checklist</h4>
            <div className="space-y-2 text-[10px] text-slate-450 font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-sport-green text-xs">✓</span>
                <span>Land Registry ID matches official deeds records</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sport-green text-xs">✓</span>
                <span>Local Municipal Sports Arena License matches listing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sport-green text-xs">✓</span>
                <span>Profile identity name matches deeds ownership documents</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <span className="text-[9px] uppercase font-bold text-sport-green bg-sport-green/15 px-2.5 py-1 rounded-full border border-sport-green/20">
                Verified Venue ✓
              </span>
            </div>
          </div>
        </div>

        {/* Feature Section: Revenue Statistics */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12 p-8 bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
          <div className="space-y-4 md:w-1/2">
            <span className="text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-505 px-2.5 py-1 rounded-full border border-amber-400/20 tracking-wider">
              Revenue Analytics
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              Detailed Revenue Statistics & Dashboards
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Make data-driven scheduling decisions. Inspect total earnings, average revenue per booking, overall occupancy rates, and peak booking times. Adjust scheduling timings based on analytics to boost venue bookings.
            </p>
            <div className="pt-2">
              <Link 
                to="/register"
                className="text-xs font-bold text-sport-green hover:underline flex items-center gap-1 cursor-pointer"
              >
                Join as a Host today <BadgeDollarSign className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2 w-full p-5 bg-slate-905 dark:bg-brand-dark/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Analytics Summary</span>
              <span className="text-[9px] font-bold text-sport-green bg-sport-green/10 px-2 py-0.5 rounded-full">Occupancy: 84%</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-brand-card-dark rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-[9px] text-slate-450 uppercase block font-bold">Total Earnings</span>
                <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">₹28,500</span>
              </div>
              <div className="p-3 bg-white dark:bg-brand-card-dark rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-[9px] text-slate-450 uppercase block font-bold">Total Bookings</span>
                <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">42 Sessions</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
