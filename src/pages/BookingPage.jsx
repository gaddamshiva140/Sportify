import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CreditCard, ShieldCheck, Ticket, AlertTriangle, Loader2, Sparkles, Calendar, Clock, Landmark } from 'lucide-react';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get('slot');
  const groundId = searchParams.get('ground');
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [ground, setGround] = useState(null);
  const [slot, setSlot] = useState(null);
  
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null); // null, success, failed
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, upi

  // Redirect if not signed in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!slotId || !groundId) return;

    async function loadCheckoutData() {
      setLoadingData(true);
      try {
        // Load ground
        const { data: groundData } = await supabase
          .from('grounds')
          .select('*')
          .eq('id', groundId)
          .single();
        
        // Load slot
        const { data: slotData } = await supabase
          .from('slots')
          .select('*')
          .eq('id', slotId)
          .single();

        setGround(groundData);
        setSlot(slotData);
      } catch (err) {
        console.error('Error fetching checkout data', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadCheckoutData();
  }, [slotId, groundId]);

  const handlePayAndBook = async () => {
    if (!user || !slot || !ground) return;

    setSubmitting(true);
    setErrorMessage('');
    
    const newBookingId = `booking-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // Call booking database RPC function
      const { data, error } = await supabase.rpc('book_slot', {
        p_booking_id: newBookingId,
        p_user_id: user.id,
        p_slot_id: slot.id,
        p_total_price: ground.hourly_price
      });

      if (error) {
        setBookingSuccess('failed');
        setErrorMessage(error.message || 'Slot no longer available.');
        showToast(error.message || 'Slot no longer available.', 'error');
      } else if (data === 'success') {
        setBookingSuccess('success');
        showToast('Booking Confirmed successfully!');
      } else {
        setBookingSuccess('failed');
        setErrorMessage(data || 'Slot no longer available.');
        showToast(data || 'Slot no longer available.', 'error');
      }
    } catch (err) {
      setBookingSuccess('failed');
      setErrorMessage(err.message || 'Slot no longer available.');
      showToast(err.message || 'Slot no longer available.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Securing checkout session...</span>
      </div>
    );
  }

  if (!ground || !slot) {
    return (
      <div className="flex-1 max-w-md mx-auto py-20 text-center px-4">
        <div className="p-3.5 bg-red-50 text-red-600 rounded-xl mb-4 font-semibold text-sm">
          Invalid booking session. No slot selected.
        </div>
        <Link to="/explore" className="text-sport-green font-bold hover:underline">
          Back to exploration
        </Link>
      </div>
    );
  }

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  // SUCCESS SCREEN
  if (bookingSuccess === 'success') {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden p-8 text-center space-y-6">
          
          <div className="inline-flex bg-sport-green/20 p-4 rounded-full text-sport-green shadow-inner">
            <ShieldCheck className="h-12 w-12" />
          </div>

          <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white leading-tight">
            Booking Confirmed!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your reservation has been secured. Show this digital ticket at the venue check-in.
          </p>

          {/* Digital Ticket Layout */}
          <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-brand-dark/20 text-left overflow-hidden">
            {/* Cutout notch dots */}
            <div className="absolute top-1/2 -left-2 h-4 w-4 bg-white dark:bg-brand-dark border-r border-slate-200 dark:border-slate-800 rounded-full transform -translate-y-1/2" />
            <div className="absolute top-1/2 -right-2 h-4 w-4 bg-white dark:bg-brand-dark border-l border-slate-200 dark:border-slate-800 rounded-full transform -translate-y-1/2" />
            
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Venue / Ground</span>
                <p className="font-display font-bold text-base text-slate-850 dark:text-white line-clamp-1">{ground.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Date</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">{formatDate(slot.start_time)}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Timing</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-slate-250 dark:border-slate-850">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Booked By</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">{user?.full_name}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Amount Paid</span>
                  <p className="text-xs font-extrabold text-sport-green">₹{ground.hourly_price}</p>
                </div>
              </div>
            </div>

            {/* Simulated QR Code */}
            <div className="flex justify-center mt-5">
              <div className="p-2.5 bg-white border border-slate-100 rounded-xl flex items-center justify-center">
                <div className="w-24 h-24 bg-slate-900 grid grid-cols-5 gap-1 p-1">
                  {[...Array(25)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-sm ${
                        (i * 7 + 13) % 2 === 0 ? 'bg-white' : 'bg-slate-900'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[8px] uppercase tracking-wider text-center font-bold text-slate-400 mt-2">
              Sportify Digital Ticket ID: {slot.id.substring(0, 8)}
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex w-full justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-sport-green hover:bg-slate-800 dark:hover:bg-sport-green-dark transition-colors cursor-pointer"
            >
              <Ticket className="h-4.5 w-4.5" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // FAILURE SCREEN
  if (bookingSuccess === 'failed') {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white dark:bg-brand-card-dark rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-8 text-center space-y-6">
          <div className="inline-flex bg-red-50 dark:bg-red-950/20 p-4 rounded-full text-red-650 shadow-inner animate-shake">
            <AlertTriangle className="h-12 w-12" />
          </div>

          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
            Reservation Failed!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {errorMessage || 'Slot no longer available.'}
          </p>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/15 border border-amber-200/40 dark:border-amber-900/30 text-xs font-semibold text-slate-600 dark:text-slate-400 text-left leading-relaxed">
            <span className="font-extrabold text-amber-800 dark:text-amber-500 block mb-1">Why did this happen?</span>
            To prevent double bookings, Sportify utilizes database lock isolation. When another player completes checking out a split second before you, the slot status changes to booked and your transaction gets auto-rolled back.
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              to={`/ground/${ground.id}`}
              className="inline-flex w-full justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-sport-green hover:bg-sport-green-dark transition-colors cursor-pointer"
            >
              Choose Another Slot
            </Link>
            <Link
              to="/explore"
              className="text-xs text-slate-450 dark:text-slate-550 hover:underline font-semibold"
            >
              Back to Explore Arenas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CHECKOUT SCREEN
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white mb-8 text-center">
        Complete Reservation
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Checkout Summary Details */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Ground Summary */}
          <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-4">
            <h2 className="font-display font-bold text-lg text-slate-850 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/85">
              <Landmark className="h-4.5 w-4.5 text-sport-green" />
              Venue Summary
            </h2>

            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">{ground.title}</h3>
                <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {ground.sport_type} ({ground.indoor_outdoor})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-sport-green shrink-0" />
                  <span>{formatDate(slot.start_time)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Clock className="h-4 w-4 text-sport-green shrink-0" />
                  <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Protection Notice */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-850 dark:from-brand-card-dark dark:to-brand-card-dark border border-slate-800 rounded-2xl text-white space-y-2 shadow-md">
            <span className="text-[9px] font-extrabold uppercase bg-sport-green/20 text-sport-green px-2 py-0.5 rounded-md border border-sport-green/30 tracking-wider">
              Protected Checkout
            </span>
            <h3 className="font-bold text-sm">Double-Booking Transaction Lock</h3>
            <p className="text-xs text-slate-350 leading-relaxed font-light">
              This slot is reserved for checkout. Completing payment inserts a transaction record with a unique constraint validation. In the case of parallel checkouts, the database handles lock prioritization atomic safety.
            </p>
          </div>

        </div>

        {/* Payment Checkout Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-lg space-y-6">
            <h2 className="font-display font-bold text-lg text-slate-850 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="h-4.5 w-4.5 text-sport-green" />
              Secure Payment
            </h2>

            {/* Pricing math */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-550 dark:text-slate-400">
                <span>Hourly Fee</span>
                <span>₹{ground.hourly_price}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-550 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Convenience Tax</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between font-display font-extrabold text-lg text-slate-850 dark:text-white pt-1">
                <span>Total Amount</span>
                <span className="text-sport-green">₹{ground.hourly_price}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-brand-dark p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-white dark:bg-brand-card-dark text-sport-green shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  💳 Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-white dark:bg-brand-card-dark text-sport-green shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  ⚡ UPI ID
                </button>
              </div>
            </div>

            {/* MOCK payment details */}
            {paymentMethod === 'card' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Card Number (Mock)"
                  disabled
                  value="4242 •••• •••• 4242"
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-dark/30 text-slate-400 dark:text-slate-500 text-xs focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    disabled
                    value="12/29"
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-dark/30 text-slate-400 dark:text-slate-500 text-xs focus:outline-none text-center"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    disabled
                    value="•••"
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-dark/30 text-slate-400 dark:text-slate-500 text-xs focus:outline-none text-center"
                  />
                </div>
              </div>
            ) : (
              <input
                type="text"
                placeholder="UPI ID"
                disabled
                value="player@upi"
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-dark/30 text-slate-400 dark:text-slate-500 text-xs focus:outline-none"
              />
            )}

            <button
              onClick={handlePayAndBook}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green shadow-lg glow-green hover:-translate-y-0.5 transition-all disabled:bg-slate-350 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Processing Transaction...
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5" />
                  Confirm & Pay ₹{ground.hourly_price}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
