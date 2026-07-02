import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { 
  User, Phone, Mail, Award, Loader2, ShieldCheck, Calendar, 
  Camera, Video, Trash2, CheckCircle, PlayCircle, RefreshCw, Clock, 
  Ticket, Sparkles, Upload
} from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'bookings'

  // --- Profile Edit States ---
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Camera & Upload States
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  // --- Bookings tab States ---
  const [bookings, setBookings] = useState([]);
  const [grounds, setGrounds] = useState({});
  const [slots, setSlots] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [playerScoreboard, setPlayerScoreboard] = useState(null);

  // --- Core Data Loaders ---
  const loadBookingsData = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id);

      if (bookingsData) {
        setBookings(bookingsData);

        const { data: slotsData } = await supabase.from('slots').select('*');
        const { data: groundsData } = await supabase.from('grounds').select('*');

        const slotsMap = {};
        if (slotsData) slotsData.forEach(s => { slotsMap[s.id] = s; });

        const groundsMap = {};
        if (groundsData) groundsData.forEach(g => { groundsMap[g.id] = g; });

        setSlots(slotsMap);
        setGrounds(groundsMap);

        // Find active match scoreboard
        const active = bookingsData.find(b => b.session_status === 'active_playing');
        if (active) {
          setPlayerScoreboard(active.scoreboard || {
            team_a_name: 'Team A',
            team_b_name: 'Team B',
            team_a_score: 0,
            team_b_score: 0,
            period: '1st Half',
            status: 'Warmup'
          });
        } else {
          setPlayerScoreboard(null);
        }
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBookingsData();
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhoneNumber(val);
    }
  };

  // --- Profile Actions ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email) {
      setMsg({ type: 'error', text: 'Full Name and Email are required.' });
      return;
    }

    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        email: email.trim(),
      });
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      showToast('Profile details updated!');
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error updating profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Camera Snap Actions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 300, height: 300, facingMode: 'user' } 
      });
      setStream(mediaStream);
      setCameraActive(true);
      setTimeout(() => {
        const videoEl = document.getElementById('webcam-preview');
        if (videoEl) videoEl.srcObject = mediaStream;
      }, 150);
    } catch (err) {
      showToast('Could not access device camera.', 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    const videoEl = document.getElementById('webcam-preview');
    if (!videoEl) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 300;
    canvas.height = videoEl.videoHeight || 300;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    stopCamera();
    
    try {
      await updateProfile({ avatar_url: dataUrl });
      showToast('Profile photo captured & updated successfully!');
    } catch (err) {
      showToast('Error saving profile photo.', 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      try {
        await updateProfile({ avatar_url: dataUrl });
        showToast('Profile image uploaded & updated successfully!');
      } catch (err) {
        showToast('Error saving photo.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async () => {
    try {
      await updateProfile({ avatar_url: null });
      showToast('Profile image removed.');
    } catch (err) {
      showToast('Error removing photo.', 'error');
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500 font-bold uppercase tracking-wider text-xs">
        Please log in to view your profile and bookings.
      </div>
    );
  }

  const formatJoinedDate = (isoString) => {
    if (!isoString) return 'Recent';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-brand-dark pb-20">
      
      {/* Title Header Banner */}
      <div className="bg-slate-900 text-white py-12 px-6 sm:px-12 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="font-display font-extrabold text-3xl">My Account</h1>
            <p className="text-slate-400 text-sm font-light">Manage your profile image and book arenas.</p>
          </div>
          
          {/* Tab switches */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-sport-green text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bookings' ? 'bg-sport-green text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Bookings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* ========================================================================= */}
        {/* PROFILE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left overview & Camera Panel */}
            <div className="md:col-span-1 space-y-6">
              <div className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm text-center space-y-4">
                
                {/* Avatar container (Image or Initial letter) */}
                <div className="relative mx-auto h-24 w-24 rounded-full overflow-hidden border-2 border-sport-green bg-slate-100 dark:bg-brand-dark flex items-center justify-center text-3xl font-black text-slate-700 dark:text-white shadow-md glow-green">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>

                <div>
                  <h2 className="font-display font-black text-lg text-slate-850 dark:text-white truncate">
                    {user.full_name}
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 truncate font-semibold">{user.email}</p>
                </div>

                {/* Photo upload options */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={cameraActive ? stopCamera : startCamera}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-105 hover:bg-slate-200 dark:bg-brand-dark dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-extrabold cursor-pointer"
                    >
                      <Video className="h-3.5 w-3.5" />
                      {cameraActive ? 'Close Cam' : 'Use Camera'}
                    </button>
                    
                    <label className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-105 hover:bg-slate-200 dark:bg-brand-dark dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-extrabold cursor-pointer text-center">
                      <Upload className="h-3.5 w-3.5" />
                      Upload File
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  
                  {user.avatar_url && (
                    <button
                      onClick={removePhoto}
                      className="flex items-center justify-center gap-1.5 py-1.5 text-red-500 hover:underline text-[9px] font-black uppercase cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Remove Photo
                    </button>
                  )}
                </div>

                {/* Webcam capture feed rendering */}
                {cameraActive && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Webcam Active</span>
                    <video id="webcam-preview" autoPlay playsInline className="w-full rounded-2xl bg-slate-950 border border-slate-800 aspect-square object-cover" />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full py-2 bg-sport-green text-white text-xs font-bold rounded-xl shadow-md glow-green cursor-pointer"
                    >
                      Capture Photo
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5 text-left text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2 font-semibold">
                    <Calendar className="h-4 w-4 text-sport-green" />
                    <span>Joined {formatJoinedDate(user.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-sport-green" />
                    <span>Verified Resident User</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right side form */}
            <div className="md:col-span-2">
              <div className="p-6 sm:p-8 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-6">
                <h2 className="font-display font-black text-xl text-slate-850 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                  Edit Details
                </h2>

                {msg.text && (
                  <div className={`p-3.5 rounded-xl text-sm font-semibold border flex items-center gap-2 ${
                    msg.type === 'success'
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200/50 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200/50 text-red-700 dark:text-red-400'
                  }`}>
                    {msg.type === 'success' && <ShieldCheck className="h-4 w-4" />}
                    <span>{msg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-455">
                        <Mail className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white focus:outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    .                  <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-455">
                        <User className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Vikram Singh"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white focus:outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-455">
                        <Phone className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="tel"
                        maxLength="10"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="8555057959"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white focus:outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green shadow-md glow-green transition-all disabled:bg-slate-450 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          Updating Profile...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* BOOKINGS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-8">
            {playerScoreboard && (
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1">
                    <PlayCircle className="h-4 w-4 text-indigo-400 animate-pulse" /> Live Scoreboard Tracker
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{playerScoreboard.period}</span>
                </div>
                <div className="flex justify-between items-center text-center max-w-md mx-auto">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">{playerScoreboard.team_a_name}</span>
                    <span className="text-3xl font-black text-white">{playerScoreboard.team_a_score}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 px-4">VS</div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">{playerScoreboard.team_b_name}</span>
                    <span className="text-3xl font-black text-white">{playerScoreboard.team_b_score}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Active Reservations</h2>
              <button 
                onClick={loadBookingsData}
                className="p-2 text-slate-455 hover:text-sport-green transition-colors cursor-pointer"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {loadingBookings ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-brand-card-dark border border-slate-200 dark:border-slate-800 rounded-3xl">
                <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-slate-400">You haven't booked any arenas yet.</p>
                <Link to="/explore" className="text-sport-green hover:underline mt-2 inline-block font-semibold">Explore nearby turfs</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.map((booking) => {
                  const slot = slots[booking.slot_id] || {};
                  const ground = grounds[slot.ground_id] || {};
                  
                  return (
                    <div 
                      key={booking.id}
                      className="p-6 bg-white dark:bg-brand-card-dark border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            ID: {booking.id.substring(0, 8)}
                          </span>
                          <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                            booking.session_status === 'pending_checkin' ? 'bg-amber-100 text-amber-600' :
                            booking.session_status === 'active_playing' ? 'bg-indigo-100 text-indigo-600 animate-pulse' :
                            'bg-slate-100 text-slate-505'
                          }`}>
                            {booking.session_status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <h3 className="font-display font-extrabold text-lg text-slate-850 dark:text-white mt-1">
                          {ground.title || 'Loading Venue...'}
                        </h3>
                        
                        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-sport-green" />
                            <span>Date: {new Date(slot.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-sport-green" />
                            <span>Time: {slot.start_time} - {slot.end_time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-brand-dark/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Check-In OTP</p>
                          <span className="text-xl font-black text-sport-green tracking-widest">{booking.checkin_otp}</span>
                        </div>
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 text-right max-w-[120px] leading-relaxed">
                          Provide this code to ground host on arrival
                        </span>
                      </div>

                      {booking.session_status === 'completed' && (
                        <div className="pt-2">
                          <Link
                            to={`/ground/${ground.id}`}
                            className="w-full text-center block py-2.5 border border-sport-green text-sport-green hover:bg-sport-green/10 text-xs font-bold rounded-xl transition-all"
                          >
                            Submit Feedback & Rating
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
