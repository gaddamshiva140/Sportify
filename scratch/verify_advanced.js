// Advanced Features Verification Suite for Sportify
// Run this script using: node scratch/verify_advanced.js

import { supabase } from '../src/services/supabase.js';
import { mockDb } from '../src/services/mockDb.js';

// Setup Mock LocalStorage for Node Environment
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, value) => { storage[key] = String(value); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { for (let k in storage) delete storage[k]; }
};

console.log('----------------------------------------------------');
console.log('SPORTIFY ADVANCED FEATURES TEST SUITE');
console.log('----------------------------------------------------');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedTests++;
  }
}

// 1. Test Google SSO authentication wrapper
async function testGoogleSSO() {
  console.log('\nTesting Simulated Google SSO Authentication...');
  localStorage.clear();

  const { data, error } = await supabase.auth.signInWithGoogle();
  assert(!error && data.user.email === 'google_player@sportify.com', 'Google SSO successfully logs in/registers and returns user profile.');
  assert(data.user.role === 'player', 'SSO user registers with default "player" privileges.');
  assert(data.user.email_verified === false, 'Google SSO starts with email_verified: false.');

  // Validate verification email confirmation link trigger
  const { data: verifiedData, error: verifyErr } = await supabase.auth.verifyEmail(data.user.id);
  assert(!verifyErr && verifiedData.user.email_verified === true, 'Calling verifyEmail sets email_verified to true.');
}

// 2. Test Mobile SMS OTP login wrapper
async function testMobileSMS() {
  console.log('\nTesting Simulated Mobile SMS OTP Authentication...');
  const phone = '+91 99999 88888';
  
  // Send OTP
  const { data: sendData, error: sendErr } = await supabase.auth.sendMobileOtp(phone);
  assert(!sendErr && sendData.code === '583920', 'Simulated SMS sends OTP validation code: 583920');

  // Verify Incorrect OTP
  const { data: badUser, error: badErr } = await supabase.auth.signInWithMobileOtp(phone, '111111');
  assert(badErr && !badUser.user, 'SMS OTP login fails on incorrect verification code.');

  // Verify Correct OTP
  const { data: goodUser, error: goodErr } = await supabase.auth.signInWithMobileOtp(phone, '583920');
  assert(!goodErr && goodUser.user.phone_number === phone, 'SMS OTP login succeeds on correct code, returning session user.');
  assert(goodUser.user.mobile_verified === true, 'SMS OTP verification marks mobile_verified: true.');
}

// 3. Test Check-In OTP Match Verification
async function testBookingCheckinOtp() {
  console.log('\nTesting Attendance OTP Check-In Engine...');
  
  const groundId = 'test-ground';
  const slotId = 'test-slot';
  const userId = 'player-id';

  const grounds = [{ id: groundId, owner_id: 'owner-id', title: 'Test Turf', hourly_price: 1000 }];
  const slots = [{ id: slotId, ground_id: groundId, start_time: new Date().toISOString(), end_time: new Date().toISOString(), status: 'available' }];
  
  localStorage.setItem('sportify_grounds', JSON.stringify(grounds));
  localStorage.setItem('sportify_slots', JSON.stringify(slots));
  localStorage.setItem('sportify_bookings', JSON.stringify([]));

  // 1. Create a booking
  const res = mockDb.bookSlot(userId, slotId, 1000);
  assert(res.success === true, 'Booking created successfully.');
  
  const booking = res.booking;
  assert(booking.session_status === 'pending_checkin', 'Booking starts in "pending_checkin" state.');
  assert(!!booking.otp_code, 'Booking generates a 6-digit attendance check-in OTP code.');

  // 2. Verify with incorrect OTP
  const checkinBad = mockDb.verifyBookingOtp(booking.id, '000000');
  assert(checkinBad.success === false, 'Owner verification fails on incorrect player check-in OTP.');

  // 3. Verify with correct OTP
  const checkinGood = mockDb.verifyBookingOtp(booking.id, booking.otp_code);
  assert(checkinGood.success === true, 'Owner verification succeeds on matching player OTP.');
  assert(checkinGood.booking.session_status === 'active_playing', 'Session status successfully transitions to "active_playing".');
  assert(!!checkinGood.booking.checkin_time, 'Session logs arrival checkin timestamp.');
}

// 4. Test Ground Deed Verification Badging
async function testDeedVerification() {
  console.log('\nTesting Ownership Document Deed Verification Badges...');

  const groundId = 'unverified-ground';
  const grounds = [{ id: groundId, owner_id: 'owner-id', title: 'Pending Turf', is_verified: false, license_doc: 'deed.pdf' }];
  localStorage.setItem('sportify_grounds', JSON.stringify(grounds));

  // Run verify DDL trigger
  const updatedGround = mockDb.verifyGround(groundId);
  assert(updatedGround.is_verified === true, 'Venue ownership deed verification updates "is_verified" to true.');
}

// 5. Test Player Reviews and Rating Eligibility
async function testPlayerReviews() {
  console.log('\nTesting Verified Player Reviews & Rating Calculations...');

  const playerUserId = 'player-reviewer';
  const ownerUserId = 'owner-host';
  const groundId = 'review-ground';
  const slotId = 'review-slot';

  // Seed databases
  const grounds = [{ id: groundId, owner_id: ownerUserId, title: 'Review Arena', rating: 5.0, is_verified: true }];
  const slots = [{ id: slotId, ground_id: groundId, start_time: new Date().toISOString(), end_time: new Date().toISOString(), status: 'available' }];
  
  localStorage.setItem('sportify_grounds', JSON.stringify(grounds));
  localStorage.setItem('sportify_slots', JSON.stringify(slots));
  localStorage.setItem('sportify_bookings', JSON.stringify([]));
  localStorage.setItem('sportify_reviews', JSON.stringify([]));

  // 1. Submit review without having any booking -> should throw error
  try {
    mockDb.addReview(playerUserId, groundId, 4, 'Nice ground.');
    assert(false, 'Should have failed because user has not booked this ground.');
  } catch (err) {
    assert(err.message.includes('submit feedback'), 'Submit review throws eligibility error for non-booked users.');
  }

  // 2. Create a booking but keep it pending checkin -> should throw error
  const bookRes = mockDb.bookSlot(playerUserId, slotId, 500);
  try {
    mockDb.addReview(playerUserId, groundId, 4, 'Nice ground.');
    assert(false, 'Should have failed because booking is not checked in.');
  } catch (err) {
    assert(err.message.includes('submit feedback'), 'Submit review throws eligibility error if booking is pending check-in.');
  }

  // 3. Verify OTP check-in (making the session active)
  mockDb.verifyBookingOtp(bookRes.booking.id, bookRes.booking.otp_code);

  // 4. Submit review -> should succeed now
  const review = mockDb.addReview(playerUserId, groundId, 3, 'Decent venue, but needs better nets.');
  assert(review.rating === 3, 'Review rating recorded correctly.');
  assert(review.feedback_text === 'Decent venue, but needs better nets.', 'Review feedback text recorded correctly.');

  // 5. Average rating calculation check
  const secondPlayerId = 'player-reviewer-2';
  const secondSlotId = 'review-slot-2';
  const allSlots = JSON.parse(localStorage.getItem('sportify_slots'));
  allSlots.push({ id: secondSlotId, ground_id: groundId, start_time: new Date().toISOString(), end_time: new Date().toISOString(), status: 'available' });
  localStorage.setItem('sportify_slots', JSON.stringify(allSlots));

  const bookRes2 = mockDb.bookSlot(secondPlayerId, secondSlotId, 500);
  mockDb.verifyBookingOtp(bookRes2.booking.id, bookRes2.booking.otp_code);

  // Submit second review (5 stars)
  mockDb.addReview(secondPlayerId, groundId, 5, 'Exceptional experience!');

  // Rating average should be (3 + 5) / 2 = 4.0
  const finalGrounds = mockDb.getGrounds();
  const targetGround = finalGrounds.find(g => g.id === groundId);
  assert(targetGround.rating === 4.0, 'Average ground rating successfully calculated and saved as 4.0.');
}

// Run Advanced suite
async function runSuite() {
  try {
    await testGoogleSSO();
    await testMobileSMS();
    await testBookingCheckinOtp();
    await testDeedVerification();
    await testPlayerReviews();

    console.log('\n----------------------------------------------------');
    console.log(`ADVANCED VERIFICATION SUMMARY: ${passedTests} passed, ${failedTests} failed.`);
    console.log('----------------------------------------------------');
    
    localStorage.clear();
    process.exit(failedTests > 0 ? 1 : 0);
  } catch (e) {
    console.error('Fatal crash during advanced test execution:', e);
    process.exit(1);
  }
}

runSuite();
