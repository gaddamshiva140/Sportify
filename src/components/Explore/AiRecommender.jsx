import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Sparkles, Trophy, MapPin, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AiRecommender({ coords, selectedSport }) {
  const [recommendation, setRecommendation] = useState(null);
  const [matchScore, setMatchScore] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coords) {
      setRecommendation(null);
      return;
    }

    async function generateRecommendation() {
      setLoading(true);
      try {
        // Query grounds near coordinate
        const { data, error } = await supabase.rpc('search_nearby_grounds', {
          user_lat: coords.lat,
          user_lng: coords.lng,
          radius_km: 50.0, // search wider area
          sport_filter: selectedSport === 'All Sports' ? null : selectedSport
        });

        if (!error && data && data.length > 0) {
          // Score formula: Proximity (40%), Rating (40%), Pricing (20%)
          // Higher rating = better score
          // Lower distance = better score
          // Lower price = slightly better score
          const scored = data.map(g => {
            const distanceScore = Math.max(0, 100 - (g.distance_km * 4)); // 0 distance = 100 score
            const ratingScore = (g.rating || 5.0) * 20; // 5.0 rating = 100 score
            const priceScore = Math.max(0, 100 - (g.hourly_price / 20)); // lower price = higher score
            
            const totalScore = Math.round((distanceScore * 0.4) + (ratingScore * 0.4) + (priceScore * 0.2));
            return {
              ground: g,
              score: Math.min(99, Math.max(70, totalScore))
            };
          });

          // Sort by score desc
          scored.sort((a, b) => b.score - a.score);
          const top = scored[0];

          setRecommendation(top.ground);
          setMatchScore(top.score);

          // Generate a smart rationale
          let rationale = `Highly rated ${top.ground.sport_type} arena `;
          if (top.ground.distance_km < 3) {
            rationale += `extremely close to you (${top.ground.distance_km} km away)`;
          } else {
            rationale += `offering premium facilities at ₹${top.ground.hourly_price}/hr`;
          }
          setReason(rationale);
        } else {
          setRecommendation(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    generateRecommendation();
  }, [coords, selectedSport]);

  if (!coords) {
    return (
      <div className="p-5 bg-gradient-to-r from-slate-905 to-slate-950 dark:from-brand-card-dark/60 dark:to-brand-card-dark/90 text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-805 text-center text-xs font-semibold">
        <Sparkles className="h-5 w-5 text-amber-400 mx-auto mb-2 animate-bounce" />
        Acquire location coordinates to enable AI Match Finder.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 text-center space-y-2.5 shadow-md">
        <div className="h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Recommender Calculating...</span>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  return (
    <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute right-0 bottom-0 opacity-10">
        <Trophy className="h-40 w-40" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header tag */}
        <div className="flex justify-between items-center">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
            <Sparkles className="h-3 w-3" />
            AI Match Recommend
          </span>
          <span className="text-xl font-extrabold text-amber-400">
            {matchScore}% Match
          </span>
        </div>

        {/* Content */}
        <div>
          <h4 className="font-display font-extrabold text-base text-white group-hover:text-sport-green transition-colors line-clamp-1">
            {recommendation.title}
          </h4>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mt-0.5">
            {recommendation.sport_type} • {recommendation.indoor_outdoor}
          </p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed italic font-light">
          "{reason}"
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            <span>{recommendation.distance_km} km away</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-405">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>{recommendation.rating?.toFixed(1) || '5.0'} Rating</span>
          </div>
        </div>

        {/* Link Button */}
        <Link
          to={`/ground/${recommendation.id}`}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 bg-gradient-to-r from-amber-400 to-amber-550 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all text-xs cursor-pointer"
        >
          Check out Arena
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
