// src/components/dashboard/profile/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Lock,
  Save,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  MapPin,
  Link as LinkIcon,
} from 'lucide-react';
import { useProfile, useProfileActions } from '../../../hooks/useProfile';
import AlertModal from '../../common/AlertModal';

const ProfileSettings = () => {
  const { t } = useTranslation('profile');
  // Helper function to get today's date in YYYY-MM-DD format (max date for birthday)
  const getMaxDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    role: '',
    is_active: true,
    is_verified: true,
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    tagline: '',
    profile_bio: '',
    profile_gender: '',
    profile_birthday: '',
    profile_website: '',
    profile_location: '',
    profile_picture: null,
    profile_background: null,
  });
  const [profilePreview, setProfilePreview] = useState({
    profile_picture: '',
    profile_background: '',
  });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const { data: profileDataFetched, isLoading: isLoadingProfile } = useProfile();

  const { updateProfile, changePassword, isUpdatingProfile, isChangingPassword } =
    useProfileActions();

  // Load user info from localStorage or sessionStorage
  useEffect(() => {
    // Check both localStorage and sessionStorage for user data
    const username = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
    const email = localStorage.getItem('email') || sessionStorage.getItem('email') || '';
    const role = localStorage.getItem('role') || sessionStorage.getItem('role') || 'admin';
    const is_active =
      (localStorage.getItem('is_active') || sessionStorage.getItem('is_active')) !== 'false';
    const is_verified =
      (localStorage.getItem('is_verified') || sessionStorage.getItem('is_verified')) !== 'false';

    setUserInfo({
      username,
      email,
      role,
      is_active,
      is_verified,
    });
  }, []);

  // Update form data when profile fetch completes
  useEffect(() => {
    if (profileDataFetched) {
      setProfileData((prev) => ({
        ...prev,
        full_name: profileDataFetched.full_name || '',
        tagline: profileDataFetched.tagline || '',
        profile_bio: profileDataFetched.profile_bio || '',
        profile_gender: profileDataFetched.profile_gender || '',
        profile_birthday: profileDataFetched.profile_birthday
          ? profileDataFetched.profile_birthday.substring(0, 10)
          : '',
        profile_website: profileDataFetched.profile_website || '',
        profile_location: profileDataFetched.profile_location || '',
      }));
      setProfilePreview({
        profile_picture: profileDataFetched.profile_picture || '',
        profile_background: profileDataFetched.profile_background || '',
      });
    }
  }, [profileDataFetched]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileFileChange = (e) => {
    const { name, files } = e.target;
    const file = files && files[0];
    if (!file) return;

    setProfileData((prev) => ({
      ...prev,
      [name]: file,
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview((prev) => ({
        ...prev,
        [name]: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmittingProfile(true);

    try {
      const formData = new FormData();

      // Only append fields that have actual values (not empty strings)
      if (profileData.full_name && profileData.full_name.trim()) {
        formData.append('full_name', profileData.full_name.trim());
      }
      if (profileData.tagline && profileData.tagline.trim()) {
        formData.append('tagline', profileData.tagline.trim());
      }
      if (profileData.profile_bio && profileData.profile_bio.trim()) {
        formData.append('profile_bio', profileData.profile_bio.trim());
      }
      if (profileData.profile_gender) {
        formData.append('profile_gender', profileData.profile_gender);
      }
      if (profileData.profile_birthday) {
        formData.append('profile_birthday', profileData.profile_birthday);
      }
      if (profileData.profile_website && profileData.profile_website.trim()) {
        formData.append('profile_website', profileData.profile_website.trim());
      }
      if (profileData.profile_location && profileData.profile_location.trim()) {
        formData.append('profile_location', profileData.profile_location.trim());
      }

      // Only append files if they are File objects (new uploads)
      // Backend uses FilesInterceptor('files', 2) which expects files with fieldname 'files'
      // IMPORTANT: Send profile_picture first, then profile_background
      // If only background is uploaded, send a flag to identify it
      if (profileData.profile_picture instanceof File) {
        formData.append('files', profileData.profile_picture);
      }
      if (profileData.profile_background instanceof File) {
        formData.append('files', profileData.profile_background);
        // If only background is being uploaded (no profile_picture), send a flag
        if (!(profileData.profile_picture instanceof File)) {
          formData.append('upload_profile_background', 'true');
        }
      }

      await updateProfile(formData);
      setSuccessMessage(t('profileUpdatedSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || t('profileUpdateFailed');
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    if (
      !passwordData.old_password ||
      !passwordData.new_password ||
      !passwordData.confirm_password
    ) {
      setError(t('allPasswordFieldsRequired'));
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError(t('passwordMinLengthError'));
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (passwordData.old_password === passwordData.new_password) {
      setError(t('passwordMustDiffer'));
      return;
    }

    setIsSubmittingPassword(true);

    try {
      await changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });

      setSuccessMessage(t('passwordChangedSuccess'));
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || t('passwordChangeFailed');
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <>
      {/* Success Alert Modal */}
      <AlertModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        type="success"
        title={t('common:success')}
        message={successMessage}
      />

      {/* Error Alert Modal */}
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title={t('common:error')}
        message={error}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <User className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 transition-colors">
                {t('pageTitle')}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 transition-colors">
                {t('pageSubtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
              <User size={16} className="text-purple-500 dark:text-purple-400" />
              {t('accountInformation')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  {t('username')}
                </label>
                <input
                  type="text"
                  value={userInfo.username}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed transition-colors text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('usernameHint')}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  {t('common:email')}
                </label>
                <input
                  type="email"
                  value={userInfo.email || t('emailNotAvailable')}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed transition-colors text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('emailHint')}
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  {t('role')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={
                      userInfo.role
                        ? userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)
                        : t('defaultRole')
                    }
                    disabled
                    className="flex-1 px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed transition-colors text-sm"
                  />
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="text-purple-600 dark:text-purple-400" size={16} />
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  {t('accountStatus')}
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {userInfo.is_active ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        <CheckCircle size={14} className="me-1" />
                        {t('common:active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        <XCircle size={14} className="me-1" />
                        {t('common:inactive')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {userInfo.is_verified ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        <CheckCircle size={14} className="me-1" />
                        {t('verified')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                        <XCircle size={14} className="me-1" />
                        {t('unverified')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="pt-6 border-t border-purple-100 dark:border-gray-700">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                <User size={16} className="text-purple-500 dark:text-purple-400" />
                {t('profileInformation')}
              </h3>

              {/* Profile images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('profilePicture')}
                  </label>
                  {profilePreview.profile_picture && (
                    <div className="mb-2">
                      <img
                        src={profilePreview.profile_picture}
                        alt={t('profilePreviewAlt')}
                        className="w-16 h-16 rounded-full object-cover border border-purple-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                      <ImageIcon size={14} className="me-1" />
                      {t('upload')}
                      <input
                        type="file"
                        name="profile_picture"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileFileChange}
                        disabled={isSubmittingProfile}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('profilePictureHint')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('profileBackground')}
                  </label>
                  {profilePreview.profile_background && (
                    <div className="mb-2">
                      <img
                        src={profilePreview.profile_background}
                        alt={t('backgroundPreviewAlt')}
                        className="w-full h-20 rounded-lg object-cover border border-purple-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                      <ImageIcon size={14} className="me-1" />
                      {t('upload')}
                      <input
                        type="file"
                        name="profile_background"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileFileChange}
                        disabled={isSubmittingProfile}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('profileBackgroundHint')}
                  </p>
                </div>
              </div>

              {/* Profile text fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                    placeholder={t('fullNamePlaceholder')}
                    disabled={isSubmittingProfile}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('tagline')}
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={profileData.tagline}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                    placeholder={t('taglinePlaceholder')}
                    disabled={isSubmittingProfile}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('website')}
                  </label>
                  <div className="flex items-center gap-2">
                    <LinkIcon size={14} className="text-gray-400 dark:text-gray-500" />
                    <input
                      type="url"
                      name="profile_website"
                      value={profileData.profile_website}
                      onChange={handleProfileInputChange}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                      placeholder={t('websitePlaceholder')}
                      disabled={isSubmittingProfile}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('location')}
                  </label>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="profile_location"
                      value={profileData.profile_location}
                      onChange={handleProfileInputChange}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                      placeholder={t('locationPlaceholder')}
                      disabled={isSubmittingProfile}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('birthday')}
                  </label>
                  <input
                    type="date"
                    name="profile_birthday"
                    value={profileData.profile_birthday}
                    onChange={handleProfileInputChange}
                    max={getMaxDate()}
                    className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                    disabled={isSubmittingProfile}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('gender')}
                  </label>
                  <select
                    name="profile_gender"
                    value={profileData.profile_gender || ''}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                    disabled={isSubmittingProfile}
                  >
                    <option value="">{t('selectGender')}</option>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  {t('bio')}
                </label>
                <textarea
                  name="profile_bio"
                  value={profileData.profile_bio}
                  onChange={handleProfileInputChange}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm resize-none"
                  placeholder={t('bioPlaceholder')}
                  disabled={isSubmittingProfile}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmittingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('saving')}</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{t('saveProfile')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="pt-6 border-t border-purple-100 dark:border-gray-700">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                <Lock size={16} className="text-purple-500 dark:text-purple-400" />
                {t('changePassword')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Password */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('currentPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      name="old_password"
                      value={passwordData.old_password}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-2.5 pe-10 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                      placeholder={t('currentPasswordPlaceholder')}
                      disabled={isSubmittingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 pe-10 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                      placeholder={t('newPasswordPlaceholder')}
                      disabled={isSubmittingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('minimumCharacters')}
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 pe-10 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                      placeholder={t('confirmPasswordPlaceholder')}
                      disabled={isSubmittingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmittingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('changing')}</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{t('changePassword')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSettings;
