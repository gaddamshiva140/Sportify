import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import GroundCard from '../components/GroundCard';
import AiRecommender from '../components/Explore/AiRecommender';
import { Search, SlidersHorizontal, MapPin, Sparkles, HelpCircle } from 'lucide-react';

const STATIC_SPORTS = [
  'All Sports',
  'Football',
  'Box Cricket',
  'Basketball',
  'Volleyball',
  'Badminton',
  'Snooker/Billiards',
  'Chess Arenas',
  'Gaming Arenas'
];

const FACILITIES_LIST = ['Parking', 'Water', 'Floodlights', 'Changing Room', 'Locker', 'AC', 'WiFi'];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSport = searchParams.get('sport') || 'All Sports';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [indoorOutdoor, setIndoorOutdoor] = useState('all'); // all, indoor, outdoor
  const [selectedFacilities, setSelectedFacilities] = useState([]);

  const CITY_COORDS = {
    mumbai: { lat: 19.0760, lng: 72.8777 },
    bandra: { lat: 19.0600, lng: 72.8300 },
    andheri: { lat: 19.1200, lng: 72.8500 },
    powai: { lat: 19.1200, lng: 72.9100 },
    pune: { lat: 18.5204, lng: 73.8567 },
    delhi: { lat: 28.6139, lng: 77.2090 },
    bengaluru: { lat: 12.9716, lng: 77.5946 },
    colaba: { lat: 18.9067, lng: 72.8147 },
    goa: { lat: 15.2993, lng: 74.1240 },
    hyderabad: { lat: 17.3850, lng: 78.4867 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    kolkata: { lat: 22.5726, lng: 88.3639 }
  };

  const handleLocationSearch = (query) => {
    setLocationQuery(query);
    const qLower = query.toLowerCase().trim();
    
    if (qLower === '') {
      setUseLocation(false);
      return;
    }

    // Check presets
    let matched = false;
    for (const key in CITY_COORDS) {
      if (qLower.includes(key) || key.includes(qLower)) {
        setCoords(CITY_COORDS[key]);
        setUseLocation(true);
        matched = true;
        break;
      }
    }

    if (!matched) {
      setUseLocation(false);
    }
  };
  
  // Dynamic Sports Scan
  const [sportsList, setSportsList] = useState(STATIC_SPORTS);

  // Geolocation discovery
  const [useLocation, setUseLocation] = useState(false);
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem('sportify_user_coords');
    return saved ? JSON.parse(saved) : null;
  });

  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync sport category URL parameters
  useEffect(() => {
    const sportParam = searchParams.get('sport');
    if (sportParam) {
      setSelectedSport(sportParam);
    }
  }, [searchParams]);

  // Load all available sports dynamically to scan for custom sports
  useEffect(() => {
    async function loadSports() {
      try {
        const { data } = await supabase.from('grounds').select('sport_type');
        if (data) {
          const list = ['All Sports', ...new Set(data.map(g => g.sport_type))];
          setSportsList(list);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSports();
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let resData = [];
        if (useLocation && coords) {
          // Geolocation discovery RPC call
          const { data, error } = await supabase.rpc('search_nearby_grounds', {
            user_lat: coords.lat,
            user_lng: coords.lng,
            radius_km: 50.0, // search up to 50km
            sport_filter: selectedSport === 'All Sports' ? null : selectedSport
          });
          if (!error) resData = data || [];
        } else {
          // Standard Select call
          const { data, error } = await supabase.from('grounds').select('*');
          if (!error) resData = data || [];
        }

        // Apply local filtering for client-side search query, pricing, and indoor/outdoor
        let filtered = resData;

        // Filter by sport type (if standard query did not filter it)
        if (!useLocation && selectedSport !== 'All Sports') {
          filtered = filtered.filter(g => g.sport_type.toLowerCase() === selectedSport.toLowerCase());
        }

        // Filter by text search query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            g => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
          );
        }

        // Filter by location query text address check
        if (!useLocation && locationQuery.trim() !== '') {
          const lq = locationQuery.toLowerCase();
          filtered = filtered.filter(
            g => g.description.toLowerCase().includes(lq) || g.title.toLowerCase().includes(lq)
          );
        }

        // Filter by pricing
        filtered = filtered.filter(g => g.hourly_price <= maxPrice);

        // Filter by classification
        if (indoorOutdoor !== 'all') {
          filtered = filtered.filter(g => g.indoor_outdoor === indoorOutdoor);
        }

        // Filter by selected facilities (matches all selected)
        if (selectedFacilities.length > 0) {
          filtered = filtered.filter(g => 
            selectedFacilities.every(fac => g.facilities?.includes(fac))
          );
        }

        setGrounds(filtered);
      } catch (err) {
        console.error('Error fetching grounds', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [searchQuery, locationQuery, selectedSport, maxPrice, indoorOutdoor, selectedFacilities, useLocation, coords]);

  const toggleFacility = (facility) => {
    setSelectedFacilities(prev => 
      prev.includes(facility) 
        ? prev.filter(f => f !== facility) 
        : [...prev, facility]
    );
  };

  const handleAcquireLocation = () => {
    if (coords) {
      setUseLocation(!useLocation);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(newCoords);
          localStorage.setItem('sportify_user_coords', JSON.stringify(newCoords));
          setUseLocation(true);
        },
        (err) => {
          // Fallback to default Mumbai
          const fallbackCoords = { lat: 19.0760, lng: 72.8777 };
          setCoords(fallbackCoords);
          localStorage.setItem('sportify_user_coords', JSON.stringify(fallbackCoords));
          setUseLocation(true);
        }
      );
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-slate-900 dark:text-white">
          Explore Sports Venues
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Discover and reserve courts, turfs, tables, and arenas in real-time
        </p>
      </div>

      {/* Main Grid: Filters + Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* AI recommendations widget */}
          <AiRecommender coords={coords} selectedSport={selectedSport} />

          <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-sport-green" />
                Filters
              </span>
              <button
                onClick={() => {
                  setSelectedSport('All Sports');
                  setSearchQuery('');
                  setMaxPrice(2000);
                  setIndoorOutdoor('all');
                  setSelectedFacilities([]);
                  setUseLocation(false);
                }}
                className="text-xs text-slate-405 hover:text-sport-green transition-colors font-semibold"
              >
                Clear All
              </button>
            </div>

            {/* Geolocation discovery toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Discovery Mode
              </label>
              <button
                onClick={handleAcquireLocation}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  useLocation && coords
                    ? 'bg-sport-green/10 border-sport-green text-sport-green glow-green'
                    : 'bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-700 dark:text-slate-300'
                }`}
              >
                <MapPin className="h-4 w-4" />
                {useLocation && coords ? 'GPS Proximity Active' : 'Sort by Distance (GPS)'}
              </button>
            </div>

            {/* Sports Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Sport Category
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green text-sm"
              >
                {sportsList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Indoor / Outdoor */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Venue Type
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-brand-dark p-1 rounded-xl">
                {['all', 'indoor', 'outdoor'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIndoorOutdoor(type)}
                    className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                      indoorOutdoor === type
                        ? 'bg-white dark:bg-brand-card-dark text-sport-green shadow-sm'
                        : 'text-slate-550'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Max Hourly Price
                </label>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                  ₹{maxPrice}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sport-green"
              />
              <div className="flex justify-between text-[10px] text-slate-405 font-bold mt-1">
                <span>₹100</span>
                <span>₹2,500</span>
              </div>
            </div>

            {/* Amenities / Facilities */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Facilities & Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {FACILITIES_LIST.map((fac) => {
                  const isChecked = selectedFacilities.includes(fac);
                  return (
                    <button
                      key={fac}
                      onClick={() => toggleFacility(fac)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-sport-green bg-sport-green/5 text-sport-green font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                      }`}
                    >
                      {fac}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Listings Display */}
        <div className="lg:col-span-3 space-y-6">
          {/* Dual Search Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Query Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4.5 flex items-center text-slate-400 pointer-events-none">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by venue name, sport or facility..."
                className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-805 rounded-2xl bg-white dark:bg-brand-card-dark text-slate-850 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-sport-green/10 focus:border-sport-green shadow-sm transition-all text-xs font-semibold"
              />
            </div>

            {/* Location Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4.5 flex items-center text-slate-400 pointer-events-none">
                <MapPin className="h-5 w-5 text-sport-green" />
              </span>
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Search by location (e.g. Bandra, Pune, Powai...)"
                className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-805 rounded-2xl bg-white dark:bg-brand-card-dark text-slate-850 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-sport-green/10 focus:border-sport-green shadow-sm transition-all text-xs font-semibold"
              />
            </div>
          </div>

          {/* Results grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Filtering arenas...</span>
            </div>
          ) : grounds.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-brand-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <HelpCircle className="h-12 w-12 text-slate-350 mx-auto mb-4" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">No Arenas Found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 text-sm">
                Try widening your price range, toggling off GPS proximity, or clearing active filters to search.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 mb-4 text-xs font-bold text-slate-455 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-sport-green" />
                Found {grounds.length} sports {grounds.length === 1 ? 'venue' : 'venues'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {grounds.map((ground) => (
                  <GroundCard key={ground.id} ground={ground} />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
