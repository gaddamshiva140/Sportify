// Mock Database Service for Sportify
// Stores data in localStorage to persist across page reloads.

if (typeof localStorage === 'undefined') {
  const storage = {};
  global.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = String(value); },
    removeItem: (key) => { delete storage[key]; },
    clear: () => { for (let k in storage) delete storage[k]; }
  };
}

const STORAGE_KEYS = {
  PROFILES: 'sportify_profiles',
  GROUNDS: 'sportify_grounds',
  SLOTS: 'sportify_slots',
  BOOKINGS: 'sportify_bookings',
  CURRENT_USER: 'sportify_current_user',
  REVIEWS: 'sportify_reviews',
};

// Helper for Haversine Distance
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Generate realistic slots for a ground (6:00 AM to 10:00 PM for today and tomorrow)
export function generateSlotsForGround(groundId) {
  const slots = [];
  const startHour = 6;
  const endHour = 22;
  const days = [0, 1]; // 0 = Today, 1 = Tomorrow

  days.forEach((dayOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(hour + 1, 0, 0, 0);

      // Randomize initial status to make the interface look alive
      let status = 'available';
      const rand = Math.random();
      if (rand < 0.15) {
        status = 'booked';
      } else if (rand < 0.2) {
        status = 'blocked';
      }

      slots.push({
        id: `${groundId}-slot-${dayOffset}-${hour}`,
        ground_id: groundId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: status,
      });
    }
  });

  return slots;
}

// Default Seed Data
const defaultProfiles = [
  {
    id: 'owner-user-id',
    email: 'owner@sportify.com',
    full_name: 'Vikram Singh',
    phone_number: '+91 98765 43210',
    role: 'owner',
    email_verified: true,  // Demo accounts are pre-verified for easy review
    mobile_verified: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'player-user-id',
    email: 'player@sportify.com',
    full_name: 'Rohit Sharma',
    phone_number: '+91 99999 88888',
    role: 'player',
    email_verified: true,
    mobile_verified: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const defaultGrounds = [
  {
    id: 'ground-1',
    owner_id: 'owner-user-id',
    title: 'Camp Nou Turf',
    description: 'Premium FIFA-standard 7v7 turf with high-quality artificial grass, LED floodlights, changing rooms, and spectator seating.',
    sport_type: 'Football',
    indoor_outdoor: 'outdoor',
    latitude: 19.0760,
    longitude: 72.8777,
    hourly_price: 1200,
    images: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=800'
    ],
    facilities: ['Parking', 'Water', 'Floodlights', 'Changing Room', 'Locker'],
    rating: 4.8,
    is_verified: true,
    license_doc: 'mumbai_deed_112.pdf',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ground-2',
    owner_id: 'owner-user-id',
    title: 'The Smash Club',
    description: 'Professional indoor badminton arena featuring 4 synthetic courts, excellent lighting, and expert coaching equipment.',
    sport_type: 'Badminton',
    indoor_outdoor: 'indoor',
    latitude: 19.0880,
    longitude: 72.8900,
    hourly_price: 400,
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1613918431208-67520e555c6c?auto=format&fit=crop&q=80&w=800'
    ],
    facilities: ['Water', 'Rackets on Rent', 'Locker Room', 'Restrooms'],
    rating: 4.6,
    is_verified: true,
    license_doc: 'smash_club_license.pdf',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ground-3',
    owner_id: 'owner-user-id',
    title: "Lord's Box Cricket Arena",
    description: 'Perfect outdoor box cricket facility with high-tension safety nets, professional pitch mats, and match-grade tennis balls.',
    sport_type: 'Box Cricket',
    indoor_outdoor: 'outdoor',
    latitude: 19.0620,
    longitude: 72.8600,
    hourly_price: 1500,
    images: [
      'https://images.unsplash.com/photo-1531415080290-bc98545ab3ef?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1608962714022-2615c4d53086?auto=format&fit=crop&q=80&w=800'
    ],
    facilities: ['Parking', 'Floodlights', 'Water', 'Bats/Balls Provided'],
    rating: 4.9,
    is_verified: false,
    license_doc: 'lords_deed.pdf',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ground-4',
    owner_id: 'owner-user-id',
    title: 'Dribble Basketball Arena',
    description: 'Top-tier indoor wooden court equipped with professional hoops, height adjustment, and electronic scoreboard.',
    sport_type: 'Basketball',
    indoor_outdoor: 'indoor',
    latitude: 19.0500,
    longitude: 72.8400,
    hourly_price: 800,
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=800'
    ],
    facilities: ['Parking', 'Scoreboard', 'Water', 'Locker Room', 'Restrooms'],
    rating: 4.7,
    is_verified: true,
    license_doc: 'dribble_license_v2.pdf',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ground-5',
    owner_id: 'owner-user-id',
    title: 'Cue & Canvas Billiards Lounge',
    description: 'Premium air-conditioned snooker and pool lounge featuring professional English tables, high-quality cues, and mocktails.',
    sport_type: 'Snooker/Billiards',
    indoor_outdoor: 'indoor',
    latitude: 19.0700,
    longitude: 72.8700,
    hourly_price: 300,
    images: [
      'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1577741314755-048d8525d31e?auto=format&fit=crop&q=80&w=800'
    ],
    facilities: ['AC', 'WiFi', 'Snacks Counter', 'Restrooms'],
    rating: 4.5,
    is_verified: true,
    license_doc: 'cue_canvas_license.pdf',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ground-6',
    owner_id: 'owner-user-id',
    title: 'Spike Town Volleyball Turf',
    description: 'Sand court for beach volleyball and soft-turf indoor court. Perfect for family matches and corporate events.',
    sport_type: 'Volleyball',
    indoor_outdoor: 'outdoor',
    latitude: 19.1000,
    longitude: 72.8800,
    hourly_price: 600,
    images: [
      'https://images.unsplash.com/photo-1592656094267-764a4502075d?auto=format&fit=crop&q=80&w=800'
    ],
    facilities: ['Parking', 'Floodlights', 'Water', 'Restrooms'],
    rating: 4.3,
    is_verified: false,
    license_doc: null,
    created_at: new Date().toISOString(),
  }
];

// Initialize Mock Storage if empty
export function initMockDb() {
  // Automatically clear old local storage databases that don't match the new schema structure
  const currentGrounds = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUNDS) || '[]');
  if (currentGrounds.length > 0 && !currentGrounds[0].hasOwnProperty('is_verified')) {
    localStorage.removeItem(STORAGE_KEYS.GROUNDS);
    localStorage.removeItem(STORAGE_KEYS.SLOTS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
  }

  // Force reseed of default profiles to add verification columns if missing
  const currentProfiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
  if (currentProfiles.length > 0 && !currentProfiles[0].hasOwnProperty('email_verified')) {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
  }

  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(defaultProfiles));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUNDS)) {
    localStorage.setItem(STORAGE_KEYS.GROUNDS, JSON.stringify(defaultGrounds));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SLOTS)) {
    const slots = [];
    defaultGrounds.forEach((ground) => {
      slots.push(...generateSlotsForGround(ground.id));
    });
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    // Generate a few default bookings
    const slots = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLOTS) || '[]');
    const bookedSlots = slots.filter((s) => s.status === 'booked');
    const bookings = [];

    bookedSlots.slice(0, 3).forEach((slot, idx) => {
      const grounds = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUNDS) || '[]');
      const ground = grounds.find((g) => g.id === slot.ground_id) || {};
      bookings.push({
        id: `booking-${idx}`,
        user_id: 'player-user-id',
        slot_id: slot.id,
        total_price: ground.hourly_price || 500,
        payment_status: 'paid',
        created_at: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000).toISOString(),
        otp_code: Math.floor(100000 + Math.random() * 900000).toString(),
        session_status: idx === 0 ? 'active_playing' : 'pending_checkin',
        checkin_time: idx === 0 ? new Date(Date.now() - 30 * 60 * 1000).toISOString() : null,
        scoreboard: {
          team_a_name: 'Team A',
          team_b_name: 'Team B',
          team_a_score: 0,
          team_b_score: 0,
          period: '1st Half',
          status: 'Warmup'
        },
      });
    });
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    const defaultReviews = [
      {
        id: 'review-1',
        ground_id: 'ground-1',
        user_id: 'player-user-id',
        rating: 5,
        feedback_text: 'Excellent turf! Floodlights are bright and the artificial grass is premium quality.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'review-2',
        ground_id: 'ground-2',
        user_id: 'player-user-id',
        rating: 4,
        feedback_text: 'Professional court. Very clean changing rooms and well-maintained synthetic floor.',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(defaultReviews));
  }
}

// Data fetching helper operations (mirroring PostgreSQL queries)
export const mockDb = {
  getProfiles: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]'),
  getGrounds: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUNDS) || '[]'),
  getSlots: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.SLOTS) || '[]'),
  getBookings: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]'),
  
  saveProfiles: (data) => localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(data)),
  saveGrounds: (data) => localStorage.setItem(STORAGE_KEYS.GROUNDS, JSON.stringify(data)),
  saveSlots: (data) => localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(data)),
  saveBookings: (data) => localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data)),

  // Auth Operations
  signUp: (email, password, fullName, role, phoneNumber = '') => {
    const profiles = mockDb.getProfiles();
    if (profiles.find((p) => p.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('User already exists');
    }
    const newId = `user-${Math.random().toString(36).substring(2, 9)}`;
    const newProfile = {
      id: newId,
      email: email,
      full_name: fullName,
      phone_number: phoneNumber,
      role: role,
      email_verified: false, // New emails start unverified (requires link verification)
      mobile_verified: phoneNumber ? false : true,
      created_at: new Date().toISOString(),
    };
    profiles.push(newProfile);
    mockDb.saveProfiles(profiles);
    return newProfile;
  },

  signIn: (email, password) => {
    const profiles = mockDb.getProfiles();
    const user = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    // In a mock, we accept any password for convenience
    if (!user) {
      throw new Error('Invalid email or password');
    }
    return user;
  },

  // Mock Google Authentication
  signInWithGoogle: (role = 'player') => {
    const email = role === 'owner' ? 'google_owner@sportify.com' : 'google_player@sportify.com';
    const name = role === 'owner' ? 'Google Owner' : 'Google Player';
    const profiles = mockDb.getProfiles();
    let user = profiles.find((p) => p.email.toLowerCase() === email);
    if (!user) {
      // New Google SSO logins start with email_verified: false as requested
      user = mockDb.signUp(email, 'google_oauth_bypass', name, role, '+91 90000 80000');
      user.email_verified = false;
      
      const idx = profiles.findIndex(p => p.email.toLowerCase() === email);
      if (idx !== -1) {
        profiles[idx].email_verified = false;
        mockDb.saveProfiles(profiles);
      }
    }
    return user;
  },

  // Mock SMS OTP Authenticators
  sendMobileOtp: (phone) => {
    const code = '583920'; // Static mock verification code
    return { success: true, phone, code };
  },

  signInWithMobileOtp: (phone, code) => {
    if (code !== '583920') {
      throw new Error('Incorrect SMS OTP verification code.');
    }
    const email = `${phone.replace(/[^0-9]/g, '')}@mobile-sportify.com`;
    const profiles = mockDb.getProfiles();
    let user = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = mockDb.signUp(email, 'mobile_otp_bypass', `User ${phone}`, 'player', phone);
    }
    
    // Fetch latest profiles list to find the newly registered user index
    const latestProfiles = mockDb.getProfiles();
    const index = latestProfiles.findIndex((p) => p.id === user.id);
    if (index !== -1) {
      latestProfiles[index].mobile_verified = true;
      latestProfiles[index].email_verified = true; // Auto verify associated email for simplicity
      mockDb.saveProfiles(latestProfiles);
      user = latestProfiles[index];
    }
    return user;
  },

  verifyEmail: (userId) => {
    const profiles = mockDb.getProfiles();
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx === -1) throw new Error('User not found.');
    
    profiles[idx].email_verified = true;
    mockDb.saveProfiles(profiles);
    
    // Sync current session state and log them in immediately
    localStorage.setItem('sportify_session_user', JSON.stringify(profiles[idx]));
    return profiles[idx];
  },

  // Geolocation Discovery using Haversine Formula
  searchNearbyGrounds: (lat, lng, radiusKm, sportFilter = null) => {
    const grounds = mockDb.getGrounds();
    const results = grounds
      .map((g) => {
        const distance = calculateHaversineDistance(lat, lng, g.latitude, g.longitude);
        return { ...g, distance_km: parseFloat(distance.toFixed(2)) };
      })
      .filter((g) => {
        const matchRadius = g.distance_km <= radiusKm;
        const matchSport = !sportFilter || g.sport_type.toLowerCase() === sportFilter.toLowerCase();
        return matchRadius && matchSport;
      });
    
    return results.sort((a, b) => a.distance_km - b.distance_km);
  },

  // Booking Engine transaction simulation
  bookSlot: (userId, slotId, totalPrice) => {
    // Acquire a "lock" by reading the latest state
    const slots = mockDb.getSlots();
    const slotIndex = slots.findIndex((s) => s.id === slotId);

    if (slotIndex === -1) {
      return { success: false, message: 'Slot not found' };
    }

    const slot = slots[slotIndex];

    if (slot.status !== 'available') {
      return { success: false, message: 'Slot no longer available' };
    }

    // Update slot status
    slots[slotIndex].status = 'booked';
    mockDb.saveSlots(slots);

    // Save the Booking
    const bookings = mockDb.getBookings();
    // Unique check (double safety)
    if (bookings.find((b) => b.slot_id === slotId)) {
      // Revert slot status if somehow another check bypassed
      slots[slotIndex].status = 'booked';
      mockDb.saveSlots(slots);
      return { success: false, message: 'Slot no longer available' };
    }

    const newBooking = {
      id: `booking-${Math.random().toString(36).substring(2, 9)}`,
      user_id: userId,
      slot_id: slotId,
      total_price: parseFloat(totalPrice),
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      otp_code: Math.floor(100000 + Math.random() * 900000).toString(),
      session_status: 'pending_checkin',
      checkin_time: null,
      scoreboard: {
        team_a_name: 'Team A',
        team_b_name: 'Team B',
        team_a_score: 0,
        team_b_score: 0,
        period: '1st Half',
        status: 'Warmup'
      },
    };

    bookings.push(newBooking);
    mockDb.saveBookings(bookings);

    return { success: true, booking: newBooking };
  },

  // OTP Attendance verify
  verifyBookingOtp: (bookingId, enteredCode) => {
    const bookings = mockDb.getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    
    if (idx === -1) return { success: false, message: 'Booking not found.' };
    const b = bookings[idx];
    
    if (b.session_status === 'active_playing' || b.session_status === 'completed') {
      return { success: false, message: 'This OTP has already been verified and has expired.' };
    }
    
    if (b.otp_code !== enteredCode) {
      return { success: false, message: 'Incorrect OTP. Verification failed.' };
    }
    
    bookings[idx].session_status = 'active_playing';
    bookings[idx].checkin_time = new Date().toISOString();
    mockDb.saveBookings(bookings);
    
    return { success: true, booking: bookings[idx] };
  },

  // Owner listing verification check DDL
  verifyGround: (groundId) => {
    const grounds = mockDb.getGrounds();
    const idx = grounds.findIndex(g => g.id === groundId);
    if (idx === -1) throw new Error('Venue not found.');
    
    grounds[idx].is_verified = true;
    mockDb.saveGrounds(grounds);
    return grounds[idx];
  },

  // Ground CRUD
  addGround: (ownerId, groundData) => {
    const grounds = mockDb.getGrounds();
    const newId = `ground-${Math.random().toString(36).substring(2, 9)}`;
    const newGround = {
      id: newId,
      owner_id: ownerId,
      rating: 5.0,
      is_verified: false, // Listings start unverified
      license_doc: groundData.license_doc || null,
      created_at: new Date().toISOString(),
      ...groundData,
    };
    grounds.push(newGround);
    mockDb.saveGrounds(grounds);

    // Dynamic slot generation for new grounds immediately
    const slots = mockDb.getSlots();
    const newSlots = generateSlotsForGround(newId);
    slots.push(...newSlots);
    mockDb.saveSlots(slots);

    return newGround;
  },

  updateGround: (groundId, groundData) => {
    const grounds = mockDb.getGrounds();
    const idx = grounds.findIndex((g) => g.id === groundId);
    if (idx === -1) throw new Error('Ground not found');
    
    grounds[idx] = { ...grounds[idx], ...groundData };
    mockDb.saveGrounds(grounds);
    return grounds[idx];
  },

  deleteGround: (groundId) => {
    // Delete ground
    let grounds = mockDb.getGrounds();
    grounds = grounds.filter((g) => g.id !== groundId);
    mockDb.saveGrounds(grounds);

    // Delete associated slots
    let slots = mockDb.getSlots();
    slots = slots.filter((s) => s.ground_id !== groundId);
    mockDb.saveSlots(slots);

    // Cancel bookings for deleted slots
    let bookings = mockDb.getBookings();
    bookings = bookings.filter((b) => {
      const belongsToDeletedGround = !slots.find((s) => s.id === b.slot_id);
      return !belongsToDeletedGround;
    });
    mockDb.saveBookings(bookings);
  },

  // Owner Schedule operations
  addSlotsForGround: (groundId, slotsArray) => {
    const slots = mockDb.getSlots();
    slots.push(...slotsArray);
    mockDb.saveSlots(slots);
  },

  updateSlotStatus: (slotId, status) => {
    const slots = mockDb.getSlots();
    const idx = slots.findIndex((s) => s.id === slotId);
    if (idx === -1) throw new Error('Slot not found');
    slots[idx].status = status;
    mockDb.saveSlots(slots);
    return slots[idx];
  },

  getReviews: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '[]'),
  saveReviews: (data) => localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(data)),
  addReview: (userId, groundId, rating, feedbackText) => {
    const reviews = mockDb.getReviews();
    
    // Check if user has already reviewed
    const alreadyReviewed = reviews.find(r => r.ground_id === groundId && r.user_id === userId);
    if (alreadyReviewed) {
      throw new Error('You have already left feedback for this ground.');
    }

    // Check if player has booked this ground (session_status must be active_playing or completed)
    const bookings = mockDb.getBookings();
    const slots = mockDb.getSlots();
    const userBookingsForGround = bookings.filter(b => {
      if (b.user_id !== userId) return false;
      const slot = slots.find(s => s.id === b.slot_id);
      return slot && slot.ground_id === groundId && (b.session_status === 'active_playing' || b.session_status === 'completed');
    });

    if (userBookingsForGround.length === 0) {
      throw new Error('Only players who have booked and checked into this venue can submit feedback.');
    }

    const newReview = {
      id: `review-${Math.random().toString(36).substring(2, 9)}`,
      ground_id: groundId,
      user_id: userId,
      rating: parseInt(rating),
      feedback_text: feedbackText,
      created_at: new Date().toISOString(),
    };

    reviews.push(newReview);
    mockDb.saveReviews(reviews);

    // Recalculate average ground rating
    const groundReviews = reviews.filter(r => r.ground_id === groundId);
    const avgRating = groundReviews.reduce((sum, r) => sum + r.rating, 0) / groundReviews.length;

    const grounds = mockDb.getGrounds();
    const groundIdx = grounds.findIndex(g => g.id === groundId);
    if (groundIdx !== -1) {
      grounds[groundIdx].rating = parseFloat(avgRating.toFixed(2));
      mockDb.saveGrounds(grounds);
    }

    return newReview;
  },
};
