// Automated Verification Script for Sportify Database Simulator
// Run this script using: node scratch/verify_mock.js

import { calculateHaversineDistance, mockDb } from '../src/services/mockDb.js';

// Custom in-memory LocalStorage polyfill for Node runtime
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, value) => { storage[key] = String(value); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { for (let k in storage) delete storage[k]; }
};

console.log('----------------------------------------------------');
console.log('SPORTIFY AUTOMATED TEST SUITE');
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

// 1. Test Geolocation Distance Calculations
function testHaversine() {
  console.log('\nTesting Geolocation Haversine Calculations...');
  
  // Coordinates of Mumbai Center (VT)
  const lat1 = 18.9696;
  const lng1 = 72.8282;

  // Coordinates of Bandra, Mumbai (approx 12-15 km away)
  const lat2 = 19.0596;
  const lng2 = 72.8295;

  const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
  console.log(`Calculated distance between VT and Bandra: ${distance.toFixed(2)} km`);
  
  assert(distance > 9 && distance < 13, 'Haversine formula reports a realistic range (10-12 km).');
}

// 2. Test Auth Flow
function testAuth() {
  console.log('\nTesting Authentication Simulator...');
  
  // Clear storage for fresh test run
  localStorage.clear();
  
  // Seed default data
  const defaultProfiles = [
    { id: 'owner-user-id', email: 'owner@sportify.com', full_name: 'Vikram', role: 'owner' },
    { id: 'player-user-id', email: 'player@sportify.com', full_name: 'Rohit', role: 'player' }
  ];
  localStorage.setItem('sportify_profiles', JSON.stringify(defaultProfiles));

  // Test Sign In
  const user = mockDb.signIn('player@sportify.com', 'pass');
  assert(user.full_name === 'Rohit', 'Sign in successfully retrieves correct profile.');

  // Test Sign Up
  const newEmail = `user_${Math.floor(Math.random()*1000)}@test.com`;
  const newUser = mockDb.signUp(newEmail, 'securepass', 'Test User', 'player', '+91 90000 11111');
  assert(newUser.email === newEmail && newUser.role === 'player', 'Sign up creates profile with appropriate properties.');

  // Double Registration Check
  try {
    mockDb.signUp(newEmail, 'securepass', 'Duplicate User', 'player');
    assert(false, 'Should fail to register duplicate email.');
  } catch (err) {
    assert(err.message === 'User already exists', 'Prevents duplicate email registration.');
  }
}

// 3. Test Booking Transaction and Double Booking Prevention
function testDoubleBooking() {
  console.log('\nTesting Double-Booking Lock Isolation...');

  const groundId = 'test-ground-id';
  const slotId = 'test-slot-123';
  
  const sampleGrounds = [{ id: groundId, owner_id: 'owner-id', title: 'Test Turf', hourly_price: 1000 }];
  const sampleSlots = [
    { id: slotId, ground_id: groundId, start_time: new Date().toISOString(), end_time: new Date().toISOString(), status: 'available' }
  ];
  const sampleBookings = [];

  localStorage.setItem('sportify_grounds', JSON.stringify(sampleGrounds));
  localStorage.setItem('sportify_slots', JSON.stringify(sampleSlots));
  localStorage.setItem('sportify_bookings', JSON.stringify(sampleBookings));

  // Perform first reservation (Simulating user A checking out)
  const userAResult = mockDb.bookSlot('user-a-id', slotId, 1000);
  assert(userAResult.success === true, 'First checkout succeeds and marks slot as booked.');

  // Perform parallel concurrent reservation (Simulating user B checking out immediately after)
  const userBResult = mockDb.bookSlot('user-b-id', slotId, 1000);
  assert(userBResult.success === false, 'Parallel checkout fails with collision warning.');
  assert(userBResult.message === 'Slot no longer available', 'Collision returns "Slot no longer available" warning.');

  const updatedSlots = mockDb.getSlots();
  assert(updatedSlots.find(s => s.id === slotId).status === 'booked', 'Slot status is successfully locked to booked.');
}

// Execute Tests
try {
  testHaversine();
  testAuth();
  testDoubleBooking();
  
  console.log('\n----------------------------------------------------');
  console.log(`VERIFICATION SUMMARY: ${passedTests} passed, ${failedTests} failed.`);
  console.log('----------------------------------------------------');
  
  // Clean up test storage
  localStorage.clear();
  process.exit(failedTests > 0 ? 1 : 0);
} catch (e) {
  console.error('Fatal crash during test suite run:', e);
  process.exit(1);
}
