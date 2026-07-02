import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Landmark, Compass, Sparkles, Navigation, Plus, Loader2, Camera, RefreshCw } from 'lucide-react';

const STATIC_SPORTS = [
  'Football',
  'Box Cricket',
  'Basketball',
  'Volleyball',
  'Badminton',
  'Snooker/Billiards',
  'Chess Arenas',
  'Gaming Arenas',
  'Table Tennis',
  'Other (Specify)'
];

const AMENITIES = ['Parking', 'Water', 'Floodlights', 'Changing Room', 'Locker', 'AC', 'WiFi', 'Scoreboard'];

const DUMMY_SPORT_IMAGES = {
  Football: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
  'Box Cricket': 'https://images.unsplash.com/photo-1531415080290-bc98545ab3ef?auto=format&fit=crop&q=80&w=800',
  Basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
  Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800',
  Volleyball: 'https://images.unsplash.com/photo-1592656094267-764a4502075d?auto=format&fit=crop&q=80&w=800',
  'Snooker/Billiards': 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=800',
  'Chess Arenas': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800',
  'Gaming Arenas': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800',
  'Table Tennis': 'https://images.unsplash.com/photo-1576082531653-a3962b88aaee?auto=format&fit=crop&q=80&w=800'
};

export default function AddGround() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sportType, setSportType] = useState('Football');
  const [customSport, setCustomSport] = useState('');
  const [indoorOutdoor, setIndoorOutdoor] = useState('outdoor');
  const [hourlyPrice, setHourlyPrice] = useState('');
  
  // Coordinates (default to Mumbai)
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);

  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  
  // Verification Document
  const [deedFileName, setDeedFileName] = useState('');

  // Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleFacility = (facility) => {
    setSelectedFacilities(prev => 
      prev.includes(facility) 
        ? prev.filter(f => f !== facility) 
        : [...prev, facility]
    );
  };

  const autofillCoordinates = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
      });
    }
  };

  const handlePresetCoords = (city) => {
    if (city === 'mumbai') {
      setLatitude(19.0760);
      setLongitude(72.8777);
    } else if (city === 'bangalore') {
      setLatitude(12.9716);
      setLongitude(77.5946);
    }
  };

  // Webcam access
  const startCamera = async () => {
    setCameraError('');
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraActive(true);
      
      // Delay slightly to let ref bind
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.warn(err);
      setCameraError('Webcam access blocked or unavailable. Upload photo below.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Match dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedPhoto(dataUrl);
    
    // Stop streams
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const handleDeedUploadSim = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDeedFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !hourlyPrice || !latitude || !longitude) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    // Custom sport resolving
    const resolvedSport = sportType === 'Other (Specify)' ? customSport.trim() : sportType;
    if (!resolvedSport) {
      setError('Please enter your custom sport name.');
      setLoading(false);
      return;
    }

    // Photo resolving: Camera snaps are prioritised, then custom URLs, then stock categories
    let primaryImg = '';
    if (capturedPhoto) {
      primaryImg = capturedPhoto;
    } else if (customImageUrl.trim() !== '') {
      primaryImg = customImageUrl;
    } else {
      primaryImg = DUMMY_SPORT_IMAGES[resolvedSport] || 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800';
    }

    const groundData = {
      owner_id: user.id,
      title,
      description,
      sport_type: resolvedSport,
      indoor_outdoor: indoorOutdoor,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      hourly_price: parseFloat(hourlyPrice),
      images: [primaryImg],
      facilities: selectedFacilities,
      license_doc: deedFileName || null
    };

    try {
      const { data, error: insertErr } = await supabase
        .from('grounds')
        .insert(groundData);

      if (insertErr) throw insertErr;
      
      // Stop camera if still running
      stopCamera();
      
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Error creating arena listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          List Sports Ground
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register a new venue, upload deeds verification files, and snap photos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side Info Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Landmark className="h-[200px] w-[200px]" />
            </div>
            <span className="text-[10px] font-bold uppercase bg-sport-green/20 text-sport-green px-2.5 py-1 rounded-full border border-sport-green/30">
              Verification Engine
            </span>
            <h3 className="font-display font-bold text-lg">Trust & Safety Badges</h3>
            <p className="text-xs text-slate-350 leading-relaxed font-light">
              Uploading a valid business deed or sports registration license proof triggers our verification checks. Verified venues receive a green checkmark badge, boosting search ranking by 30%.
            </p>
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="md:col-span-2">
          <div className="p-6 sm:p-8 bg-white dark:bg-brand-card-dark border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-6">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-sm font-semibold text-red-650 dark:text-red-400 border border-red-200/40">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Ground Name *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Camp Nou Turf Mumbai"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide turf sizes, grass classifications, floodlight levels or seating arrangements..."
                  rows="3"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-855 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green transition-all"
                />
              </div>

              {/* Sport Type & Classification */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Sport Category
                  </label>
                  <select
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green"
                  >
                    {STATIC_SPORTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Venue Classification
                  </label>
                  <select
                    value={indoorOutdoor}
                    onChange={(e) => setIndoorOutdoor(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-805 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green"
                  >
                    <option value="outdoor">Outdoor Turf/Field</option>
                    <option value="indoor">Indoor Court/Arena</option>
                  </select>
                </div>
              </div>

              {/* Custom Sport Input (Conditioned on Other selection) */}
              {sportType === 'Other (Specify)' && (
                <div className="p-4 bg-slate-50 dark:bg-brand-dark/40 rounded-2xl border border-slate-150 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Enter Custom Sport Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customSport}
                    onChange={(e) => setCustomSport(e.target.value)}
                    placeholder="e.g. Footgolf, Padel, Pickleball"
                    className="block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-brand-card-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green transition-all"
                  />
                </div>
              )}

              {/* Price & Geolocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Hourly Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={hourlyPrice}
                    onChange={(e) => setHourlyPrice(e.target.value)}
                    placeholder="e.g. 1200"
                    className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sport-green/20 focus:border-sport-green transition-all"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Coordinates (Lat, Lng) *
                    </label>
                    <button
                      type="button"
                      onClick={autofillCoordinates}
                      className="text-[10px] text-sport-green font-bold hover:underline"
                    >
                      Autodetect GPS
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      placeholder="Latitude"
                      className="block w-full px-2 py-3 border border-slate-200 dark:border-slate-855 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white text-xs focus:outline-none text-center"
                    />
                    <input
                      type="number"
                      required
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      placeholder="Longitude"
                      className="block w-full px-2 py-3 border border-slate-200 dark:border-slate-855 rounded-xl bg-slate-50 dark:bg-brand-dark/50 text-slate-800 dark:text-white text-xs focus:outline-none text-center"
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handlePresetCoords('mumbai')}
                      className="text-[9px] text-slate-400 hover:text-sport-green font-bold"
                    >
                      Pin Mumbai
                    </button>
                    <span className="text-[9px] text-slate-400">|</span>
                    <button
                      type="button"
                      onClick={() => handlePresetCoords('bangalore')}
                      className="text-[9px] text-slate-400 hover:text-sport-green font-bold"
                    >
                      Pin Bangalore
                    </button>
                  </div>
                </div>
              </div>

              {/* Ownership Deed File Selector */}
              <div className="p-4 bg-slate-50/50 dark:bg-brand-dark/25 border border-slate-200 dark:border-slate-850 rounded-2xl">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Ground Ownership Document Verification
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="deed-upload"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleDeedUploadSim}
                    className="hidden"
                  />
                  <label
                    htmlFor="deed-upload"
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 rounded-lg hover:border-sport-green hover:text-sport-green transition-all cursor-pointer bg-white dark:bg-brand-card-dark"
                  >
                    Select Proof Document (PDF/Deed)
                  </label>
                  <span className="text-xs text-slate-500 truncate">
                    {deedFileName || 'No document uploaded (Verification Pending)'}
                  </span>
                </div>
              </div>

              {/* Image Snap / Upload Section */}
              <div className="p-4 bg-slate-50/50 dark:bg-brand-dark/25 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Venue Listing Image
                </label>

                {cameraError && (
                  <p className="text-xs text-amber-500 font-bold">{cameraError}</p>
                )}

                {/* Camera Viewport */}
                {cameraActive && (
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black max-w-sm mx-auto shadow-md">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-sport-green text-white text-xs font-bold rounded-lg hover:bg-sport-green-dark shadow-lg"
                    >
                      Snap Photo
                    </button>
                  </div>
                )}

                {/* Captured preview */}
                {capturedPhoto && (
                  <div className="relative max-w-xs mx-auto rounded-xl overflow-hidden aspect-video shadow-md border border-slate-100 dark:border-slate-800">
                    <img src={capturedPhoto} alt="Snapshot Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white text-xs font-bold hover:bg-black/80"
                    >
                      Reset
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 bg-white dark:bg-brand-card-dark rounded-lg hover:border-sport-green hover:text-sport-green cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo with Camera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-805 text-xs font-bold text-red-500 rounded-lg hover:bg-red-50"
                    >
                      Cancel Camera
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-850 pt-3">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Or Enter Image URL
                  </label>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-brand-card-dark text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Hidden canvas for snapshot captures */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Submit buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sport-green to-sport-green-dark hover:from-sport-green-dark hover:to-sport-green shadow-md glow-green transition-all focus:outline-none disabled:bg-slate-400 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Saving Listing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5" />
                      List Ground & Schedule Slots
                    </>
                  )}
                </button>
                <Link
                  to="/admin"
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </Link>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
