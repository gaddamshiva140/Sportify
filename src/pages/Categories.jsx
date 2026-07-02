import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Compass, Landmark } from 'lucide-react';

const CATEGORIES_STATIC = [
  { name: 'Football', icon: '⚽', desc: 'FIFA-grade 5v5, 7v7, and 11v11 artificial turfs.', classification: 'outdoor' },
  { name: 'Box Cricket', icon: '🏏', desc: 'Net cricket cages with bats and bowling machines.', classification: 'outdoor' },
  { name: 'Basketball', icon: '🏀', desc: 'Indoor wooden and outdoor synthetic courts.', classification: 'indoor' },
  { name: 'Badminton', icon: '🏸', desc: 'A/C wooden and synthetic courts with rental gears.', classification: 'indoor' },
  { name: 'Volleyball', icon: '🏐', desc: 'Sand courts and rubber indoor courts.', classification: 'outdoor' },
  { name: 'Snooker/Billiards', icon: '🎱', desc: 'English snooker tables in luxury lounges.', classification: 'indoor' },
  { name: 'Chess Arenas', icon: '♟️', desc: 'Tournament chess boards and blitz clocks.', classification: 'indoor' },
  { name: 'Gaming Arenas', icon: '🎮', desc: 'High-end gaming rigs and console setups.', classification: 'indoor' },
  { name: 'Table Tennis', icon: '🏓', desc: 'Premium tables with rebound rackets.', classification: 'indoor' }
];

export default function Categories() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      try {
        const { data, error } = await supabase.from('grounds').select('sport_type');
        if (!error && data) {
          const map = {};
          data.forEach(item => {
            map[item.sport_type] = (map[item.sport_type] || 0) + 1;
          });
          setCounts(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCounts();
  }, []);

  const getIndoorCats = () => CATEGORIES_STATIC.filter(c => c.classification === 'indoor');
  const getOutdoorCats = () => CATEGORIES_STATIC.filter(c => c.classification === 'outdoor');

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-slate-900 dark:text-white">
          Sports Categories
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Discover a wide array of indoor court complexes, outdoor turfs, and gaming clubs
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Scanning arenas...</span>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Outdoor Venues */}
          <div>
            <h2 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Landmark className="h-5 w-5 text-sport-green animate-pulse" />
              Outdoor Sports Turfs & Fields
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getOutdoorCats().map((cat) => {
                const count = counts[cat.name] || 0;
                return (
                  <Link
                    key={cat.name}
                    to={`/explore?sport=${encodeURIComponent(cat.name)}`}
                    className="group relative overflow-hidden flex flex-col p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-brand-card-dark hover:border-sport-green dark:hover:border-sport-green hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-4xl shrink-0 transition-transform group-hover:rotate-6">{cat.icon}</span>
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white group-hover:text-sport-green transition-colors">
                          {cat.name}
                        </h3>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          {count} {count === 1 ? 'venue' : 'venues'} listed
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {cat.desc}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Indoor Arenas */}
          <div>
            <h2 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Compass className="h-5 w-5 text-sport-green animate-pulse" />
              Indoor Complexes & Lounges
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getIndoorCats().map((cat) => {
                const count = counts[cat.name] || 0;
                return (
                  <Link
                    key={cat.name}
                    to={`/explore?sport=${encodeURIComponent(cat.name)}`}
                    className="group relative overflow-hidden flex flex-col p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-brand-card-dark hover:border-sport-green dark:hover:border-sport-green hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-4xl shrink-0 transition-transform group-hover:rotate-6">{cat.icon}</span>
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white group-hover:text-sport-green transition-colors">
                          {cat.name}
                        </h3>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          {count} {count === 1 ? 'venue' : 'venues'} listed
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {cat.desc}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
