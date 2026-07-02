import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          // In real Supabase, we would select the profile row. In mock, authUser is already the profile.
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          setUser(profile || authUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching auth user', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(profile || session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, fullName, role, phoneNumber) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone_number: phoneNumber,
        },
      },
    });

    if (error) {
      setLoading(false);
      throw error;
    }
    
    // In mock mode, the signup automatically logs the user in.
    // In real mode, it might require email verification, but we set user if returned
    if (data?.user) {
      setUser(data.user);
    }
    setLoading(false);
    return data;
  };

  const signIn = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    if (data?.user) {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      setUser(profile || data.user);
    }
    setLoading(false);
    return data;
  };

  const signInWithGoogle = async (role = 'player') => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithGoogle(role);
    if (error) {
      setLoading(false);
      throw error;
    }
    if (data?.user) {
      setUser(data.user);
    }
    setLoading(false);
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      throw error;
    }
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not logged in');

    if (updates.email && updates.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: updates.email });
      if (authError) throw authError;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
    
    setUser((prev) => ({ ...prev, ...updates }));
    return data;
  };

  const verifyEmailLink = async (userId) => {
    const { data, error } = await supabase.auth.verifyEmail(userId);
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  };

  const resendVerification = async (email) => {
    setLoading(true);
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'owner',
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    verifyEmailLink,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
