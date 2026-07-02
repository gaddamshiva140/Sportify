import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Star, Clock, Trophy, MapPin, Zap, Flame, CheckCircle, Shield
} from 'lucide-react';

export default function PlayerPortal() {
  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-brand-dark pb-20">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white py-20 px-6 sm:px-12 text-center border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/35 via-brand-dark to-slate-900 opacity-60 z-0" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1 bg-sport-green/20 text-sport-green px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-sport-green/30">
            <Flame className="h-3.5 w-3.5" />
            Player Central Hub
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
            Discover Premium Turfs & <br />
            <span className="bg-gradient-to-r from-sport-green to-sport-green-light bg-clip-text text-transparent">
              Elevate Your Matchday.
            </span>
          </h1>
          <p className="text-slate-355 text-base font-light max-w-2xl mx-auto">
            Book wooden badminton courts, outdoor football fields, box cricket arenas, and basketball courts. Track live match scoreboards and check in safely.
          </p>
          <div className="pt-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-sport-green to-sport-green-dark text-white font-bold rounded-xl shadow-lg glow-green hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
            >
              <Search className="h-4.5 w-4.5" />
              Explore Grounds Nearby
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-16">
        
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-sport-green/10 text-sport-green rounded-2xl flex items-center justify-center font-bold text-lg">
              📍
            </div>
            <h3 className="font-display font-bold text-lg text-slate-850 dark:text-white">Geolocation Discovery</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Instantly discover sport arenas near your current coordinates. View distance indicators and map directions directly.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-amber-500/10 text-amber-505 rounded-2xl flex items-center justify-center font-bold text-lg">
              ⚡
            </div>
            <h3 className="font-display font-bold text-lg text-slate-855 dark:text-white">Instant Slot Locks</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Securely block and lock your timings under transaction protection. Prevent double bookings and receive verification codes instantly.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <h3 className="font-display font-bold text-lg text-slate-850 dark:text-white">Deeds Verified Arenas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Play with peace of mind. Our manager validation checklist verifies arena licensing documents to prevent fake venue listings.
            </p>
          </div>
        </div>

        {/* Feature section: Live Scoreboard */}
        <div className="flex flex-col md:flex-row items-center gap-12 p-8 bg-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sport-green/10 to-transparent pointer-events-none" />
          <div className="space-y-4 md:w-1/2">
            <span className="text-[10px] font-extrabold uppercase bg-sport-green/20 text-sport-green px-2.5 py-1 rounded-full border border-sport-green/30 tracking-wider">
              Score Sync Engine
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              Interactive In-Game Live Match Scoreboards
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed font-light">
              No more manual scorekeeping sheets! When you check in for a booking, a live match scoreboard widget mounts on your player panel. You can update scores, set team names, track periods (1st Half, Halftime, etc.), and view real-time changes instantly.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-sport-green font-bold flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Syncs live to ground owner database
              </span>
            </div>
          </div>
          <div className="md:w-1/2 w-full bg-slate-950 rounded-2xl p-6 border border-slate-800 text-center space-y-4">
            <span className="text-[9px] uppercase tracking-widest font-black text-amber-500 bg-amber-400/10 px-2 py-0.5 rounded-full">
              In Progress
            </span>
            <h4 className="font-display font-bold text-sm text-slate-305">Football Arena - Pitch #2</h4>
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="text-right">
                <p className="text-[10px] text-slate-450 uppercase font-black">Home Team</p>
                <h3 className="font-display font-black text-2xl text-white">Strikers FC</h3>
                <span className="text-3xl font-black text-sport-green block mt-1">3</span>
              </div>
              <div className="text-center text-slate-650 text-xl font-bold">vs</div>
              <div className="text-left">
                <p className="text-[10px] text-slate-450 uppercase font-black">Away Team</p>
                <h3 className="font-display font-black text-2xl text-white">United XI</h3>
                <span className="text-3xl font-black text-sport-green block mt-1">1</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-bold">Status: 2nd Half (Occupied)</p>
          </div>
        </div>

        {/* Feature Section: Reviews */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12 p-8 bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
          <div className="space-y-4 md:w-1/2">
            <span className="text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-505 px-2.5 py-1 rounded-full border border-amber-400/20 tracking-wider">
              Verified Feedback
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              Honest Feedback from Verified Bookers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Make informed decisions. Only players who have successfully booked and checked in using their unique security OTP code can leave reviews and ratings for listed venues. Read reviews about turf quality, locker rooms, floodlights, and restrooms.
            </p>
            <div className="pt-2">
              <Link 
                to="/explore"
                className="text-xs font-bold text-sport-green hover:underline flex items-center gap-1 cursor-pointer"
              >
                Find a top-rated turf <Zap className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 w-full space-y-3">
            <div className="p-4 bg-slate-50 dark:bg-brand-dark/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Rahul M.</span>
                <span className="text-amber-500">★★★★★</span>
              </div>
              <p className="text-slate-505 dark:text-slate-400 font-light">The artificial turf feels top tier. Highly recommend the night slots for football!</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-brand-dark/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Vikram S.</span>
                <span className="text-amber-500">★★★★☆</span>
              </div>
              <p className="text-slate-505 dark:text-slate-400 font-light">Excellent wooden badminton court. Parking gets crowded on weekends though.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
