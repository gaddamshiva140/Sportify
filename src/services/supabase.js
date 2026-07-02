// Supabase Client Wrapper
// Automatically switches between Real Supabase and Local Storage Mock DB based on env config.

import { createClient } from '@supabase/supabase-js';
import { mockDb, initMockDb } from './mockDb.js';

const supabaseUrl = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_SUPABASE_URL : (process.env.VITE_SUPABASE_URL || null);
const supabaseAnonKey = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_SUPABASE_ANON_KEY : (process.env.VITE_SUPABASE_ANON_KEY || null);

export const isRealSupabase = !!(supabaseUrl && supabaseAnonKey);

let realClient = null;

if (isRealSupabase) {
  realClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Initialize mock database seeds if running in Mock Mode
  initMockDb();
}

// Unified client interface
export const supabase = {
  // 1. Auth Interface
  auth: {
    signUp: async ({ email, password, options }) => {
      if (isRealSupabase) {
        return realClient.auth.signUp({ email, password, options });
      } else {
        try {
          const role = options?.data?.role || 'player';
          const fullName = options?.data?.full_name || '';
          const phoneNumber = options?.data?.phone_number || '';
          const user = mockDb.signUp(email, password, fullName, role, phoneNumber);
          // Save session
          localStorage.setItem('sportify_session_user', JSON.stringify(user));
          return { data: { user }, error: null };
        } catch (err) {
          return { data: { user: null }, error: err };
        }
      }
    },

    signInWithPassword: async ({ email, password }) => {
      if (isRealSupabase) {
        return realClient.auth.signInWithPassword({ email, password });
      } else {
        try {
          const user = mockDb.signIn(email, password);
          localStorage.setItem('sportify_session_user', JSON.stringify(user));
          return { data: { user }, error: null };
        } catch (err) {
          return { data: { user: null }, error: err };
        }
      }
    },

    signInWithGoogle: async (role = 'player') => {
      if (isRealSupabase) {
        return realClient.auth.signInWithOAuth({ 
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            data: {
              role: role
            }
          }
        });
      } else {
        try {
          const user = mockDb.signInWithGoogle(role);
          localStorage.setItem('sportify_session_user', JSON.stringify(user));
          return { data: { user }, error: null };
        } catch (err) {
          return { data: { user: null }, error: err };
        }
      }
    },

    sendMobileOtp: async (phone) => {
      if (isRealSupabase) {
        return realClient.auth.signInWithOtp({ phone });
      } else {
        try {
          const res = mockDb.sendMobileOtp(phone);
          return { data: res, error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      }
    },

    signInWithMobileOtp: async (phone, code) => {
      if (isRealSupabase) {
        return realClient.auth.verifyOtp({ phone, token: code, type: 'sms' });
      } else {
        try {
          const user = mockDb.signInWithMobileOtp(phone, code);
          localStorage.setItem('sportify_session_user', JSON.stringify(user));
          return { data: { user }, error: null };
        } catch (err) {
          return { data: { user: null }, error: err };
        }
      }
    },

    verifyEmail: async (userId) => {
      if (isRealSupabase) {
        return { data: { success: true }, error: null };
      } else {
        try {
          const user = mockDb.verifyEmail(userId);
          return { data: { user }, error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      }
    },

    resend: async ({ type, email }) => {
      if (isRealSupabase) {
        return realClient.auth.resend({ type, email });
      } else {
        return { data: { success: true }, error: null };
      }
    },

    updateUser: async (attributes) => {
      if (isRealSupabase) {
        return realClient.auth.updateUser(attributes);
      } else {
        try {
          const sessionUser = JSON.parse(localStorage.getItem('sportify_session_user') || 'null');
          if (sessionUser) {
            const updated = { ...sessionUser, ...attributes };
            localStorage.setItem('sportify_session_user', JSON.stringify(updated));
            return { data: { user: updated }, error: null };
          }
          return { data: { user: null }, error: new Error('No session active') };
        } catch (err) {
          return { data: { user: null }, error: err };
        }
      }
    },

    signOut: async () => {
      if (isRealSupabase) {
        return realClient.auth.signOut();
      } else {
        localStorage.removeItem('sportify_session_user');
        return { error: null };
      }
    },

    getUser: async () => {
      if (isRealSupabase) {
        return realClient.auth.getUser();
      } else {
        const user = JSON.parse(localStorage.getItem('sportify_session_user') || 'null');
        return { data: { user }, error: null };
      }
    },

    onAuthStateChange: (callback) => {
      if (isRealSupabase) {
        return realClient.auth.onAuthStateChange(callback);
      } else {
        // Simple mock trigger
        const handleStorageChange = (e) => {
          if (e.key === 'sportify_session_user') {
            const user = JSON.parse(e.newValue || 'null');
            callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
          }
        };
        window.addEventListener('storage', handleStorageChange);
        
        // Return unsubscribe function
        return {
          data: {
            subscription: {
              unsubscribe: () => window.removeEventListener('storage', handleStorageChange),
            },
          },
        };
      }
    },
  },

  // 2. Database/Query Builder Interface (Simulated Fluent Chain for Mock Mode)
  from: (table) => {
    if (isRealSupabase) {
      return realClient.from(table);
    }

    // Mock query runner chain
    return {
      select: (selectStr = '*') => {
        let list = [];
        if (table === 'profiles') list = mockDb.getProfiles();
        else if (table === 'grounds') list = mockDb.getGrounds();
        else if (table === 'slots') list = mockDb.getSlots();
        else if (table === 'bookings') list = mockDb.getBookings();
        else if (table === 'reviews') list = mockDb.getReviews();

        const queryObj = {
          data: list,
          error: null,
          eq: (field, value) => {
            queryObj.data = queryObj.data.filter((item) => item[field] === value);
            return queryObj;
          },
          neq: (field, value) => {
            queryObj.data = queryObj.data.filter((item) => item[field] !== value);
            return queryObj;
          },
          in: (field, valuesArray) => {
            queryObj.data = queryObj.data.filter((item) => valuesArray.includes(item[field]));
            return queryObj;
          },
          order: (field, { ascending = true } = {}) => {
            queryObj.data = [...queryObj.data].sort((a, b) => {
              if (a[field] < b[field]) return ascending ? -1 : 1;
              if (a[field] > b[field]) return ascending ? 1 : -1;
              return 0;
            });
            return queryObj;
          },
          single: () => {
            if (queryObj.data.length === 0) {
              return { data: null, error: { message: 'Row not found' } };
            }
            return { data: queryObj.data[0], error: null };
          },
          then: (onfulfilled) => {
            return Promise.resolve({ data: queryObj.data, error: queryObj.error }).then(onfulfilled);
          },
        };

        return queryObj;
      },

      insert: (rows) => {
        const rowsArray = Array.isArray(rows) ? rows : [rows];
        let error = null;
        let insertedData = [];

        try {
          if (table === 'profiles') {
            const profiles = mockDb.getProfiles();
            rowsArray.forEach((r) => profiles.push(r));
            mockDb.saveProfiles(profiles);
            insertedData = rowsArray;
          } else if (table === 'grounds') {
            rowsArray.forEach((r) => {
              const res = mockDb.addGround(r.owner_id, r);
              insertedData.push(res);
            });
          } else if (table === 'slots') {
            const slots = mockDb.getSlots();
            rowsArray.forEach((r) => slots.push({ id: `slot-${Math.random().toString(36).substring(2, 9)}`, ...r }));
            mockDb.saveSlots(slots);
            insertedData = rowsArray;
          } else if (table === 'bookings') {
            rowsArray.forEach((r) => {
              const res = mockDb.bookSlot(r.user_id, r.slot_id, r.total_price);
              if (!res.success) {
                throw new Error(res.message);
              }
              insertedData.push(res.booking);
            });
          } else if (table === 'reviews') {
            rowsArray.forEach((r) => {
              const res = mockDb.addReview(r.user_id, r.ground_id, r.rating, r.feedback_text);
              insertedData.push(res);
            });
          }
        } catch (err) {
          error = err;
        }

        const response = { data: insertedData, error };
        return {
          select: () => response,
          then: (resolve) => Promise.resolve(response).then(resolve),
        };
      },

      update: (fields) => {
        let error = null;
        let updatedData = [];

        return {
          eq: (key, val) => {
            try {
              if (table === 'profiles') {
                const profiles = mockDb.getProfiles();
                const idx = profiles.findIndex((p) => p[key] === val);
                if (idx !== -1) {
                  profiles[idx] = { ...profiles[idx], ...fields };
                  mockDb.saveProfiles(profiles);
                  updatedData = [profiles[idx]];
                }
              } else if (table === 'grounds') {
                const grounds = mockDb.getGrounds();
                const idx = grounds.findIndex((g) => g[key] === val);
                if (idx !== -1) {
                  const res = mockDb.updateGround(grounds[idx].id, fields);
                  updatedData = [res];
                }
              } else if (table === 'slots') {
                const slots = mockDb.getSlots();
                const idx = slots.findIndex((s) => s[key] === val);
                if (idx !== -1) {
                  const res = mockDb.updateSlotStatus(slots[idx].id, fields.status);
                  updatedData = [res];
                }
              } else if (table === 'bookings') {
                const bookings = mockDb.getBookings();
                const idx = bookings.findIndex((b) => b[key] === val);
                if (idx !== -1) {
                  bookings[idx] = { ...bookings[idx], ...fields };
                  mockDb.saveBookings(bookings);
                  updatedData = [bookings[idx]];
                }
              }
            } catch (err) {
              error = err;
            }

            const response = { data: updatedData, error };
            return {
              then: (resolve) => Promise.resolve(response).then(resolve),
            };
          },
        };
      },

      delete: () => {
        return {
          eq: (key, val) => {
            let error = null;
            try {
              if (table === 'grounds') {
                const grounds = mockDb.getGrounds();
                const match = grounds.find((g) => g[key] === val);
                if (match) {
                  mockDb.deleteGround(match.id);
                }
              }
            } catch (err) {
              error = err;
            }

            const response = { data: [], error };
            return {
              then: (resolve) => Promise.resolve(response).then(resolve),
            };
          },
        };
      },
    };
  },

  // 3. PostgreSQL RPC Functions Interface
  rpc: async (fnName, params) => {
    if (isRealSupabase) {
      return realClient.rpc(fnName, params);
    }

    try {
      if (fnName === 'search_nearby_grounds') {
        const data = mockDb.searchNearbyGrounds(
          params.user_lat,
          params.user_lng,
          params.radius_km,
          params.sport_filter
        );
        return { data, error: null };
      } else if (fnName === 'book_slot') {
        const res = mockDb.bookSlot(params.p_user_id, params.p_slot_id, params.p_total_price);
        if (res.success) {
          return { data: 'success', error: null };
        } else {
          return { data: null, error: { message: res.message } };
        }
      } else if (fnName === 'verify_booking_otp') {
        const res = mockDb.verifyBookingOtp(params.p_booking_id, params.p_otp_code);
        if (res.success) {
          return { data: 'success', error: null };
        } else {
          return { data: null, error: { message: res.message } };
        }
      } else if (fnName === 'verify_ground') {
        const res = mockDb.verifyGround(params.p_ground_id);
        return { data: res, error: null };
      }
      return { data: null, error: { message: `Function ${fnName} not mocked` } };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // 4. Storage Bucket Interface
  storage: {
    from: (bucket) => {
      if (isRealSupabase) {
        return realClient.storage.from(bucket);
      }

      return {
        upload: async (path, fileBody) => {
          // Mock successful upload and return a fake public URL
          // If the fileBody is a base64 string (camera snapshot), we just use it directly!
          if (typeof fileBody === 'string' && fileBody.startsWith('data:image')) {
            return { data: { path, publicUrl: fileBody }, error: null };
          }
          const mockUrls = [
            'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800'
          ];
          const randomUrl = mockUrls[Math.floor(Math.random() * mockUrls.length)];
          return { data: { path, publicUrl: randomUrl }, error: null };
        },
        getPublicUrl: (path) => {
          return { data: { publicUrl: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800' } };
        },
      };
    },
  },
};
