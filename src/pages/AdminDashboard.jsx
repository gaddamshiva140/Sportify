import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { 
  Building, Calendar, TrendingUp, Sparkles, Plus, Landmark, Clock, 
  User, ShieldCheck, ChevronRight, CheckCircle, FileText, PlayCircle, RefreshCw 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [myGrounds, setMyGrounds] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);

  // OTP Validation input states
  const [enteredOtp, setEnteredOtp] = useState({});
  const [otpError, setOtpError] = useState({});
  const [otpSuccess, setOtpSuccess] = useState({});

  // Active Scoreboard State
  const [activeScoreboard, setActiveScoreboard] = useState(null);
  const [activeScoreboardBookingId, setActiveScoreboardBookingId] = useState(null);

  // Deeds Verification Checklist State
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

  const loadAdminData = async () => {
    if (!user) return;
    setLoading(true);
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
            setSlots(slotsMap);
          }

          if (slotIds.length > 0) {
            const { data: bookingsData } = await supabase
              .from('bookings')
              .select('*')
              .in('slot_id', slotIds);

            if (bookingsData) {
              const sorted = [...bookingsData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              setReservations(sorted);

              // Extract active scoreboard booking
              const active = sorted.find(b => b.session_status === 'active_playing');
              if (active) {
                setActiveScoreboardBookingId(active.id);
                setActiveScoreboard(active.scoreboard || {
                  team_a_name: 'Team A',
                  team_b_name: 'Team B',
                  team_a_score: 0,
                  team_b_score: 0,
                  period: '1st Half',
                  status: 'Warmup'
                });
              } else {
                setActiveScoreboard(null);
                setActiveScoreboardBookingId(null);
              }
            }
          }

          const { data: profilesData } = await supabase.from('profiles').select('*');
          if (profilesData) {
            const profMap = {};
            profilesData.forEach((p) => {
              profMap[p.id] = p;
            });
            setProfiles(profMap);
          }
        }
      }
    } catch (err) {
      console.error('Error loading admin details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const handleVerifyOtp = async (bookingId) => {
    const code = enteredOtp[bookingId];
    if (!code) return;

    setOtpError(prev => ({ ...prev, [bookingId]: '' }));
    setOtpSuccess(prev => ({ ...prev, [bookingId]: '' }));

    try {
      const { data, error } = await supabase.rpc('verify_booking_otp', {
        p_booking_id: bookingId,
        p_otp_code: code
      });

      if (error) {
        setOtpError(prev => ({ ...prev, [bookingId]: error.message }));
        showToast(error.message, 'error');
      } else if (data === 'success') {
        setOtpSuccess(prev => ({ ...prev, [bookingId]: 'Verified!' }));
        showToast('OTP verified successfully! Match session is now active.');
        loadAdminData();
      } else {
        setOtpError(prev => ({ ...prev, [bookingId]: data }));
        showToast(data, 'error');
      }
    } catch (err) {
      setOtpError(prev => ({ ...prev, [bookingId]: err.message }));
      showToast(err.message, 'error');
    }
  };

  const handleVerifyGroundDoc = async (groundId) => {
    try {
      const { error } = await supabase.rpc('verify_ground', { p_ground_id: groundId });
      if (error) throw error;
      
      showToast('Venue ownership document successfully verified.');
      loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateScoreboard = async (newScoreboard) => {
    if (!activeScoreboardBookingId) return;
    setActiveScoreboard(newScoreboard);
    try {
      await supabase.from('bookings').update({ scoreboard: newScoreboard }).eq('id', activeScoreboardBookingId);
      showToast('Score updated!');
    } catch(err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-550">
        Please log in to view the Admin Dashboard.
      </div>
    );
  }

  // Calculate stats
  const totalEarnings = reservations.reduce((sum, b) => sum + Number(b.total_price), 0);
  const activeBookingsCount = reservations.filter(r => {
    const slot = slots[r.slot_id] || {};
    return slot.start_time && new Date(slot.start_time) > new Date();
  }).length;

  const pendingVerificationGrounds = myGrounds.filter(g => !g.is_verified && g.license_doc !== null);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const activeMatchBooking = reservations.find(b => b.id === activeScoreboardBookingId);
  const activeMatchGround = activeMatchBooking ? myGrounds.find(g => g.id === slots[activeMatchBooking.slot_id]?.ground_id) : null;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-slate-900 via-brand-dark to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase bg-sport-green/20 text-sport-green px-2.5 py-1 rounded-full border border-sport-green/30">
            Manager Control Center
          </span>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-extrabold text-3xl tracking-tight mt-3">
              Welcome, {user.full_name}
            </h1>
            <button 
              onClick={loadAdminData}
              className="mt-3.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <p className="text-slate-350 text-sm font-light">
            Manage your grounds listings, verify player attendance OTPs, and inspect deed records.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0 z-10">
          <Link
            to="/admin/add-ground"
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green shadow-md glow-green hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Arena
          </Link>
          <Link
            to="/manage-grounds"
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors cursor-pointer"
          >
            Manage Arenas
          </Link>
        </div>
      </div>

      {/* Ground Ownership Document Verification Alert Panel */}
      {pendingVerificationGrounds.length > 0 && (
        <div className="p-6 bg-amber-50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-3xl space-y-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-display font-bold text-sm text-amber-800 dark:text-amber-500">
                Venue Deeds Verification Review Required
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-light mt-1">
                You have listed sports venues with uploaded proof documents. Review these deeds below to verify that you are the real owner of these grounds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingVerificationGrounds.map((g) => (
              <div 
                key={g.id}
                className="p-5 bg-white dark:bg-brand-card-dark rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-850 dark:text-white">{g.title}</h4>
                  <span className="text-[10px] text-slate-500 block font-medium mt-0.5">
                    Deed File: <strong className="text-sport-green">{g.license_doc || 'No document uploaded'}</strong>
                  </span>
                </div>

                {/* Verification Checklist */}
                <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Verify Owners Deeds Checklist</span>
                  
                  <label className="flex items-start gap-2.5 cursor-pointer leading-tight">
                    <input
                      type="checkbox"
                      checked={!!verifiedChecks[`${g.id}-landRegistry`]}
                      onChange={() => handleToggleCheck(g.id, 'landRegistry')}
                      className="rounded border-slate-300 dark:border-slate-700 text-sport-green focus:ring-sport-green mt-0.5 cursor-pointer"
                    />
                    <span>Land Registry ID matches official deeds records</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer leading-tight">
                    <input
                      type="checkbox"
                      checked={!!verifiedChecks[`${g.id}-municipalLicense`]}
                      onChange={() => handleToggleCheck(g.id, 'municipalLicense')}
                      className="rounded border-slate-300 dark:border-slate-700 text-sport-green focus:ring-sport-green mt-0.5 cursor-pointer"
                    />
                    <span>Local Municipal Sports Arena License matches listing</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer leading-tight">
                    <input
                      type="checkbox"
                      checked={!!verifiedChecks[`${g.id}-ownerIdentity`]}
                      onChange={() => handleToggleCheck(g.id, 'ownerIdentity')}
                      className="rounded border-slate-300 dark:border-slate-700 text-sport-green focus:ring-sport-green mt-0.5 cursor-pointer"
                    />
                    <span>Profile identity name matches deeds ownership documents</span>
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    disabled={!isGroundReadyToVerify(g.id)}
                    onClick={() => handleVerifyGroundDoc(g.id)}
                    className="w-full sm:w-auto px-4 py-2 bg-sport-green disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white text-xs font-bold rounded-xl hover:bg-sport-green-dark transition-all cursor-pointer text-center"
                  >
                    Confirm and Verify Venue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Match Scoreboard Widget */}
      {activeScoreboard && activeMatchGround && (
        <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-lg space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-500 border border-amber-400/30 px-3 py-1 rounded-full tracking-wider animate-pulse">
              <PlayCircle className="h-3.5 w-3.5" />
              Active Match Scoreboard (Owner Panel)
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
                value={activeScoreboard.team_a_name}
                onChange={(e) => updateScoreboard({ ...activeScoreboard, team_a_name: e.target.value })}
                className="w-full text-center bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-sport-green text-sm font-bold text-slate-800 dark:text-white uppercase focus:outline-none"
              />
              <div className="flex justify-center items-center gap-3 mt-1">
                <button
                  onClick={() => updateScoreboard({ ...activeScoreboard, team_a_score: Math.max(0, activeScoreboard.team_a_score - 1) })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-255 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="font-display font-extrabold text-3xl text-slate-800 dark:text-white">{activeScoreboard.team_a_score}</span>
                <button
                  onClick={() => updateScoreboard({ ...activeScoreboard, team_a_score: activeScoreboard.team_a_score + 1 })}
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
                value={activeScoreboard.period}
                onChange={(e) => updateScoreboard({ ...activeScoreboard, period: e.target.value })}
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
                value={activeScoreboard.team_b_name}
                onChange={(e) => updateScoreboard({ ...activeScoreboard, team_b_name: e.target.value })}
                className="w-full text-center bg-transparent border-b border-slate-200 dark:border-slate-805 focus:border-sport-green text-sm font-bold text-slate-800 dark:text-white uppercase focus:outline-none"
              />
              <div className="flex justify-center items-center gap-3 mt-1">
                <button
                  onClick={() => updateScoreboard({ ...activeScoreboard, team_b_score: Math.max(0, activeScoreboard.team_b_score - 1) })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-255 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="font-display font-extrabold text-3xl text-slate-800 dark:text-white">{activeScoreboard.team_b_score}</span>
                <button
                  onClick={() => updateScoreboard({ ...activeScoreboard, team_b_score: activeScoreboard.team_b_score + 1 })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-sport-green text-white hover:bg-sport-green-dark font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {loading && reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gathering admin details...</span>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Grounds Listed</span>
              <p className="font-display font-extrabold text-3xl text-slate-850 dark:text-white">{myGrounds.length}</p>
            </div>
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Upcoming Bookings</span>
              <p className="font-display font-extrabold text-3xl text-slate-850 dark:text-white">{activeBookingsCount}</p>
            </div>
            <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-455 uppercase tracking-wider block">Total Revenue</span>
                <Link to="/admin/revenue" className="text-[10px] text-sport-green font-bold hover:underline flex items-center">
                  Details <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
              <p className="font-display font-extrabold text-3xl text-sport-green">₹{totalEarnings}</p>
            </div>
          </div>

          {/* Recent Reservations Table */}
          <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                Recent Customer Reservations
              </h2>
              <span className="text-xs font-bold text-slate-400">
                {reservations.length} total bookings
              </span>
            </div>

            {reservations.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-505 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No active reservations found for your venues yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-450 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Venue</th>
                      <th className="pb-3 px-4">Customer</th>
                      <th className="pb-3 px-4">Date & Slot</th>
                      <th className="pb-3 px-4">Amount</th>
                      <th className="pb-3 px-4">Session Verification</th>
                      <th className="pb-3 pl-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                    {reservations.slice(0, 10).map((res) => {
                      const slot = slots[res.slot_id] || {};
                      const ground = myGrounds.find(g => g.id === slot.ground_id) || {};
                      const customer = profiles[res.user_id] || {};
                      
                      const isPendingCheckin = res.session_status === 'pending_checkin' || !res.session_status;
                      const isActivePlaying = res.session_status === 'active_playing';
                      const isCompleted = res.session_status === 'completed';

                      return (
                        <tr key={res.id} className="text-slate-705 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-brand-dark/25 transition-colors">
                          <td className="py-4 pr-4 font-semibold text-slate-850 dark:text-white">
                            <div className="flex items-center gap-1">
                              {ground.title}
                              {ground.is_verified && (
                                <CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white shrink-0" title="Verified Owner Listing" />
                              )}
                            </div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {ground.sport_type}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium">{customer.full_name || 'Player'}</span>
                            <span className="block text-[10px] text-slate-400">{customer.phone_number || 'No Phone'}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium">{formatDate(slot.start_time)}</span>
                            <span className="block text-[10px] text-slate-400">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-300">
                            ₹{res.total_price}
                          </td>
                          
                          {/* OTP verification check-in block */}
                          <td className="py-4 px-4">
                            {isPendingCheckin ? (
                              <div className="space-y-1.5 max-w-[170px]">
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Enter OTP code"
                                    maxLength="6"
                                    value={enteredOtp[res.id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEnteredOtp(prev => ({ ...prev, [res.id]: val }));
                                    }}
                                    className="block w-24 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-brand-dark text-xs font-bold text-center"
                                  />
                                  <button
                                    onClick={() => handleVerifyOtp(res.id)}
                                    className="px-2.5 py-1 bg-sport-green text-white text-[10px] font-bold rounded hover:bg-sport-green-dark transition-colors cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                </div>
                                {otpError[res.id] && (
                                  <p className="text-[10px] text-red-500 font-semibold">{otpError[res.id]}</p>
                                )}
                              </div>
                            ) : isActivePlaying ? (
                              <div className="space-y-1 text-slate-800 dark:text-slate-350">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-500 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 uppercase tracking-wide">
                                  <PlayCircle className="h-3.5 w-3.5 animate-pulse" />
                                  Match Playing
                                </span>
                                <span className="block text-[9px] text-slate-400">
                                  Check-in: {formatTime(res.checkin_time)}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-green-500 bg-green-400/10 px-2 py-0.5 rounded border border-green-455/20 uppercase tracking-wide">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Session Over
                              </span>
                            )}
                          </td>

                          <td className="py-4 pl-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/20">
                              <ShieldCheck className="h-3 w-3" />
                              Paid
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
