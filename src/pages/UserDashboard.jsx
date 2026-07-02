import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { 
  Trophy, Calendar, Clock, Ticket, Sparkles, Navigation, ShieldCheck, 
  CreditCard, ChevronRight, X, MapPin, PlayCircle, CheckCircle, RefreshCw
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [grounds, setGrounds] = useState({});
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);

  // Active Ticket Modal
  const [activeTicket, setActiveTicket] = useState(null);

  // Scoreboard State
  const [scoreboardState, setScoreboardState] = useState(null);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id);

      if (bookingsData) {
        setBookings(bookingsData);

        const { data: slotsData } = await supabase.from('slots').select('*');
        const { data: groundsData } = await supabase.from('grounds').select('*');

        const slotsMap = {};
        if (slotsData) slotsData.forEach(s => { slotsMap[s.id] = s; });

        const groundsMap = {};
        if (groundsData) groundsData.forEach(g => { groundsMap[g.id] = g; });

        setSlots(slotsMap);
        setGrounds(groundsMap);

        // Find active match scoreboard
        const active = bookingsData.find(b => b.session_status === 'active_playing');
        if (active) {
          setScoreboardState(active.scoreboard || {
            team_a_name: 'Team A',
            team_b_name: 'Team B',
            team_a_score: 0,
            team_b_score: 0,
            period: '1st Half',
            status: 'Warmup'
          });
        } else {
          setScoreboardState(null);
        }

        // If active ticket is open, update its reference
        if (activeTicket) {
          const freshBooking = bookingsData.find(b => b.id === activeTicket.booking.id);
          if (freshBooking) {
            setActiveTicket({
              booking: freshBooking,
              ground: groundsMap[slotsMap[freshBooking.slot_id]?.ground_id] || {},
              slot: slotsMap[freshBooking.slot_id] || {}
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const updateScoreboard = async (newScoreboard) => {
    const active = bookings.find(b => b.session_status === 'active_playing');
    if (!active) return;
    
    setScoreboardState(newScoreboard);
    try {
      await supabase.from('bookings').update({ scoreboard: newScoreboard }).eq('id', active.id);
      showToast('Score updated!');
    } catch(err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-505">
        Please log in to view your dashboard.
      </div>
    );
  }

  // Calculate stats
  const totalSpent = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  
  const now = new Date();
  const upcomingBookings = bookings.filter(b => {
    const slot = slots[b.slot_id] || {};
    return slot.start_time && new Date(slot.start_time) > now;
  });

  const previousBookingsCount = bookings.length - upcomingBookings.length;

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const activeMatchBooking = bookings.find(b => b.session_status === 'active_playing');
  const activeMatchGround = activeMatchBooking ? grounds[slots[activeMatchBooking.slot_id]?.ground_id] : null;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Welcome Banner */}
      <div className="p-8 bg-gradient-to-r from-slate-900 via-brand-dark to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-10 bottom-0 opacity-10">
          <Trophy className="h-[200px] w-[200px]" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold uppercase bg-sport-green/20 text-sport-green px-2.5 py-1 rounded-full border border-sport-green/30">
            Player Dashboard
          </span>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-3">
              Hello, {user.full_name?.split(' ')[0]}!
            </h1>
            <button 
              onClick={loadDashboardData}
              className="mt-3.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <p className="text-slate-350 text-sm max-w-md font-light">
            Ready for your next game? Check your upcoming timings or verify attendance check-ins.
          </p>
        </div>
      </div>

      {/* Live Match Scoreboard Widget */}
      {scoreboardState && activeMatchGround && (
        <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-lg space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-500 border border-amber-400/30 px-3 py-1 rounded-full tracking-wider animate-pulse">
              <PlayCircle className="h-3.5 w-3.5" />
              Active Match Scoreboard
            </span>
            <span className="text-xs font-extrabold text-slate-700 dark:text-white">
              {activeMatchGround.title} ({activeMatchGround.sport_type})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 items-center py-2 text-sm">
            
            {/* Team A */}
            <div className="text-center space-y-2">
              <input
                type="text"
                value={scoreboardState.team_a_name}
                onChange={(e) => updateScoreboard({ ...scoreboardState, team_a_name: e.target.value })}
                className="w-full text-center bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-sport-green text-sm font-bold text-slate-800 dark:text-white uppercase focus:outline-none"
              />
              <div className="flex justify-center items-center gap-3 mt-1">
                <button
                  onClick={() => updateScoreboard({ ...scoreboardState, team_a_score: Math.max(0, scoreboardState.team_a_score - 1) })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-250 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="font-display font-extrabold text-3xl text-slate-800 dark:text-white">{scoreboardState.team_a_score}</span>
                <button
                  onClick={() => updateScoreboard({ ...scoreboardState, team_a_score: scoreboardState.team_a_score + 1 })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-sport-green text-white hover:bg-sport-green-dark font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Match State */}
            <div className="text-center space-y-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status / Period</span>
              <select
                value={scoreboardState.period}
                onChange={(e) => updateScoreboard({ ...scoreboardState, period: e.target.value })}
                className="block w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white text-xs font-bold text-center focus:outline-none cursor-pointer"
              >
                <option value="Warmup">Warmup</option>
                <option value="1st Half">1st Half</option>
                <option value="Halftime">Halftime</option>
                <option value="2nd Half">2nd Half</option>
                <option value="Overtime">Overtime</option>
                <option value="Ended">Ended</option>
              </select>
            </div>

            {/* Team B */}
            <div className="text-center space-y-2">
              <input
                type="text"
                value={scoreboardState.team_b_name}
                onChange={(e) => updateScoreboard({ ...scoreboardState, team_b_name: e.target.value })}
                className="w-full text-center bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-sport-green text-sm font-bold text-slate-800 dark:text-white uppercase focus:outline-none"
              />
              <div className="flex justify-center items-center gap-3 mt-1">
                <button
                  onClick={() => updateScoreboard({ ...scoreboardState, team_b_score: Math.max(0, scoreboardState.team_b_score - 1) })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-355 hover:bg-slate-250 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="font-display font-extrabold text-3xl text-slate-800 dark:text-white">{scoreboardState.team_b_score}</span>
                <button
                  onClick={() => updateScoreboard({ ...scoreboardState, team_b_score: scoreboardState.team_b_score + 1 })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-sport-green text-white hover:bg-sport-green-dark font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {loading && bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading details...</span>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Upcoming Matches</span>
              <p className="font-display font-extrabold text-3xl text-slate-850 dark:text-white">{upcomingBookings.length}</p>
            </div>
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-455 uppercase tracking-wider block">Games Completed</span>
              <p className="font-display font-extrabold text-3xl text-slate-850 dark:text-white">{previousBookingsCount}</p>
            </div>
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Total Expenditure</span>
              <p className="font-display font-extrabold text-3xl text-sport-green">₹{totalSpent}</p>
            </div>
          </div>

          {/* Active / Upcoming Bookings */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                Upcoming Play Sessions
              </h2>
              <Link to="/history" className="text-xs font-bold text-sport-green hover:underline flex items-center gap-1">
                View History
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-855/80 rounded-2xl shadow-sm space-y-4">
                <p className="text-slate-505 dark:text-slate-400 text-sm">You have no upcoming games scheduled.</p>
                <Link
                  to="/explore"
                  className="inline-flex px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-sport-green hover:bg-sport-green-dark transition-all shadow-md glow-green"
                >
                  Book an Arena
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingBookings.map(b => {
                  const slot = slots[b.slot_id] || {};
                  const ground = grounds[slot.ground_id] || {};
                  
                  let statusBadge = null;
                  if (b.session_status === 'active_playing') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 uppercase tracking-wide">
                        <PlayCircle className="h-3.5 w-3.5 animate-pulse" />
                        In Game (Active)
                      </span>
                    );
                  } else if (b.session_status === 'completed') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-505 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 uppercase tracking-wide">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Session Over
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Pending Check-in
                      </span>
                    );
                  }

                  return (
                    <div 
                      key={b.id}
                      className="bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sport-green/15 text-sport-green uppercase">
                            {ground.sport_type}
                          </span>
                          {statusBadge}
                        </div>
                        
                        <h3 className="font-display font-bold text-base text-slate-850 dark:text-white line-clamp-1">{ground.title}</h3>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-sport-green" />
                            {formatDate(slot.start_time)}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="h-3.5 w-3.5 text-sport-green" />
                            {formatTime(slot.start_time)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTicket({ booking: b, ground, slot })}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-sport-green hover:bg-slate-800 dark:hover:bg-sport-green-dark text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer text-center"
                      >
                        Digital Ticket
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket Modal Overlay */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-white dark:bg-brand-card-dark rounded-3xl overflow-hidden p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5 animate-scale-in">
            
            <button
              onClick={() => setActiveTicket(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-55 dark:bg-brand-dark text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex bg-sport-green/20 p-3 rounded-full text-sport-green">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
              Digital Check-In
            </h3>
            
            {/* Ticket wrapper */}
            <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-55/50 dark:bg-brand-dark/25 text-left text-sm space-y-3.5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Ground</span>
                  <p className="font-bold text-slate-800 dark:text-white line-clamp-1">{activeTicket.ground.title}</p>
                </div>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${activeTicket.ground.latitude},${activeTicket.ground.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sport-green hover:underline flex items-center gap-1 font-semibold"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Map
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Date</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-355">{formatDate(activeTicket.slot.start_time)}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-455 tracking-wider">Timings</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    {formatTime(activeTicket.slot.start_time)} - {formatTime(activeTicket.slot.end_time)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-slate-200 dark:border-slate-805">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Pass ID</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-355 truncate">{activeTicket.booking.id.substring(0, 10)}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Paid Status</span>
                  <p className="text-xs font-extrabold text-sport-green">Paid - ₹{activeTicket.booking.total_price}</p>
                </div>
              </div>

              {/* Check-In OTP Box */}
              <div className="p-3 bg-sport-green/10 rounded-xl border border-sport-green/20 text-center space-y-1">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-sport-green">Check-In OTP Code</span>
                <p className="font-display font-extrabold text-2xl tracking-widest text-slate-850 dark:text-white">
                  {activeTicket.booking.otp_code || '000000'}
                </p>
                <span className="text-[9px] text-slate-450 block font-medium">
                  {activeTicket.booking.session_status === 'active_playing'
                    ? '✓ Presence Verified - Game Active'
                    : 'Share this code with the ground owner upon arrival.'}
                </span>
              </div>

              {/* QR Pattern */}
              <div className="flex justify-center pt-1">
                <div className="p-2 bg-white border border-slate-100 rounded-lg">
                  <div className="w-16 h-16 bg-slate-900 grid grid-cols-4 gap-1 p-1">
                    {[...Array(16)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-sm ${
                          (i * 3 + 7) % 2 === 0 ? 'bg-white' : 'bg-slate-900'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-505 font-medium">
              Check-In status updates instantly once verified by owner.
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
