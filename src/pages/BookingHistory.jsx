import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, Clock, Landmark, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function BookingHistory() {
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [grounds, setGrounds] = useState({});
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadHistory() {
      setLoading(true);
      try {
        // Fetch all bookings for this user
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!bookingsErr && bookingsData) {
          setBookings(bookingsData);

          // Resolve slot details & ground titles in a hash map
          const { data: slotsData } = await supabase.from('slots').select('*');
          const { data: groundsData } = await supabase.from('grounds').select('*');

          const slotsMap = {};
          if (slotsData) {
            slotsData.forEach(s => { slotsMap[s.id] = s; });
          }

          const groundsMap = {};
          if (groundsData) {
            groundsData.forEach(g => { groundsMap[g.id] = g; });
          }

          setSlots(slotsMap);
          setGrounds(groundsMap);
        }
      } catch (err) {
        console.error('Error loading booking history', err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500">
        Please log in to view your bookings.
      </div>
    );
  }

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

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          Booking History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your previous games, schedules, and active receipts
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Retrieving game logs...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-sm">
          <Ticket className="h-12 w-12 text-slate-350 mx-auto mb-4 animate-bounce" />
          <h3 className="font-bold text-lg text-slate-850 dark:text-white">No Bookings Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            You haven't scheduled any games yet. Head to our venue exploration to book your first slot.
          </p>
          <Link
            to="/explore"
            className="mt-6 inline-flex px-6 py-3 text-xs font-bold rounded-xl text-white bg-sport-green hover:bg-sport-green-dark transition-colors shadow-md glow-green"
          >
            Explore Venues
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => {
            const slot = slots[booking.slot_id] || {};
            const ground = grounds[slot.ground_id] || {};

            return (
              <div
                key={booking.id}
                className="relative bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 overflow-hidden"
              >
                {/* Status tag */}
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/20">
                  <ShieldCheck className="h-3 w-3" />
                  Confirmed
                </div>

                {/* Main Info */}
                <div className="space-y-1 pr-16">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sport-green/10 text-sport-green uppercase tracking-wide">
                    {ground.sport_type || 'Sports'}
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-850 dark:text-white line-clamp-1 mt-1.5">
                    {ground.title || 'Unknown Venue'}
                  </h3>
                </div>

                {/* Schedule details */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sport-green shrink-0" />
                    <span>{formatDate(slot.start_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sport-green shrink-0" />
                    <span className="truncate">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                  </div>
                </div>

                {/* Footer price details */}
                <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-850 flex justify-between items-center mt-auto">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Amount Paid</span>
                    <span className="block font-display font-extrabold text-sm text-slate-800 dark:text-slate-350">
                      ₹{booking.total_price}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    ID: {booking.id.substring(0, 8)}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
