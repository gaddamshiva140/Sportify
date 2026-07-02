import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import GroundCard from '../components/GroundCard';
import GeolocationPrompt from '../components/GeolocationPrompt';
import { 
  Trophy, ShieldAlert, Award, Calendar, Search, MapPin, Zap, Flame
} from 'lucide-react';

const SPORTS_CATEGORIES = [
  { name: 'Football', count: 12, icon: '⚽', color: 'from-emerald-500/20 to-teal-500/20' },
  { name: 'Box Cricket', count: 8, icon: '🏏', color: 'from-green-500/20 to-emerald-600/20' },
  { name: 'Badminton', count: 15, icon: '🏸', color: 'from-blue-500/20 to-indigo-500/20' },
  { name: 'Basketball', count: 6, icon: '🏀', color: 'from-orange-500/20 to-red-500/20' },
  { name: 'Snooker/Billiards', count: 4, icon: '🎱', color: 'from-purple-500/20 to-pink-500/20' },
  { name: 'Volleyball', count: 5, icon: '🏐', color: 'from-sky-500/20 to-blue-500/20' },
];

export default function Home() {
  const { user } = useAuth();
  
  // Geolocation State
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem('sportify_user_coords');
    return saved ? JSON.parse(saved) : null;
  });

  const [nearbyGrounds, setNearbyGrounds] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const handleLocationAcquired = (lat, lng) => {
    const loc = { lat, lng };
    setCoords(loc);
    localStorage.setItem('sportify_user_coords', JSON.stringify(loc));
  };

  useEffect(() => {
    if (!coords) return;
    
    async function fetchNearby() {
      setLoadingNearby(true);
      try {
        // Radius of 15km
        const { data, error } = await supabase.rpc('search_nearby_grounds', {
          user_lat: coords.lat,
          user_lng: coords.lng,
          radius_km: 15.0
        });
        if (!error && data) {
          setNearbyGrounds(data);
        }
      } catch (err) {
        console.error('Error fetching nearby grounds', err);
      } finally {
        setLoadingNearby(false);
      }
    }

    fetchNearby();
  }, [coords]);

  const clearLocation = () => {
    setCoords(null);
    setNearbyGrounds([]);
    localStorage.removeItem('sportify_user_coords');
  };

  return (
    <div className="flex-1 w-full pb-16">
      {/* Hero Section */}
      <div className="relative min-h-[550px] flex items-center justify-center overflow-hidden bg-slate-950 text-white py-16 px-4">
        {/* Background Image with overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero_banner.jpg" 
            alt="Hero Banner" 
            className="w-full h-full object-cover opacity-35 object-center scale-105 transform transition-transform duration-[10000ms] ease-out hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-6 rounded-full bg-sport-green/20 border border-sport-green/30 text-sport-green text-xs font-bold uppercase tracking-wider animate-bounce">
            <Flame className="h-3.5 w-3.5" />
            Empowering Sports Enthusiasts
          </div>
          
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight leading-none mb-6">
            Reserve Your Arena.<br />
            <span className="bg-gradient-to-r from-sport-green to-sport-green-light bg-clip-text text-transparent">
              Fuel Your Passion.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-8 font-light">
            Discover premium football turfs, wooden basketball courts, synthetic badminton courts, and snooker lounges in real-time. Secure bookings instantly with zero hassle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/explore"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green text-white font-bold rounded-2xl shadow-lg glow-green hover:-translate-y-0.5 transition-all text-base cursor-pointer"
            >
              <Search className="h-5 w-5" />
              Explore Grounds
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-16">
        {/* Geolocation Section */}
        <section className="scroll-mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
                Discover Near You
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Real-time ground discovery based on your physical proximity.
              </p>
            </div>
            {coords && (
              <button
                onClick={clearLocation}
                className="text-xs font-semibold text-red-500 dark:text-red-400 hover:underline"
              >
                Clear Location & Reset
              </button>
            )}
          </div>

          {!coords ? (
            <GeolocationPrompt onLocationAcquired={handleLocationAcquired} />
          ) : (
            <div>
              {loadingNearby ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Calculating distance coordinates...</span>
                </div>
              ) : nearbyGrounds.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-brand-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <p className="text-slate-500 dark:text-slate-400">No sports grounds found within 15 km.</p>
                  <Link to="/explore" className="text-sport-green hover:underline mt-2 inline-block font-semibold">
                    Browse all arenas
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nearbyGrounds.map((ground) => (
                    <GroundCard key={ground.id} ground={ground} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Categories Section */}
        <section>
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
              Search by Category
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Filter by your favorite indoor or outdoor sport
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SPORTS_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/explore?sport=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center p-6 rounded-2xl border border-slate-250/50 dark:border-slate-800/80 bg-white dark:bg-brand-card-dark hover:border-sport-green dark:hover:border-sport-green transition-all shadow-sm hover:shadow-md cursor-pointer text-center"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5 group-hover:text-sport-green transition-colors">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Premium Features Section */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 overflow-hidden relative shadow-xl">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Trophy className="h-[300px] w-[300px]" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-sport-green px-2.5 py-1 rounded-full bg-sport-green/20">
              Why Sportify?
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight mt-4 mb-6">
              A Complete Booking Ecosystem
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl text-sport-green shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Real-Time Slot Verification</h3>
                  <p className="text-sm text-slate-300 mt-1">Check current operating times and make bookings. Instantly confirms reservations, preventing double-bookings.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl text-sport-green shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">GPS Location Discoverer</h3>
                  <p className="text-sm text-slate-300 mt-1">Calculates nearby venues using standard geodesic coordinates. Distance-sorting eliminates manual searches.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl text-sport-green shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Admin Dashboard</h3>
                  <p className="text-sm text-slate-300 mt-1">Venue owners get full analytical tooling, customizable schedules, image uploads, and live slot managers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
