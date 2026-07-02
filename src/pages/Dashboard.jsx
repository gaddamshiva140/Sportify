import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { 
  Trophy, Calendar, Clock, Ticket, Sparkles, Navigation, ShieldCheck, 
  CreditCard, ChevronRight, X, MapPin, PlayCircle, CheckCircle, RefreshCw,
  Building, TrendingUp, Plus, Landmark, FileText, BadgeDollarSign
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'hosting'

  // --- Bookings (Player role) States ---
  const [bookings, setBookings] = useState([]);
  const [grounds, setGrounds] = useState({});
  const [slots, setSlots] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [playerScoreboard, setPlayerScoreboard] = useState(null);

  // --- Hosting (Owner role) States ---
  const [myGrounds, setMyGrounds] = useState([]);
  const [hostReservations, setHostReservations] = useState([]);
  const [hostSlots, setHostSlots] = useState({});
  const [loadingHosting, setLoadingHosting] = useState(true);
  
  // Host OTP input state
  const [enteredOtp, setEnteredOtp] = useState({});
  const [otpError, setOtpError] = useState({});
  const [otpSuccess, setOtpSuccess] = useState({});

  // Host Scoreboard State
  const [hostScoreboard, setHostScoreboard] = useState(null);
  const [hostScoreboardBookingId, setHostScoreboardBookingId] = useState(null);

  // Deeds verification states
  const [verifiedChecks, setVerifiedChecks] = useState({});

  const handleToggleCheck = (groundId, checkType) => {
    setVerifiedChecks(prev => ({
      ...prev,
      [`${groundId}-${checkType}`]: !prev[`${groundId}-${checkType}`]
    }));
  };

  const isGroundReadyToVerify = (groundId) => {
    return (
      verifiedChecks[`${groundId}-landRegistry`] &&
      verifiedChecks[`${groundId}-municipalLicense`] &&
      verifiedChecks[`${groundId}-ownerIdentity`]
    );
  };

  const loadBookingsData = async () => {
    if (!user) return;
    setLoadingBookings(true);
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
          setPlayerScoreboard(active.scoreboard || {
            team_a_name: 'Team A',
            team_b_name: 'Team B',
            team_a_score: 0,
            team_b_score: 0,
            period: '1st Half',
            status: 'Warmup'
          });
        } else {
          setPlayerScoreboard(null);
        }
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadHostingData = async () => {
    if (!user) return;
    setLoadingHosting(true);
    try {
      const { data: groundsData } = await supabase
        .from('grounds')
        .select('*')
        .eq('owner_id', user.id);

      if (groundsData) {
        setMyGrounds(groundsData);
        const myGroundIds = groundsData.map((g) => g.id);

        if (myGroundIds.length > 0) {
          const { data: slotsData } = await supabase
            .from('slots')
            .select('*')
            .in('ground_id', myGroundIds);

          const slotsMap = {};
          const slotIds = [];
          if (slotsData) {
            slotsData.forEach((s) => {
              slotsMap[s.id] = s;
              slotIds.push(s.id);
            });
            setHostSlots(slotsMap);
          }

          if (slotIds.length > 0) {
            const { data: bookingsData } = await supabase
              .from('bookings')
              .select('*')
              .in('slot_id', slotIds);

            if (bookingsData) {
              const sorted = [...bookingsData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              setHostReservations(sorted);

              // Extract active scoreboard booking
              const active = sorted.find(b => b.session_status === 'active_playing');
              if (active) {
                setHostScoreboardBookingId(active.id);
                setHostScoreboard(active.scoreboard || {
                  team_a_name: 'Team A',
                  team_b_name: 'Team B',
                  team_a_score: 0,
                  team_b_score: 0,
                  period: '1st Half',
                  status: 'Warmup'
                });
              } else {
                setHostScoreboard(null);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading hosting data:', err);
    } finally {
      setLoadingHosting(false);
    }
  };

  useEffect(() => {
    loadBookingsData();
    loadHostingData();
  }, [user]);

  // Host Action: verify player OTP
  const handleVerifyOtp = async (bookingId, actualOtp) => {
    const entered = enteredOtp[bookingId];
    if (!entered || entered.length !== 6) {
      setOtpError(prev => ({ ...prev, [bookingId]: 'Enter a valid 6-digit code' }));
      return;
    }

    try {
      const { data, error } = await supabase.rpc('verify_booking_otp_checkin', {
        p_booking_id: bookingId,
        p_otp_code: entered
      });

      if (error) throw error;

      setOtpSuccess(prev => ({ ...prev, [bookingId]: 'Check-In Verified!' }));
      showToast('Player arrival check-in successfully logged!');
      await loadHostingData();
    } catch (err) {
      setOtpError(prev => ({ ...prev, [bookingId]: err.message || 'Verification failed' }));
    }
  };

  // Host Action: update live match scores
  const handleUpdateScoreboard = async (bookingId, side, action) => {
    if (!hostScoreboard) return;
    const scoreKey = side === 'A' ? 'team_a_score' : 'team_b_score';
    const currentScore = hostScoreboard[scoreKey];
    const newScore = action === 'up' ? currentScore + 1 : Math.max(0, currentScore - 1);
    
    const updated = {
      ...hostScoreboard,
      [scoreKey]: newScore
    };

    setHostScoreboard(updated);
    try {
      await supabase.from('bookings').update({ scoreboard: updated }).eq('id', bookingId);
      showToast('Score updated!');
    } catch (err) {
      console.error('Error updating score:', err);
    }
  };

  // Host Action: verify ground deeds
  const handleVerifyGround = async (groundId) => {
    try {
      const { error } = await supabase
        .from('grounds')
        .update({ is_verified: true })
        .eq('id', groundId);

      if (error) throw error;
      showToast('Ground ownership credentials verified!');
      await loadHostingData();
    } catch (err) {
      showToast(err.message || 'Verification failed.', 'error');
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-brand-dark pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-12 px-6 sm:px-12 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Unified Ground Booking Hub</h1>
            <p className="text-slate-400 text-sm font-light">Book slots at local arenas, list your own turf, and manage check-ins easily.</p>
          </div>
          
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-sport-green text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab('hosting')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hosting'
                  ? 'bg-sport-green text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Arenas & Hosting
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* ========================================================================= */}
        {/* BOOKINGS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-8">
            
            {/* Active Live Scoreboard widget */}
            {playerScoreboard && (
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1">
                    <PlayCircle className="h-4 w-4 text-indigo-400 animate-pulse" /> Live Scoreboard Tracker
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{playerScoreboard.period}</span>
                </div>
                <div className="flex justify-between items-center text-center max-w-md mx-auto">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">{playerScoreboard.team_a_name}</span>
                    <span className="text-3xl font-black text-white">{playerScoreboard.team_a_score}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 px-4">VS</div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">{playerScoreboard.team_b_name}</span>
                    <span className="text-3xl font-black text-white">{playerScoreboard.team_b_score}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Active Reservations</h2>
              <button 
                onClick={loadBookingsData}
                className="p-2 text-slate-450 hover:text-sport-green transition-colors cursor-pointer"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {loadingBookings ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-brand-card-dark border border-slate-200 dark:border-slate-800 rounded-3xl">
                <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-slate-400">You haven't booked any arenas yet.</p>
                <Link to="/explore" className="text-sport-green hover:underline mt-2 inline-block font-semibold">Explore nearby turfs</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.map((booking) => {
                  const slot = slots[booking.slot_id] || {};
                  const ground = grounds[slot.ground_id] || {};
                  
                  return (
                    <div 
                      key={booking.id}
                      className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            ID: {booking.id.substring(0, 8)}
                          </span>
                          <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                            booking.session_status === 'pending_checkin' ? 'bg-amber-100 text-amber-600' :
                            booking.session_status === 'active_playing' ? 'bg-indigo-100 text-indigo-600 animate-pulse' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {booking.session_status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <h3 className="font-display font-extrabold text-lg text-slate-850 dark:text-white mt-1">
                          {ground.title || 'Loading Venue...'}
                        </h3>
                        
                        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-sport-green" />
                            <span>Date: {new Date(slot.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-sport-green" />
                            <span>Time: {slot.start_time} - {slot.end_time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ticket OTP display */}
                      <div className="p-4 bg-slate-50 dark:bg-brand-dark/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Check-In OTP</p>
                          <span className="text-xl font-black text-sport-green tracking-widest">{booking.checkin_otp}</span>
                        </div>
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 text-right max-w-[120px] leading-relaxed">
                          Provide this code to ground host on arrival
                        </span>
                      </div>

                      {/* Review details */}
                      {booking.session_status === 'completed' && (
                        <div className="pt-2">
                          <Link
                            to={`/ground/${ground.id}`}
                            className="w-full text-center block py-2.5 border border-sport-green text-sport-green hover:bg-sport-green/10 text-xs font-bold rounded-xl transition-all"
                          >
                            Submit Feedback & Rating
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* HOSTING TAB */}
        {/* ========================================================================= */}
        {activeTab === 'hosting' && (
          <div className="space-y-10">
            
            {/* Header toolbar */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-slate-800/80">
              <h2 className="font-display font-extrabold text-xl text-slate-850 dark:text-white">Host & Manage Arenas</h2>
              <Link
                to="/admin/add-ground"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-sport-green to-sport-green-dark text-white text-xs font-bold rounded-xl shadow-md glow-green transition-all"
              >
                <Plus className="h-4 w-4" /> List My Turf
              </Link>
            </div>

            {loadingHosting ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myGrounds.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-brand-card-dark border border-slate-200 dark:border-slate-800 rounded-3xl">
                <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-slate-400">You haven't listed any sports grounds yet.</p>
                <Link to="/admin/add-ground" className="text-sport-green hover:underline mt-2 inline-block font-semibold">List your first arena now</Link>
              </div>
            ) : (
              <div className="space-y-12">
                
                {/* Active Match scoreboard manager */}
                {hostScoreboard && (
                  <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-850 shadow-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-sport-green flex items-center gap-1.5">
                        <PlayCircle className="h-4 w-4 text-sport-green animate-pulse" /> Active Match Controller
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Live Scoreboard Sync</span>
                    </div>

                    <div className="flex justify-between items-center max-w-md mx-auto text-center">
                      <div className="space-y-2">
                        <span className="text-xs text-slate-400 font-bold block">{hostScoreboard.team_a_name}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateScoreboard(hostScoreboardBookingId, 'A', 'down')}
                            className="h-8 w-8 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="text-2xl font-black w-8">{hostScoreboard.team_a_score}</span>
                          <button 
                            onClick={() => handleUpdateScoreboard(hostScoreboardBookingId, 'A', 'up')}
                            className="h-8 w-8 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-650 px-4">VS</div>

                      <div className="space-y-2">
                        <span className="text-xs text-slate-400 font-bold block">{hostScoreboard.team_b_name}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateScoreboard(hostScoreboardBookingId, 'B', 'down')}
                            className="h-8 w-8 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="text-2xl font-black w-8">{hostScoreboard.team_b_score}</span>
                          <button 
                            onClick={() => handleUpdateScoreboard(hostScoreboardBookingId, 'B', 'up')}
                            className="h-8 w-8 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grounds lists & verification checklist grids */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {myGrounds.map((g) => (
                    <div 
                      key={g.id}
                      className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-sm flex flex-col justify-between space-y-6"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-450 uppercase">{g.sport_type}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            g.is_verified ? 'bg-sport-green/10 text-sport-green' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {g.is_verified ? 'Verified ✓' : 'Pending Verification'}
                          </span>
                        </div>

                        <h3 className="font-display font-black text-xl text-slate-850 dark:text-white mt-1">
                          {g.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-light truncate">{g.location}</p>
                      </div>

                      {/* Deeds checklist if ground is not verified */}
                      {!g.is_verified && (
                        <div className="p-4 bg-slate-50 dark:bg-brand-dark/40 border border-slate-150/65 dark:border-slate-800 rounded-2xl space-y-3 text-left">
                          <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                            Deeds Verification Checklist
                          </h4>
                          
                          <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-450">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!verifiedChecks[`${g.id}-landRegistry`]}
                                onChange={() => handleToggleCheck(g.id, 'landRegistry')}
                                className="accent-sport-green rounded"
                              />
                              <span>Land Registry ID matches official deeds records</span>
                            </label>
                            
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!verifiedChecks[`${g.id}-municipalLicense`]}
                                onChange={() => handleToggleCheck(g.id, 'municipalLicense')}
                                className="accent-sport-green rounded"
                              />
                              <span>Municipal Sports Arena License matches listing</span>
                            </label>
                            
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!verifiedChecks[`${g.id}-ownerIdentity`]}
                                onChange={() => handleToggleCheck(g.id, 'ownerIdentity')}
                                className="accent-sport-green rounded"
                              />
                              <span>Profile identity name matches deeds documents</span>
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleVerifyGround(g.id)}
                            disabled={!isGroundReadyToVerify(g.id)}
                            className="w-full mt-2 py-2.5 bg-sport-green text-white text-xs font-bold rounded-xl shadow-md glow-green disabled:bg-slate-300 disabled:shadow-none cursor-pointer text-center"
                          >
                            Verify Arena Listings
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          to={`/admin/slots/${g.id}`}
                          className="flex-1 text-center py-2.5 border border-slate-200 dark:border-slate-800 hover:border-sport-green hover:text-sport-green text-xs font-bold rounded-xl transition-all"
                        >
                          Manage Slots
                        </Link>
                        <Link
                          to={`/admin/revenue`}
                          className="flex-1 text-center py-2.5 border border-slate-200 dark:border-slate-800 hover:border-sport-green hover:text-sport-green text-xs font-bold rounded-xl transition-all"
                        >
                          Revenue Stats
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Arrivals & check-in verification panel */}
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-xl text-slate-850 dark:text-white">Pending Player Check-Ins</h3>
                  
                  {hostReservations.filter(b => b.session_status === 'pending_checkin').length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-brand-card-dark border border-slate-200 dark:border-slate-800 rounded-3xl text-xs text-slate-400">
                      No player arrivals waiting to check-in right now.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hostReservations
                        .filter(b => b.session_status === 'pending_checkin')
                        .map((res) => {
                          const slot = hostSlots[res.slot_id] || {};
                          const ground = myGrounds.find(g => g.id === slot.ground_id) || {};
                          
                          return (
                            <div 
                              key={res.id}
                              className="p-5 bg-white dark:bg-brand-card-dark border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col justify-between space-y-4"
                            >
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-bold text-slate-400">Reservation #{res.id.substring(0, 8)}</span>
                                <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white">{ground.title}</h4>
                                <p className="text-[10px] text-slate-450 font-bold">Slot: {slot.start_time} - {slot.end_time}</p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    maxLength="6"
                                    value={enteredOtp[res.id] || ''}
                                    onChange={(e) => setEnteredOtp(prev => ({ ...prev, [res.id]: e.target.value }))}
                                    placeholder="Enter 6-digit OTP"
                                    className="flex-1 px-3 py-2 text-xs border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleVerifyOtp(res.id)}
                                    className="px-4 py-2 bg-sport-green text-white text-xs font-bold rounded-xl shadow-md glow-green hover:-translate-y-0.5 transition-all cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                </div>
                                {otpError[res.id] && <p className="text-[10px] text-red-500 font-bold">{otpError[res.id]}</p>}
                                {otpSuccess[res.id] && <p className="text-[10px] text-sport-green font-bold">{otpSuccess[res.id]}</p>}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
