import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Star, MapPin, Landmark, Calendar, Clock, Check, Sparkles, 
  ChevronLeft, Navigation, AlertTriangle, CloudRain, Sun, Info, CheckCircle, Send
} from 'lucide-react';

const FACILITY_ICONS = {
  Parking: '🚗',
  Water: '💧',
  Floodlights: '💡',
  'Changing Room': '👕',
  Locker: '🔐',
  AC: '❄️',
  WiFi: '📶',
  'Bats/Balls Provided': '🏏',
  'Rackets on Rent': '🏸',
  Restrooms: '🚽',
  Scoreboard: '📊',
};

export default function GroundDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [ground, setGround] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(0); // 0 = Today, 1 = Tomorrow
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [eligibleToReview, setEligibleToReview] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Simulated Weather Status
  const [weatherAlert, setWeatherAlert] = useState(null);

  // Fetch ground details
  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('grounds')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setGround(data);

        // Generate weather alert based on indoor/outdoor and coordinate
        if (data) {
          if (data.indoor_outdoor === 'indoor') {
            setWeatherAlert({
              type: 'safe',
              text: 'Indoor Court: Completely climate controlled. Play session unaffected by wind, rain, or heat.',
              icon: <Info className="h-5 w-5 text-indigo-455" />
            });
          } else {
            // Outdoor weather simulations based on lat coordinates
            const rand = Math.abs(data.latitude * 10) % 3;
            if (rand < 1) {
              setWeatherAlert({
                type: 'warning',
                text: 'Heavy Rain Forecast: Outdoor turf session could be disrupted. Booking an indoor court is recommended.',
                icon: <CloudRain className="h-5 w-5 text-amber-500 animate-bounce" />
              });
            } else {
              setWeatherAlert({
                type: 'safe',
                text: 'Sunny & Clear Skies: Perfect atmospheric conditions for outdoor play sessions.',
                icon: <Sun className="h-5 w-5 text-emerald-500 animate-spin-slow" />
              });
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Ground details not found.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  // Load reviews list and check player eligibility
  const loadReviews = async () => {
    try {
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('ground_id', id);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      if (profilesData) {
        const pMap = {};
        profilesData.forEach(p => {
          pMap[p.id] = p.full_name;
        });
        setProfiles(pMap);
      }

      if (reviewsData) {
        setReviews(reviewsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));

        // Determine if player has completed check-in for this ground
        if (user && user.role === 'player') {
          const alreadyReviewed = reviewsData.some(r => r.user_id === user.id);
          if (!alreadyReviewed) {
            const { data: bookingsData } = await supabase
              .from('bookings')
              .select('*')
              .eq('user_id', user.id);

            if (bookingsData && bookingsData.length > 0) {
              const slotIds = bookingsData.map(b => b.slot_id);
              const { data: slotsData } = await supabase
                .from('slots')
                .select('*')
                .in('id', slotIds);

              if (slotsData) {
                const hasBookedAndCheckedIn = bookingsData.some(b => {
                  const s = slotsData.find(slot => slot.id === b.slot_id);
                  return s && s.ground_id === id && (b.session_status === 'active_playing' || b.session_status === 'completed');
                });
                setEligibleToReview(hasBookedAndCheckedIn);
              }
            }
          } else {
            setEligibleToReview(false);
          }
        }
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [id, user]);

  // Fetch slots for selected date
  useEffect(() => {
    if (!ground) return;
    
    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null); // Reset selection
      try {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + selectedDate);
        const targetDateStr = dateObj.toDateString();

        const { data, error } = await supabase
          .from('slots')
          .select('*')
          .eq('ground_id', ground.id)
          .order('start_time', { ascending: true });

        if (!error && data) {
          const filtered = data.filter((s) => {
            const slotDateStr = new Date(s.start_time).toDateString();
            return slotDateStr === targetDateStr;
          });
          setSlots(filtered);
        }
      } catch (err) {
        console.error('Error fetching slots', err);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [ground, selectedDate]);

  const handleBooking = () => {
    if (!selectedSlot) return;

    if (!user) {
      navigate('/login', { state: { from: { pathname: `/ground/${id}` } } });
      return;
    }

    if (user.role === 'owner') {
      showToast('Owners cannot book listed slots.', 'error');
      return;
    }

    // Pass chosen slot state forward
    navigate('/book-slot', { state: { slot: selectedSlot, ground } });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackInput.trim()) {
      showToast('Please enter your review feedback text.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          ground_id: id,
          user_id: user.id,
          rating: ratingInput,
          feedback_text: feedbackInput.trim()
        });

      if (error) throw error;

      showToast('Review feedback submitted successfully!');
      setFeedbackInput('');
      setRatingInput(5);
      
      // Reload reviews and ground details (to sync avg rating)
      await loadReviews();
      const { data: updatedGround } = await supabase
        .from('grounds')
        .select('*')
        .eq('id', id)
        .single();
      if (updatedGround) {
        setGround(updatedGround);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getDates = () => {
    const dates = [];
    const today = new Date();
    dates.push({ value: 0, label: `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}` });
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    dates.push({ value: 1, label: `Tomorrow, ${tomorrow.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}` });
    
    return dates;
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading ground details...</span>
      </div>
    );
  }

  if (error || !ground) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">Venue Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">{error || 'This grounds listing does not exist.'}</p>
        <Link to="/explore" className="mt-6 px-5 py-2.5 bg-sport-green text-white text-xs font-bold rounded-xl shadow-md cursor-pointer">
          Back to Explore
        </Link>
      </div>
    );
  }

  // Placeholder images for grounds
  const defaultImages = [
    'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop&q=60'
  ];
  const displayImages = ground.images && ground.images.length > 0 ? ground.images : defaultImages;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Navigation breadcrumb */}
      <Link 
        to="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4.5 w-4.5" />
        <span>Back to explore venues</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details, description, facilities, and REVIEWS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title & info summary */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="inline-block text-[9px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-900 text-white">
                {ground.sport_type}
              </span>
              <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full text-white ${
                ground.indoor_outdoor === 'indoor' ? 'bg-indigo-600/80' : 'bg-amber-600/80'
              }`}>
                {ground.indoor_outdoor}
              </span>
              {ground.is_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-205/20">
                  <CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white" />
                  Verified Venue
                </span>
              )}
              {ground.rating >= 4.8 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-250/20">
                  🏆 Top Rated Venue
                </span>
              )}
            </div>
            
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
              {ground.title}
            </h1>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-800 dark:text-slate-350">{ground.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${ground.latitude},${ground.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sport-green hover:underline cursor-pointer"
              >
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Get Directions (Maps)</span>
              </a>
            </div>
          </div>

          {/* Weather Warning Box */}
          {weatherAlert && (
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 shadow-sm ${
              weatherAlert.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/10 border-amber-200/40 text-slate-700 dark:text-slate-300'
                : 'bg-emerald-50/40 dark:bg-emerald-950/5 border-emerald-250/20 text-slate-700 dark:text-slate-300'
            }`}>
              <div className="shrink-0 mt-0.5">
                {weatherAlert.icon}
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                  {weatherAlert.type === 'warning' ? 'Weather Warning' : 'Weather Advisory'}
                </span>
                <p className="leading-relaxed">{weatherAlert.text}</p>
              </div>
            </div>
          )}

          {/* Image Slider/Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-3xl overflow-hidden shadow-sm">
            <div className="sm:col-span-2 aspect-video overflow-hidden">
              <img
                src={displayImages[0]}
                alt={ground.title}
                className="w-full h-full object-cover"
              />
            </div>
            {displayImages.slice(1, 3).map((url, idx) => (
              <div key={idx} className="aspect-video overflow-hidden">
                <img src={url} alt={`${ground.title} gallery`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/85 rounded-2xl">
            <h2 className="font-display font-bold text-lg text-slate-850 dark:text-white mb-3">About this venue</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {ground.description || 'No description provided by the venue manager.'}
            </p>
          </div>

          {/* Facilities / Amenities */}
          <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/85 rounded-2xl">
            <h2 className="font-display font-bold text-lg text-slate-850 dark:text-white mb-4">Venue Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ground.facilities?.map((fac) => (
                <div
                  key={fac}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-brand-dark/20 text-slate-700 dark:text-slate-350 text-sm font-semibold"
                >
                  <span className="text-base">{FACILITY_ICONS[fac] || '⭐'}</span>
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews & Feedback Section */}
          <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/85 rounded-3xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-850 dark:text-white">Player Reviews & Feedback</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Verified play feedback</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-400/10 text-amber-505 px-3 py-1 rounded-xl border border-amber-400/20">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black">{ground.rating?.toFixed(1) || '5.0'}</span>
              </div>
            </div>

            {/* Leave a review block (Only visible to verified bookings who haven't feedbacked yet) */}
            {eligibleToReview && (
              <form onSubmit={handleReviewSubmit} className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-brand-dark/30 dark:to-brand-dark/10 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white">Write Ground Feedback</h3>
                    <p className="text-[10px] text-slate-400 leading-tight">Share your verified playing experience</p>
                  </div>
                  
                  {/* Interactive Star Picker */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`h-5 w-5 ${
                          star <= ratingInput 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-350 dark:text-slate-700'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    required
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Describe court condition, light systems, net heights..."
                    rows="3"
                    className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-brand-dark/40 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green text-xs font-medium"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-sport-green text-white text-xs font-bold rounded-xl hover:bg-sport-green-dark transition-all shadow-md glow-green cursor-pointer disabled:bg-slate-400"
                  >
                    {submittingReview ? (
                      <div className="h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500">
                No player feedback left yet. Be the first to leave feedback after checking in!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-white dark:bg-brand-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-sport-green/10 text-sport-green text-xs font-bold flex items-center justify-center uppercase">
                          {(profiles[rev.user_id] || 'P')[0]}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                            {profiles[rev.user_id] || 'Verified Player'}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-medium">
                            Reviewed on {formatDate(rev.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Display Rating Stars */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-3.5 w-3.5 ${
                            star <= rev.rating 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-slate-200 dark:text-slate-800'
                          }`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light pl-9">
                      {rev.feedback_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Slot Selection card & Booking Engine */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-lg space-y-6">
            
            {/* Price section */}
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-end">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Hourly Price</span>
                <span className="block font-display font-extrabold text-3xl text-slate-850 dark:text-white mt-1">
                  ₹{ground.hourly_price}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sport-green/10 text-sport-green uppercase tracking-wide">
                Live Pricing
              </span>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Select Date
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-brand-dark p-1 rounded-xl">
                {getDates().map((dt) => (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setSelectedDate(dt.value)}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      selectedDate === dt.value
                        ? 'bg-white dark:bg-brand-card-dark text-sport-green shadow-sm'
                        : 'text-slate-550'
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slots Grid Selector */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Available Slots
                </label>
                <span className="text-xs font-bold text-slate-455">
                  {slots.filter(s => s.status === 'available').length} Open
                </span>
              </div>

              {loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="h-6 w-6 border-2 border-sport-green border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing schedule...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-400 dark:text-slate-550">
                  No slots scheduled for this day.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const isAvailable = slot.status === 'available';
                    const isBooked = slot.status === 'booked';
                    const isBlocked = slot.status === 'blocked';
                    const isSelected = selectedSlot?.id === slot.id;

                    let btnClass = '';
                    if (isBooked) {
                      btnClass = 'bg-red-50 dark:bg-red-950/10 border-red-105 dark:border-red-900/20 text-red-450 cursor-not-allowed';
                    } else if (isBlocked) {
                      btnClass = 'bg-slate-50 dark:bg-slate-850/50 border-slate-105 dark:border-slate-800 text-slate-400 cursor-not-allowed';
                    } else if (isSelected) {
                      btnClass = 'bg-sport-green border-sport-green text-white shadow-md glow-green font-bold';
                    } else {
                      btnClass = 'bg-white dark:bg-brand-card-dark border-slate-200 dark:border-slate-800 hover:border-sport-green text-slate-700 dark:text-slate-355 cursor-pointer';
                    }

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-1 border text-center rounded-xl text-xs transition-all ${btnClass}`}
                      >
                        {formatTime(slot.start_time).split(' ')[0]}
                        <span className="block text-[8px] uppercase tracking-wide opacity-80">
                          {formatTime(slot.start_time).split(' ')[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Booking Details / Actions */}
            {selectedSlot && (
              <div className="p-3 bg-slate-50 dark:bg-brand-dark/40 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Selected Timing:</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-sport-green" />
                    {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!selectedSlot}
              onClick={handleBooking}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green shadow-lg glow-green hover:-translate-y-0.5 transition-all disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:-translate-y-0 disabled:shadow-none cursor-pointer"
            >
              <Sparkles className="h-4.5 w-4.5" />
              {selectedSlot ? 'Reserve Slot Now' : 'Select a Slot above'}
            </button>
            
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
              *By clicking Reserve, you lock this time slot under database transaction protection.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
