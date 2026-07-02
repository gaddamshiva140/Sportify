import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import Categories from './pages/Categories';
import GroundDetails from './pages/GroundDetails';
import BookingPage from './pages/BookingPage';
import AddGround from './pages/AddGround';
import ManageGrounds from './pages/ManageGrounds';
import SlotManagement from './pages/SlotManagement';
import RevenueDashboard from './pages/RevenueDashboard';
import Profile from './pages/Profile';
import BookingHistory from './pages/BookingHistory';
import VerifyEmail from './pages/VerifyEmail';

// Protected Route for Players/Users
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-dark">
        <div className="h-8 w-8 border-4 border-sport-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Protected Route for Ground Owners (Admins)


function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-brand-dark text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/ground/:id" element={<GroundDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Booking & Dashboard Protected Routes */}
          <Route 
            path="/booking" 
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={<Navigate to="/profile" replace />} 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <BookingHistory />
              </ProtectedRoute>
            } 
          />

          {/* Shared Protected Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Ground Listing & Hosting Protected Routes */}
          <Route 
            path="/admin" 
            element={<Navigate to="/profile" replace />} 
          />
          <Route 
            path="/admin/add-ground" 
            element={
              <ProtectedRoute>
                <AddGround />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-grounds" 
            element={
              <ProtectedRoute>
                <ManageGrounds />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/slots/:groundId" 
            element={
              <ProtectedRoute>
                <SlotManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/revenue" 
            element={
              <ProtectedRoute>
                <RevenueDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
