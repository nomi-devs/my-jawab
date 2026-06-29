// src/components/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, CheckCircle, XCircle } from 'lucide-react';
import authApi from '../../api/authApi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.forgotPassword({ email });
      console.log('Forgot password response:', response);
      
      if (response.status >= 200 && response.status < 300) {
        setSuccess(true);
      } else {
        throw new Error('Failed to send reset code');
      }
      
    } catch (err) {
      console.error('Forgot password error:', err);
      
      let errorMessage = 'Failed to send reset code. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  const handleResetWithCode = () => {
    navigate('/reset-password', { state: { email } });
  };

  const resetForm = () => {
    setEmail('');
    setError('');
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm overflow-hidden border border-purple-100 dark:border-gray-700 relative transition-colors duration-300">
        {/* Back Button */}
        <button 
          onClick={handleBack}
          className="absolute top-4 left-4 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors z-10"
          disabled={loading}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="p-6">
          {/* Success State */}
          {success ? (
            <div className="text-center animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 text-green-600 dark:text-green-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Reset Code Sent!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                We've sent a 6-digit reset code to <span className="font-semibold text-purple-600">{email}</span>
              </p>
              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg">
                  <strong>Next Steps:</strong> Check your email for the reset code, then use it to reset your password.
                </p>
                <button
                  onClick={handleResetWithCode}
                  className="w-full px-4 py-2.5 purple-gradient text-white font-semibold rounded-lg hover:opacity-90 transition-all active:scale-[0.98] text-sm"
                >
                  Enter Reset Code
                </button>
                <button
                  onClick={handleBack}
                  className="w-full px-4 py-2.5 border border-purple-200 dark:border-gray-600 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : (
            /* Forgot Password Form */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4 text-purple-600 dark:text-purple-400">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Forgot Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                Enter your email and we'll send you a reset code.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {error && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm animate-in slide-in-from-top duration-200 flex items-start gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all disabled:opacity-50 text-sm"
                    placeholder="admin@social.com"
                    required
                    disabled={loading}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full purple-gradient text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Reset Code...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>

                <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Remember your password?{' '}
                    <Link 
                      to="/login" 
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                    >
                      Back to Login
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Already have a reset code?{' '}
                    <Link 
                      to="/reset-password" 
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                    >
                      Reset Password Now
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;