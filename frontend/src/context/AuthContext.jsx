import { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token }); 
    }
    setLoading(false);
  }, []);

  const googleLogin = async (credentialResponse) => {
    try {
      const res = await client.post('/auth/google', { 
        credential: credentialResponse.credential 
      });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Successfully logged in with Google!');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Google login failed.');
      return false;
    }
  };

  const sendOtp = async (email) => {
    try {
      await client.post('/auth/send-otp', { email });
      toast.success('OTP sent to your email!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
      return false;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await client.post('/auth/verify-otp', { email, otp });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, googleLogin, sendOtp, verifyOtp, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);