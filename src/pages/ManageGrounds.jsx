import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { Landmark, Trash2, Calendar, Settings, AlertTriangle, Plus, ChevronLeft } from 'lucide-react';

export default function ManageGrounds() {
  const { user } = useAuth();

  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyGrounds = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('grounds')
        .select('*')
        .eq('owner_id', user.id);

      if (!error && data) {
        setGrounds(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGrounds();
  }, [user]);

  const handleDelete = async (groundId, title) => {
    const check = window.confirm(`Are you sure you want to delete "${title}"? This will cancel all associated scheduled slots and bookings.`);
    if (!check) return;

    try {
      const { error } = await supabase
        .from('grounds')
        .delete()
        .eq('id', groundId);
      
      if (error) throw error;
      
      // Reload list
      fetchMyGrounds();
    } catch (err) {
      alert(`Error deleting listing: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500">
        Please log in to manage grounds.
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <Link to="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-slate-550 dark:text-slate-400 hover:text-sport-green mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Manage Arenas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update listing details or modify operating slot schedules
          </p>
        </div>
        <Link
          to="/admin/add-ground"
          className="flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-sport-green hover:bg-sport-green-dark transition-colors shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Ground
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Scanning arenas...</span>
        </div>
      ) : grounds.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-4">
          <Landmark className="h-12 w-12 text-slate-350 mx-auto mb-2 animate-pulse" />
          <h3 className="font-bold text-lg text-slate-850 dark:text-white">No Arenas Found</h3>
          <p className="text-sm text-slate-550 dark:text-slate-400 max-w-xs mx-auto">
            You haven't listed any sports venues yet. Head to listing creator to publish your first venue.
          </p>
          <Link
            to="/admin/add-ground"
            className="inline-flex px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-sport-green hover:bg-sport-green-dark transition-all"
          >
            Create Ground Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grounds.map((ground) => (
            <div
              key={ground.id}
              className="bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all gap-5"
            >
              {/* Info row */}
              <div className="flex gap-4">
                <div className="h-16 w-24 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={ground.images?.[0] || 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800'}
                    alt={ground.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sport-green/10 text-sport-green uppercase tracking-wide">
                    {ground.sport_type}
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-850 dark:text-white truncate mt-1">
                    {ground.title}
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                    Rate: ₹{ground.hourly_price} / hour
                  </p>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-850">
                <Link
                  to={`/admin/slots/${ground.id}`}
                  className="flex-1 flex justify-center items-center gap-1.5 py-2.5 px-3 bg-slate-900 dark:bg-sport-green hover:bg-slate-800 dark:hover:bg-sport-green-dark text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  Schedules & Slots
                </Link>
                <button
                  onClick={() => handleDelete(ground.id, ground.title)}
                  className="px-3.5 py-2.5 border border-red-200 dark:border-red-950 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Delete Ground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
