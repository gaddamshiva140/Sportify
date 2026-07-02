-- Sportify - Database Schema Blueprint
-- Use this file to set up your Supabase/PostgreSQL database.

-- =========================================================================
-- OPTIONAL CLEAN RESET: Uncomment the lines below if you want to wipe
-- and re-create all tables from scratch (WARNING: deletes all data).
-- =========================================================================
-- DROP TABLE IF EXISTS public.bookings CASCADE;
-- DROP TABLE IF EXISTS public.slots CASCADE;
-- DROP TABLE IF EXISTS public.grounds CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;


-- =========================================================================
-- 1. Profiles Table Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  phone_number text,
  role text DEFAULT 'player' CHECK (role IN ('player', 'owner')),
  email_verified boolean DEFAULT false,
  mobile_verified boolean DEFAULT false,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Ensure columns exist if table was already created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Re-create Policy Guards
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- =========================================================================
-- 2. Grounds Table Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.grounds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  sport_type text NOT NULL,
  indoor_outdoor text CHECK (indoor_outdoor IN ('indoor', 'outdoor')) NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  hourly_price numeric(10,2) NOT NULL,
  images text[] DEFAULT '{}'::text[],
  facilities text[] DEFAULT '{}'::text[],
  rating numeric(3,2) DEFAULT 5.0,
  is_verified boolean DEFAULT false,
  license_doc text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on Grounds
ALTER TABLE public.grounds ENABLE ROW LEVEL SECURITY;

-- Re-create Policy Guards
DROP POLICY IF EXISTS "Grounds are viewable by everyone." ON public.grounds;
CREATE POLICY "Grounds are viewable by everyone." ON public.grounds
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can insert their own grounds." ON public.grounds;
CREATE POLICY "Owners can insert their own grounds." ON public.grounds
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can update their own grounds." ON public.grounds;
CREATE POLICY "Owners can update their own grounds." ON public.grounds
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their own grounds." ON public.grounds;
CREATE POLICY "Owners can delete their own grounds." ON public.grounds
  FOR DELETE USING (auth.uid() = owner_id);


-- =========================================================================
-- 3. Slots Table Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ground_id uuid REFERENCES public.grounds(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on Slots
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- Re-create Policy Guards
DROP POLICY IF EXISTS "Slots are viewable by everyone." ON public.slots;
CREATE POLICY "Slots are viewable by everyone." ON public.slots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage slots for their grounds." ON public.slots;
CREATE POLICY "Owners can manage slots for their grounds." ON public.slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.grounds
      WHERE grounds.id = slots.ground_id AND grounds.owner_id = auth.uid()
    )
  );


-- =========================================================================
-- 4. Bookings Table Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slot_id uuid REFERENCES public.slots(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_price numeric(10,2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  otp_code text NOT NULL,
  session_status text DEFAULT 'pending_checkin' CHECK (session_status IN ('pending_checkin', 'active_playing', 'completed')),
  scoreboard jsonb DEFAULT NULL,
  checkin_time timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ensure scoreboard column exists if table was already created previously
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS scoreboard jsonb DEFAULT NULL;

-- Enable RLS on Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Re-create Policy Guards
DROP POLICY IF EXISTS "Users can view their own bookings." ON public.bookings;
CREATE POLICY "Users can view their own bookings." ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.slots s
      JOIN public.grounds g ON s.ground_id = g.id
      WHERE s.id = bookings.slot_id AND g.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Players can insert bookings." ON public.bookings;
CREATE POLICY "Players can insert bookings." ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update booking status." ON public.bookings;
CREATE POLICY "Owners can update booking status." ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.slots s
      JOIN public.grounds g ON s.ground_id = g.id
      WHERE s.id = bookings.slot_id AND g.owner_id = auth.uid()
    )
  );


-- =========================================================================
-- 4.5 Reviews Table Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ground_id uuid REFERENCES public.grounds(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  feedback_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ground_id, user_id)
);

-- Enable RLS on Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Re-create Policy Guards
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can write reviews for booked grounds." ON public.reviews;
CREATE POLICY "Players can write reviews for booked grounds." ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.slots s ON b.slot_id = s.id
      WHERE s.ground_id = reviews.ground_id 
        AND b.user_id = auth.uid()
        AND b.session_status IN ('active_playing', 'completed')
    )
  );


-- =========================================================================
-- 5. Nearby Search Function (Haversine Formula)
-- =========================================================================
CREATE OR REPLACE FUNCTION search_nearby_grounds(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  sport_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  title text,
  description text,
  sport_type text,
  indoor_outdoor text,
  latitude double precision,
  longitude double precision,
  hourly_price numeric,
  images text[],
  facilities text[],
  rating numeric,
  is_verified boolean,
  license_doc text,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.owner_id,
    g.title,
    g.description,
    g.sport_type,
    g.indoor_outdoor,
    g.latitude,
    g.longitude,
    g.hourly_price,
    g.images,
    g.facilities,
    g.rating,
    g.is_verified,
    g.license_doc,
    (3959 * acos(
      cos(radians(user_lat)) * cos(radians(g.latitude)) * 
      cos(radians(g.longitude) - radians(user_lng)) + 
      sin(radians(user_lat)) * sin(radians(g.latitude))
    )) * 1.609344 AS distance_km
  FROM public.grounds g
  WHERE 
    (sport_filter IS NULL OR g.sport_type = sport_filter)
    AND (
      (3959 * acos(
        cos(radians(user_lat)) * cos(radians(g.latitude)) * 
        cos(radians(g.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(g.latitude))
      )) * 1.609344 <= radius_km
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 6. Atomic Transaction Booking Function
-- =========================================================================
CREATE OR REPLACE FUNCTION book_slot(
  p_booking_id uuid,
  p_user_id uuid,
  p_slot_id uuid,
  p_total_price numeric,
  p_otp_code text
)
RETURNS text AS $$
DECLARE
  v_status text;
BEGIN
  -- Locking the slot to prevent concurrency race
  SELECT status INTO v_status FROM public.slots WHERE id = p_slot_id FOR UPDATE;
  
  IF v_status IS NULL THEN
    RETURN 'Slot not found';
  ELSIF v_status <> 'available' THEN
    RETURN 'Slot no longer available';
  END IF;

  -- Mark slot as booked
  UPDATE public.slots SET status = 'booked' WHERE id = p_slot_id;

  -- Create booking
  INSERT INTO public.bookings (id, user_id, slot_id, total_price, payment_status, otp_code, session_status, checkin_time, created_at)
  VALUES (p_booking_id, p_user_id, p_slot_id, p_total_price, 'paid', p_otp_code, 'pending_checkin', NULL, now());

  RETURN 'success';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 7. Verification OTP Procedure
-- =========================================================================
CREATE OR REPLACE FUNCTION verify_booking_otp(
  p_booking_id uuid,
  p_otp_code text
)
RETURNS text AS $$
DECLARE
  v_otp text;
  v_status text;
BEGIN
  SELECT otp_code, session_status INTO v_otp, v_status FROM public.bookings WHERE id = p_booking_id;
  
  IF v_otp IS NULL THEN
    RETURN 'Booking not found';
  ELSIF v_otp <> p_otp_code THEN
    RETURN 'Incorrect OTP. Verification failed';
  END IF;
  
  UPDATE public.bookings 
  SET session_status = 'active_playing', checkin_time = now() 
  WHERE id = p_booking_id;
  
  RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 8. Verify Ground Owner Deed Procedure
-- =========================================================================
CREATE OR REPLACE FUNCTION verify_ground(
  p_ground_id uuid
)
RETURNS text AS $$
BEGIN
  UPDATE public.grounds 
  SET is_verified = true 
  WHERE id = p_ground_id;
  
  RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 9. Trigger for auth sign-up
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Player'),
    new.email,
    new.raw_user_meta_data->>'phone_number',
    COALESCE(new.raw_user_meta_data->>'role', 'player')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create Trigger Guard
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================================
-- 9. High-Performance Scaling Indexes (100k+ Users Support)
-- =========================================================================

-- Index slot availability checks (essential for high-volume slot listing & book queries)
CREATE INDEX IF NOT EXISTS idx_slots_search ON public.slots (ground_id, start_time, status);

-- Index bookings to prevent sequential table scans during double-booking validation
CREATE INDEX IF NOT EXISTS idx_bookings_lock ON public.bookings (slot_id, user_id);

-- Index geographical coordinates to accelerate nearby ground discovery searches
CREATE INDEX IF NOT EXISTS idx_grounds_geo ON public.grounds (latitude, longitude);

-- Index profile roles to optimize dashboard statistics aggregation
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role, email_verified);

