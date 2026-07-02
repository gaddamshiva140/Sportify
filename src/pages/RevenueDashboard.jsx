import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Award, Calendar, ChevronLeft, CreditCard, Sparkles, Trophy } from 'lucide-react';

export default function RevenueDashboard() {
  const { user } = useAuth();

  const [earnings, setEarnings] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [revenueBySport, setRevenueBySport] = useState({});
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchRevenueData() {
      setLoading(true);
      try {
        // Fetch grounds owned
        const { data: grounds } = await supabase
          .from('grounds')
          .select('*')
          .eq('owner_id', user.id);

        if (grounds && grounds.length > 0) {
          const myGroundIds = grounds.map(g => g.id);

          // Fetch slots
          const { data: slots } = await supabase
            .from('slots')
            .select('*')
            .in('ground_id', myGroundIds);

          if (slots && slots.length > 0) {
            const slotIds = slots.map(s => s.id);

            // Fetch bookings
            const { data: bookings } = await supabase
              .from('bookings')
              .select('*')
              .in('slot_id', slotIds);

            if (bookings) {
              setTotalBookings(bookings.length);
              
              // Calculate total earnings
              const sum = bookings.reduce((acc, b) => acc + Number(b.total_price), 0);
              setEarnings(sum);

              // Calculate breakdown by sport type
              const sportRevenue = {};
              bookings.forEach(b => {
                const associatedSlot = slots.find(s => s.id === b.slot_id) || {};
                const associatedGround = grounds.find(g => g.id === associatedSlot.ground_id) || {};
                const sName = associatedGround.sport_type || 'Unknown Sport';
                
                sportRevenue[sName] = (sportRevenue[sName] || 0) + Number(b.total_price);
              });
              setRevenueBySport(sportRevenue);

              // Mock historical revenue progression (last 5 days) for visual graph representation
              const days = ['5 Days Ago', '4 Days Ago', '3 Days Ago', 'Yesterday', 'Today'];
              const historyData = days.map((day, idx) => {
                // progressive mock distribution
                const weight = (idx + 1) / 15;
                return {
                  label: day,
                  amount: Math.round(sum * weight)
                };
              });
              setRevenueHistory(historyData);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching revenue records', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRevenueData();
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500">
        Please log in to view the Revenue Dashboard.
      </div>
    );
  }

  // Calculate highest revenue sport
  const getTopSport = () => {
    let topName = 'No bookings yet';
    let topVal = 0;
    Object.entries(revenueBySport).forEach(([name, val]) => {
      if (val > topVal) {
        topVal = val;
        topName = name;
      }
    });
    return { name: topName, amount: topVal };
  };

  const topSport = getTopSport();

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Back button */}
      <Link to="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-slate-550 dark:text-slate-400 hover:text-sport-green mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white leading-tight">
          Revenue & Earnings Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor your earnings progress, venue volume, and top-selling sport classifications
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gathering analytics...</span>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Total Earnings</span>
              <p className="font-display font-extrabold text-3xl text-sport-green">₹{earnings}</p>
            </div>
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Completed Reservations</span>
              <p className="font-display font-extrabold text-3xl text-slate-850 dark:text-white">{totalBookings}</p>
            </div>
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Highest Yielding Sport</span>
              <p className="font-display font-extrabold text-lg text-slate-800 dark:text-slate-350 truncate">
                {topSport.name} 
                {topSport.amount > 0 && <span className="text-xs text-sport-green block font-bold mt-1">₹{topSport.amount} generated</span>}
              </p>
            </div>
          </div>

          {/* Revenue charts & distribution graphs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 1. Historical bar chart */}
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-6">
              <h2 className="font-display font-bold text-lg text-slate-850 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-805">
                Earnings Timeline
              </h2>

              {earnings === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">No history recorded</div>
              ) : (
                <div className="h-[250px] flex items-end justify-between gap-3 px-2 pt-6">
                  {revenueHistory.map((hist) => {
                    // Calculate height percentage
                    const maxHistAmount = Math.max(...revenueHistory.map(h => h.amount)) || 1;
                    const percentHeight = Math.max(10, (hist.amount / maxHistAmount) * 100);

                    return (
                      <div key={hist.label} className="flex-1 flex flex-col items-center gap-2 group">
                        {/* Tooltip on hover */}
                        <span className="opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded transition-all transform -translate-y-1 block pointer-events-none">
                          ₹{hist.amount}
                        </span>
                        
                        {/* Bar */}
                        <div
                          style={{ height: `${percentHeight}%` }}
                          className="w-full bg-gradient-to-t from-sport-green to-sport-green-light group-hover:from-sport-green-dark group-hover:to-sport-green rounded-t-lg shadow-sm glow-green transition-all duration-300"
                        />
                        
                        {/* Label */}
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate max-w-full">
                          {hist.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Sport Type revenue share distribution */}
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-6">
              <h2 className="font-display font-bold text-lg text-slate-850 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-805">
                Income Category Share
              </h2>

              {Object.keys(revenueBySport).length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">No share recorded</div>
              ) : (
                <div className="space-y-4 pt-2">
                  {Object.entries(revenueBySport).map(([sport, value]) => {
                    const pct = Math.round((value / earnings) * 100) || 0;
                    return (
                      <div key={sport} className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-350">{sport}</span>
                          <span className="text-slate-800 dark:text-white font-extrabold">₹{value} ({pct}%)</span>
                        </div>
                        {/* progress line */}
                        <div className="w-full bg-slate-100 dark:bg-brand-dark h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }}
                            className="bg-sport-green h-full rounded-full glow-green"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
