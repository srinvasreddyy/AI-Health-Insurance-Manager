import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login = () => {
  const { googleLogin, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for resend button
  const handleStartCountdown = () => {
    setOtpSentTime(Date.now());
    let countdown = 60;
    setResendCountdown(countdown);
    
    const interval = setInterval(() => {
      countdown -= 1;
      setResendCountdown(countdown);
      if (countdown <= 0) clearInterval(interval);
    }, 1000);
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    const success = await googleLogin(response);
    setLoading(false);
    if (success) navigate('/dashboard');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    const success = await sendOtp(email);
    setLoading(false);
    
    if (success) {
      setStep('otp');
      setOtp('');
      handleStartCountdown();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    const success = await verifyOtp(email, otp);
    setLoading(false);
    
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    
    setLoading(true);
    const success = await sendOtp(email);
    setLoading(false);
    
    if (success) {
      setOtp('');
      handleStartCountdown();
      toast.success('New OTP sent! Check your email.');
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setResendCountdown(0);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Welcome</h2>
          <p className="text-slate-500 mt-2">Sign in to manage your health risk</p>
        </div>

        {/* Google Login Section */}
        <div className="flex justify-center mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google login failed')}
              theme="filled_blue"
              shape="pill"
              width="100%"
            />
          </motion.div>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or continue with Email</span>
          </div>
        </div>

        {/* Email Entry Step */}
        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-slate-50"
                  placeholder="name@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                We'll send a one-time code to verify your identity
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Sending...
                </>
              ) : (
                <>
                  Get Login Code <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>
        ) : (
          // OTP Entry Step
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Email display with edit button */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <span className="text-sm text-slate-700">
                  Code sent to: <span className="font-semibold text-slate-900">{email}</span>
                </span>
                <button 
                  type="button" 
                  onClick={handleBackToEmail}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm ml-2 hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter 6-Digit Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-slate-50 text-center text-lg font-bold tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Check your email (including spam folder)
              </p>
            </div>

            {/* Verify Button */}
            <motion.button
              type="submit"
              disabled={loading || otp.length !== 6}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Login <CheckCircle2 size={18} />
                </>
              )}
            </motion.button>

            {/* Resend OTP Button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCountdown > 0 || loading}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <RotateCcw size={14} />
                {resendCountdown > 0 
                  ? `Resend code in ${resendCountdown}s` 
                  : "Didn't receive code? Resend"}
              </button>
            </div>

            {/* Error recovery info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-amber-800">
                <strong>OTP expires in 10 minutes.</strong> If it expires, click "Resend" to get a new one.
              </p>
            </div>
          </form>
        )}

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
