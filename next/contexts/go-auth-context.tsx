"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
}

interface GoAuthContextType {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message?: string;
    userID?: string;
    requiresOTP?: boolean;
  }>;
  loginAdmin: (password: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  register: (
    email: string,
    password: string,
    betaCode?: string
  ) => Promise<{
    success: boolean;
    message?: string;
    userID?: string;
    otpSecret?: string;
    qrCodeURL?: string;
  }>;
  verifyOTP: (
    userID: string,
    otpCode: string
  ) => Promise<{ success: boolean; message?: string }>;
  completeRegistration: (
    userID: string,
    otpCode: string
  ) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (
    email: string,
    newPassword: string,
    otpCode: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const GoAuthContext = createContext<GoAuthContextType | undefined>(undefined);

export function GoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token on mount
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');

      console.log('🔍 GoAuth: Checking localStorage...', {
        hasToken: !!savedToken,
        hasUser: !!savedUser,
      });

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);
          console.log('✅ GoAuth: Restored auth from localStorage', parsedUser.email);
        } catch (err) {
          console.error('❌ GoAuth: Failed to parse saved user:', err);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      } else {
        console.log('ℹ️ GoAuth: No saved auth found');
      }

      setIsLoading(false);
    }
  }, []);

  // Listen for unauthorized events (401 responses)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleUnauthorized = () => {
        console.log('Unauthorized event received - clearing auth state');
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      };

      window.addEventListener('unauthorized', handleUnauthorized);

      return () => {
        window.removeEventListener('unauthorized', handleUnauthorized);
      };
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/go/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_otp) {
          // OTP required - return userID for next step
          return {
            success: true,
            userID: data.user_id,
            requiresOTP: true,
            message: data.message,
          };
        } else if (data.token) {
          // Login successful without OTP - save auth state
          const userInfo = {
            id: data.user_id,
            email: data.email || email,
          };

          console.log('✅ GoAuth: Login successful, saving auth...', {
            email: userInfo.email,
            hasToken: !!data.token,
          });

          // CRITICAL: Save to localStorage FIRST before updating state
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(userInfo));
            console.log('💾 GoAuth: Auth saved to localStorage');
          }

          // Update React state AFTER localStorage
          setToken(data.token);
          setUser(userInfo);
          
          console.log('✅ GoAuth: React state updated');

          return { success: true, message: data.message };
        }
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: 'Login failed, please try again' };
    }

    return { success: false, message: 'Unknown error' };
  };

  const loginAdmin = async (password: string) => {
    try {
      const response = await fetch('/api/go/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userInfo = {
          id: data.user_id || 'admin',
          email: data.email || 'admin@localhost',
        };

        console.log('✅ GoAuth: Admin login successful, saving auth...');

        // CRITICAL: Save to localStorage FIRST before updating state
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(userInfo));
          console.log('💾 GoAuth: Auth saved to localStorage');
        }

        // Update React state AFTER localStorage
        setToken(data.token);
        setUser(userInfo);
        
        console.log('✅ GoAuth: React state updated');

        return { success: true };
      } else {
        return { success: false, message: data.error || 'Login failed' };
      }
    } catch (e) {
      return { success: false, message: 'Login failed, please try again' };
    }
  };

  const register = async (
    email: string,
    password: string,
    betaCode?: string
  ) => {
    try {
      const requestBody: {
        email: string;
        password: string;
        beta_code?: string;
      } = { email, password };

      if (betaCode) {
        requestBody.beta_code = betaCode;
      }

      const response = await fetch('/api/go/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          userID: data.user_id,
          otpSecret: data.otp_secret,
          qrCodeURL: data.qr_code_url,
          message: data.message,
        };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: 'Registration failed, please try again' };
    }
  };

  const verifyOTP = async (userID: string, otpCode: string) => {
    try {
      const response = await fetch('/api/go/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userID, otp_code: otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful, save token and user info
        const userInfo = { id: data.user_id, email: data.email };
        
        console.log('✅ GoAuth: OTP verified, saving auth...', {
          email: userInfo.email,
          hasToken: !!data.token,
        });

        // CRITICAL: Save to localStorage FIRST before updating state
        // This ensures persistence even if React state update is delayed
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(userInfo));
          console.log('💾 GoAuth: Auth saved to localStorage');
        }

        // Update React state AFTER localStorage
        setToken(data.token);
        setUser(userInfo);
        
        console.log('✅ GoAuth: React state updated');

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: 'OTP verification failed, please try again' };
    }
  };

  const completeRegistration = async (userID: string, otpCode: string) => {
    try {
      const response = await fetch('/api/go/auth/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userID, otp_code: otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration complete, auto login
        const userInfo = { id: data.user_id, email: data.email };
        
        console.log('✅ GoAuth: Registration complete, saving auth...', {
          email: userInfo.email,
          hasToken: !!data.token,
        });

        // CRITICAL: Save to localStorage FIRST before updating state
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(userInfo));
          console.log('💾 GoAuth: Auth saved to localStorage');
        }

        // Update React state AFTER localStorage
        setToken(data.token);
        setUser(userInfo);
        
        console.log('✅ GoAuth: React state updated');

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: 'Registration completion failed, please try again' };
    }
  };

  const resetPassword = async (
    email: string,
    newPassword: string,
    otpCode: string
  ) => {
    try {
      const response = await fetch('/api/go/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          new_password: newPassword,
          otp_code: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: 'Password reset failed, please try again' };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');

      if (savedToken) {
        fetch('/api/go/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${savedToken}` },
        }).catch(() => {
          /* ignore network errors on logout */
        });
      }

      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  return (
    <GoAuthContext.Provider
      value={{
        user,
        token,
        login,
        loginAdmin,
        register,
        verifyOTP,
        completeRegistration,
        resetPassword,
        logout,
        isLoading,
      }}
    >
      {children}
    </GoAuthContext.Provider>
  );
}

export function useGoAuth() {
  const context = useContext(GoAuthContext);
  if (context === undefined) {
    throw new Error('useGoAuth must be used within a GoAuthProvider');
  }
  return context;
}

