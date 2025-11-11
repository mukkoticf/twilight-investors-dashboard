import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface InvestorData {
  investor_id: string;
  investor_name: string;
  email: string;
  phone: string;
  pan_number: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  investor: InvestorData | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [investor, setInvestor] = useState<InvestorData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is admin (you can customize this logic)
  const isAdmin = user?.email === 'admin@mail.com' || user?.email === 'admin@investor.com';

  // Fetch investor data when user is logged in
  const fetchInvestorData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no investor found, user might be admin
        console.log('No investor record found for user:', userId);
        setInvestor(null);
        return;
      }

      setInvestor(data);
    } catch (error) {
      console.error('Error fetching investor data:', error);
      setInvestor(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchInvestorData(session.user.id);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchInvestorData(session.user.id);
      } else {
        setInvestor(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        await fetchInvestorData(data.user.id);
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setInvestor(null);
      // Navigation will be handled by the component calling signOut
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    investor,
    loading,
    isAdmin,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

