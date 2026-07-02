import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, ChevronLeft, ToggleLeft, Lock, Unlock, ShieldAlert, Sparkles } from 'lucide-react';

export default function SlotManagement() {
  const { groundId } = useParams();
  const { user } = useAuth();

  const [ground, setGround] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(0); // 0 = Today, 1 = Tomorrow
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [updatingSlotId, setUpdatingSlotId] = useState(null);

  useEffect(() => {
    if (!groundId) return;

    async function loadGround() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('grounds')
          .select('*')
          .eq('id', groundId)
          .single();
        if (data) setGround(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGround();
  }, [groundId]);

  const fetchSlots = async () => {
    if (!ground) return;
    setLoadingSlots(true);
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + selectedDate);
      const targetDateStr = targetDate.toDateString();

      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('ground_id', ground.id)
        .order('start_time', { ascending: true });

      if (!error && data) {
        // filter locally
        const filtered = data.filter(s => {
          const slotDateStr = new Date(s.start_time).toDateString();
          return slotDateStr === targetDateStr;
        });
        setSlots(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [ground, selectedDate]);

  const toggleSlotStatus = async (slotId, currentStatus) => {
    if (currentStatus === 'booked') {
      alert('This slot is reserved by a customer and cannot be toggled. Cancel the reservation first.');
      return;
    }

    const nextStatus = currentStatus === 'available' ? 'blocked' : 'available';
    setUpdatingSlotId(slotId);

    try {
      const { error } = await supabase
        .from('slots')
        .update({ status: nextStatus })
        .eq('id', slotId);

      if (error) throw error;
      
      // Reload slots
      fetchSlots();
    } catch (err) {
      alert(`Error updating slot status: ${err.message}`);
    } finally {
      setUpdatingSlotId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading schedules...</span>
      </div>
    );
  }

  if (!ground) {
    return (
      <div className="flex-1 max-w-md mx-auto py-20 text-center px-4">
        <div className="p-3 bg-red-100 text-red-650 rounded-2xl mb-4 font-semibold text-sm">
          Ground schedule not found.
        </div>
        <Link to="/manage-grounds" className="text-sport-green font-bold hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const getDates = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return [
      { label: `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`, value: 0 },
      { label: `Tomorrow, ${tomorrow.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`, value: 1 },
    ];
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Back button */}
      <Link to="/manage-grounds" className="inline-flex items-center gap-1 text-xs font-bold text-slate-550 dark:text-slate-400 hover:text-sport-green mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Arenas
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sport-green/10 text-sport-green uppercase tracking-wide">
            {ground.sport_type} Schedule
          </span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white mt-2 leading-tight">
            {ground.title} Slots
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Toggle slot statuses to block booking access for match matches or maintenance
          </p>
        </div>
        
        {/* Date Selector */}
        <div className="flex bg-slate-100 dark:bg-brand-dark p-1 rounded-xl w-full sm:w-auto">
          {getDates().map((dt) => (
            <button
              key={dt.value}
              type="button"
              onClick={() => setSelectedDate(dt.value)}
              className={`flex-1 sm:flex-none py-2 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                selectedDate === dt.value
                  ? 'bg-white dark:bg-brand-card-dark text-sport-green shadow-sm'
                  : 'text-slate-500 hover:text-slate-750'
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slots grid list */}
      {loadingSlots ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 border-3 border-sport-green border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing slots...</span>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-brand-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500">
          No slots registered for this date.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {slots.map((slot) => {
            const isAvailable = slot.status === 'available';
            const isBooked = slot.status === 'booked';
            const isBlocked = slot.status === 'blocked';
            const isUpdating = updatingSlotId === slot.id;

            let cardBorder = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-card-dark';
            let badgeColor = '';
            
            if (isBooked) {
              cardBorder = 'border-red-200 dark:border-red-950/40 bg-red-50/10 dark:bg-red-950/5';
              badgeColor = 'bg-red-100 dark:bg-red-950/20 text-red-650 dark:text-red-400';
            } else if (isBlocked) {
              cardBorder = 'border-slate-200/50 dark:border-slate-850/80 bg-slate-50/30 dark:bg-brand-dark/10';
              badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
            } else {
              cardBorder = 'border-green-200 dark:border-green-950/45 bg-green-50/10 dark:bg-green-950/5';
              badgeColor = 'bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400';
            }

            return (
              <div
                key={slot.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all gap-4 ${cardBorder}`}
              >
                {/* Time & badge info */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Timing</span>
                    <span className="font-display font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-sport-green shrink-0" />
                      {formatTime(slot.start_time)}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor}`}>
                    {slot.status}
                  </span>
                </div>

                {/* Slot toggler button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                    {isBooked ? 'Customer reservation' : 'Block public booking'}
                  </span>
                  
                  <button
                    type="button"
                    disabled={isBooked || isUpdating}
                    onClick={() => toggleSlotStatus(slot.id, slot.status)}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                      isBooked
                        ? 'border-slate-100 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : isAvailable
                          ? 'border-slate-200 dark:border-slate-800 hover:border-red-400 text-slate-650 hover:text-red-500'
                          : 'border-sport-green text-sport-green bg-sport-green/10 shadow-sm'
                    }`}
                  >
                    {isUpdating ? (
                      <span className="h-4 w-4 border-2 border-sport-green border-t-transparent rounded-full animate-spin" />
                    ) : isAvailable ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
