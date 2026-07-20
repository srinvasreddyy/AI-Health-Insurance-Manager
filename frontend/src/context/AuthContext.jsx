import { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Try to fetch user profile to validate token
          const res = await client.get('/auth/profile', {
            headers: { 'x-auth-token': token }
          });
          setUser(res.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid/expired, clear it
          console.log('Token validation failed, clearing storage');
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const googleLogin = async (credentialResponse) => {
    try {
      const res = await client.post('/auth/google', { 
        credential: credentialResponse.credential 
      });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Successfully logged in with Google!');
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.response?.data?.message || 'Google login failed. Please try again.');
      return false;
    }
  };

  const sendOtp = async (email) => {
    try {
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        return false;
      }
      
      const res = await client.post('/auth/send-otp', { email });
      toast.success('OTP sent to your email! Check your inbox (and spam folder).');
      return true;
    } catch (error) {
      console.error('Send OTP error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send OTP. Please check your internet connection and try again.';
      toast.error(errorMsg);
      return false;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      if (!email || !otp) {
        toast.error('Please enter both email and OTP');
        return false;
      }

      if (otp.length !== 6) {
        toast.error('OTP must be 6 digits');
        return false;
      }
      
      const res = await client.post('/auth/verify-otp', { email, otp });
      
      if (!res.data.token) {
        toast.error('Authentication failed. Please try again.');
        return false;
      }

      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Invalid or expired OTP. Please request a new one.';
      toast.error(errorMsg);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, googleLogin, sendOtp, verifyOtp, logout, loading, isAuthenticated }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
