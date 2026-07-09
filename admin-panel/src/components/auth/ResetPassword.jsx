// src/components/auth/ResetPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Lock, Loader2, CheckCircle, XCircle, Key, Eye, EyeOff } from 'lucide-react';
import authApi from '../../api/authApi';

const ResetPassword = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state (if coming from forgot password)
  const emailFromState = location.state?.email || '';

  const [formData, setFormData] = useState({
    email: emailFromState,
    reset_code: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError(t('resetPassword.emailRequired'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('resetPassword.emailInvalid'));
      return false;
    }

    if (!formData.reset_code.trim()) {
      setError(t('resetPassword.resetCodeRequired'));
      return false;
    }

    if (formData.reset_code.length !== 6) {
      setError(t('resetPassword.resetCodeLength'));
      return false;
    }

    if (!formData.new_password) {
      setError(t('resetPassword.newPasswordRequired'));
      return false;
    }

    if (formData.new_password.length < 6) {
      setError(t('resetPassword.passwordMinLength'));
      return false;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError(t('resetPassword.passwordMismatch'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resetData = {
        email: formData.email,
        reset_code: formData.reset_code,
        new_password: formData.new_password,
      };

      const response = await authApi.resetPassword(resetData);
      console.log('Reset password response:', response);

      if (response.status >= 200 && response.status < 300) {
        setSuccess(true);

        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', {
            state: { message: t('resetPassword.loginSuccessMessage') },
          });
        }, 3000);
      } else {
        throw new Error(t('resetPassword.failedToReset'));
      }
    } catch (err) {
      console.error('Reset password error:', err);

      let errorMessage = t('resetPassword.genericError');

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

  const resetForm = () => {
    setFormData({
      email: emailFromState,
      reset_code: '',
      new_password: '',
      confirm_password: '',
    });
    setError('');
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm overflow-hidden border border-purple-100 dark:border-gray-700 relative transition-colors duration-300">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-4 start-4 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors z-10"
          disabled={loading}
        >
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
        </button>

        <div className="p-6">
          {/* Success State */}
          {success ? (
            <div className="text-center animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 text-green-600 dark:text-green-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t('resetPassword.successTitle')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                {t('resetPassword.successMessage')}
              </p>
              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg">
                  {t('resetPassword.redirectingInfo')}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{t('resetPassword.redirectingToLogin')}</span>
                </div>
                <button
                  onClick={handleBack}
                  className="w-full px-4 py-2.5 border border-purple-200 dark:border-gray-600 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  {t('resetPassword.goToLoginNow')}
                </button>
              </div>
            </div>
          ) : (
            /* Reset Password Form */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4 text-purple-600 dark:text-purple-400">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t('resetPassword.title')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                {t('resetPassword.subtitle')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-start">
                {error && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm animate-in slide-in-from-top duration-200 flex items-start gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    {t('resetPassword.emailLabel')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all disabled:opacity-50 text-sm"
                    placeholder={t('resetPassword.emailPlaceholder')}
                    required
                    disabled={loading || !!emailFromState}
                  />
                </div>

                {/* Reset Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    {t('resetPassword.resetCodeLabel')}
                  </label>
                  <input
                    type="text"
                    name="reset_code"
                    value={formData.reset_code}
                    onChange={handleInputChange}
                    maxLength="6"
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all disabled:opacity-50 text-center text-xl tracking-widest"
                    placeholder={t('resetPassword.resetCodePlaceholder')}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password Fields - Same Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                      {t('resetPassword.newPasswordLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="new_password"
                        value={formData.new_password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all disabled:opacity-50 pe-10 text-sm"
                        placeholder={t('resetPassword.passwordPlaceholder')}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                      {t('resetPassword.confirmPasswordLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all disabled:opacity-50 pe-10 text-sm"
                        placeholder={t('resetPassword.passwordPlaceholder')}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full purple-gradient text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('resetPassword.resettingPassword')}
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {t('resetPassword.resetPasswordButton')}
                    </>
                  )}
                </button>

                <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('resetPassword.noResetCode')}{' '}
                    <Link
                      to="/forgot-password"
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                    >
                      {t('resetPassword.requestResetCode')}
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {t('resetPassword.rememberPassword')}{' '}
                    <Link
                      to="/login"
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                    >
                      {t('resetPassword.backToLogin')}
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

export default ResetPassword;
