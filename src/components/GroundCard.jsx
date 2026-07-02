import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Sparkles, Navigation } from 'lucide-react';

export default function GroundCard({ ground }) {
  const {
    id,
    title,
    sport_type,
    indoor_outdoor,
    hourly_price,
    images,
    rating,
    distance_km,
  } = ground;

  const defaultImage = 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800';
  const coverImage = images && images.length > 0 ? images[0] : defaultImage;

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image Gallery Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <img
          src={coverImage}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-sm text-white uppercase tracking-wider">
            {sport_type}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white uppercase tracking-wider backdrop-blur-sm ${
            indoor_outdoor === 'indoor' ? 'bg-indigo-600/85' : 'bg-amber-600/85'
          }`}>
            {indoor_outdoor}
          </span>
          {rating >= 4.8 && (
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider shadow-md animate-pulse">
              🏆 Best Performer
            </span>
          )}
        </div>

        {/* Rating Overlay */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 dark:bg-brand-card-dark/95 backdrop-blur-sm text-slate-800 dark:text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-md">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{rating ? rating.toFixed(1) : '5.0'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-bold text-lg text-slate-850 dark:text-white group-hover:text-sport-green transition-colors leading-tight line-clamp-1">
            {title}
          </h3>
        </div>

        {/* Proximity / Distance */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4">
          <MapPin className="h-3.5 w-3.5 text-slate-450 dark:text-slate-500" />
          {distance_km !== undefined ? (
            <span className="font-medium text-sport-green flex items-center gap-1">
              <Navigation className="h-3 w-3 fill-sport-green text-sport-green" />
              {distance_km} km away
            </span>
          ) : (
            <span>Location coordinates registered</span>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Hourly Rate</span>
            <span className="font-display font-extrabold text-xl text-slate-850 dark:text-white">
              ₹{hourly_price}
            </span>
          </div>
          
          <Link
            to={`/ground/${id}`}
            className="inline-flex items-center gap-1 px-4.5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green transition-all shadow-md glow-green hover:-translate-y-0.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Book Ground
          </Link>
        </div>
      </div>
    </div>
  );
}
