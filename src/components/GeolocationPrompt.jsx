import React, { useState } from 'react';
import { MapPin, Navigation, HelpCircle, Loader2 } from 'lucide-react';

const PRESET_LOCATIONS = [
  { name: 'Mumbai (Default)', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Delhi NCR', lat: 28.7041, lng: 77.1025 },
];

export default function GeolocationPrompt({ onLocationAcquired }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationAcquired(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation error code:', err.code);
        setError('Location access denied. Please select a city fallback below.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handlePresetSelect = (lat, lng) => {
    onLocationAcquired(lat, lng);
  };

  return (
    <div className="rounded-2xl p-6 glass dark:glass-dark border border-slate-200/50 dark:border-slate-850/80 shadow-md">
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="p-3 bg-gradient-to-tr from-sport-green to-sport-green-light rounded-2xl text-white mb-4 shadow-lg glow-green animate-pulse">
          <Navigation className="h-6 w-6" />
        </div>
        <h2 className="font-display font-extrabold text-xl text-slate-800 dark:text-white mb-2">
          Discover Nearby Sports Arenas
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Allow location access to instantly find and sort turf, courts, and fields nearest to you.
        </p>

        {error && (
          <div className="mb-4 text-xs font-semibold px-3 py-2 rounded-lg bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            onClick={requestLocation}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl text-white bg-slate-900 dark:bg-sport-green hover:bg-slate-800 dark:hover:bg-sport-green-dark disabled:bg-slate-400 dark:disabled:bg-slate-700 transition-colors shadow-md cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Acquiring Location...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Use My Location
              </>
            )}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 w-full">
          <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mb-3 flex items-center justify-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            Or select a city to search grounds
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESET_LOCATIONS.map((city) => (
              <button
                key={city.name}
                onClick={() => handlePresetSelect(city.lat, city.lng)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-sport-green dark:hover:border-sport-green hover:text-sport-green text-slate-650 dark:text-slate-350 transition-colors cursor-pointer"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
