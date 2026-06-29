// src/components/dashboard/users/EditUserModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Save, Image, Globe, MapPin, Calendar, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import userApi from '../../../api/userApi';

const EditUserModal = React.memo(({
  isOpen,
  onClose,
  user,
  onSave
}) => {
  // Helper function to get today's date in YYYY-MM-DD format (max date for birthday)
  const getMaxDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    // User fields
    email: '',
    handle: '',
    role: 'user',
    status: 'Active',
    is_verified: false,
    // Profile fields
    full_name: '',
    profile_picture: '',
    profile_background: '',
    tagline: '',
    profile_bio: '',
    profile_gender: '',
    profile_birthday: '',
    profile_website: '',
    profile_location: ''
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profileBackgroundFile, setProfileBackgroundFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [profileBackgroundPreview, setProfileBackgroundPreview] = useState(null);
  const [fileErrors, setFileErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Allowed image types
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Initialize form with fresh user data when modal opens
  useEffect(() => {
    const fetchFreshUserData = async () => {
      if (isOpen && user?.id) {
        try {
          setInitialLoading(true);
          setFetchError(null);

          const response = await userApi.getUser(user.id);
          const freshUser = response.data;
          const profile = freshUser.profile || {};

          // Map user data to form format
          setFormData({
            email: freshUser.email || '',
            handle: freshUser.username || '',
            role: freshUser.role || 'user',
            status: freshUser.is_active ? 'Active' : 'Inactive',
            is_verified: freshUser.is_verified || false,
            // Profile fields
            full_name: profile.full_name || '',
            profile_picture: profile.profile_picture || '',
            profile_background: profile.profile_background || '',
            tagline: profile.tagline || '',
            profile_bio: profile.profile_bio || '',
            profile_gender: profile.profile_gender || '',
            profile_birthday: profile.profile_birthday ? profile.profile_birthday.split('T')[0] : '',
            profile_website: profile.profile_website || '',
            profile_location: profile.profile_location || ''
          });

          // Set previews for existing images
          setProfilePicturePreview(profile.profile_picture || null);
          setProfileBackgroundPreview(profile.profile_background || null);

          // Reset file selections
          setProfilePictureFile(null);
          setProfileBackgroundFile(null);
          setFileErrors({});
        } catch (err) {
          console.error('Error fetching user data for edit:', err);
          setFetchError('Failed to fetch the latest user information');

          // Fallback to provided prop data if API fails
          const profile = user.raw?.profile || {};
          setFormData({
            email: user.email || '',
            handle: user.handle || user.raw?.username || '',
            role: user.role || 'user',
            status: user.status || (user.is_active ? 'Active' : 'Inactive'),
            is_verified: user.is_verified || false,
            full_name: profile.full_name || '',
            profile_picture: profile.profile_picture || '',
            profile_background: profile.profile_background || '',
            tagline: profile.tagline || '',
            profile_bio: profile.profile_bio || '',
            profile_gender: profile.profile_gender || '',
            profile_birthday: profile.profile_birthday ? profile.profile_birthday.split('T')[0] : '',
            profile_website: profile.profile_website || '',
            profile_location: profile.profile_location || ''
          });
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchFreshUserData();
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTextareaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFile = (file, fieldName) => {
    const errors = {};

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors[fieldName] = 'Only image files are allowed (JPEG, PNG, GIF, WebP)';
      return errors;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors[fieldName] = 'File size must be less than 10MB';
      return errors;
    }

    return null;
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      setFileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profile_picture;
        return newErrors;
      });
      return;
    }

    const validationError = validateFile(file, 'profile_picture');
    if (validationError) {
      setFileErrors(prev => ({ ...prev, ...validationError }));
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      e.target.value = ''; // Clear the input
      return;
    }

    setProfilePictureFile(file);
    setFileErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.profile_picture;
      return newErrors;
    });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setProfileBackgroundFile(null);
      setProfileBackgroundPreview(null);
      setFileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profile_background;
        return newErrors;
      });
      return;
    }

    const validationError = validateFile(file, 'profile_background');
    if (validationError) {
      setFileErrors(prev => ({ ...prev, ...validationError }));
      setProfileBackgroundFile(null);
      setProfileBackgroundPreview(null);
      e.target.value = ''; // Clear the input
      return;
    }

    setProfileBackgroundFile(file);
    setFileErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.profile_background;
      return newErrors;
    });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileBackgroundPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for file validation errors
    if (Object.keys(fileErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const submitData = new FormData();

      // Add user fields
      if (formData.email) submitData.append('email', formData.email);
      if (formData.role) submitData.append('role', formData.role);
      if (formData.status) submitData.append('is_active', formData.status === 'Active' ? 'active' : 'inactive');
      submitData.append('is_verified', formData.is_verified ? 'verified' : 'unverified');

      // Add profile fields
      // Only send fields that have values (don't send empty strings for URL fields)
      if (formData.full_name !== undefined && formData.full_name.trim() !== '') {
        submitData.append('full_name', formData.full_name);
      }
      if (formData.tagline !== undefined && formData.tagline.trim() !== '') {
        submitData.append('tagline', formData.tagline);
      }
      if (formData.profile_bio !== undefined && formData.profile_bio.trim() !== '') {
        submitData.append('profile_bio', formData.profile_bio);
      }
      if (formData.profile_gender && formData.profile_gender !== '') {
        submitData.append('profile_gender', formData.profile_gender);
      }
      if (formData.profile_birthday && formData.profile_birthday !== '') {
        submitData.append('profile_birthday', formData.profile_birthday);
      }
      // Only send URL fields if they have a valid URL value (not empty string)
      if (formData.profile_website !== undefined && formData.profile_website.trim() !== '') {
        submitData.append('profile_website', formData.profile_website);
      }
      if (formData.profile_location !== undefined && formData.profile_location.trim() !== '') {
        submitData.append('profile_location', formData.profile_location);
      }

      // Note: profile_picture and profile_background URLs are NOT sent when files are uploaded
      // The backend will handle file uploads and generate URLs automatically

      // Add files with proper field names
      // Backend identifies files by order: profile_picture first, then profile_background
      if (profilePictureFile) {
        submitData.append('files', profilePictureFile);
      }
      if (profileBackgroundFile) {
        submitData.append('files', profileBackgroundFile);
      }

      await onSave(user.id, submitData);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error updating user:', err);
      setIsSubmitting(false);
      // Error is handled by parent component
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      handle: '',
      role: 'user',
      status: 'Active',
      is_verified: false,
      full_name: '',
      profile_picture: '',
      profile_background: '',
      tagline: '',
      profile_bio: '',
      profile_gender: '',
      profile_birthday: '',
      profile_website: '',
      profile_location: ''
    });
    setProfilePictureFile(null);
    setProfileBackgroundFile(null);
    setProfilePicturePreview(null);
    setProfileBackgroundPreview(null);
    setFileErrors({});
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Fixed Modal Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-100 dark:border-gray-700">
              <img
                src={user.img}
                alt={user.name || user.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors">Edit User</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Update user information and profile</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form id="edit-user-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden relative">
          {initialLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all animate-in fade-in">
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Fetching latest user data...</p>
              </div>
            </div>
          )}

          {fetchError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              <p className="text-xs font-medium">{fetchError}</p>
              <button
                type="button"
                onClick={() => {
                  setFetchError(null);
                  // Trigger re-fetch logic handled by useEffect
                }}
                className="ml-auto text-[10px] underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className={`flex-1 overflow-y-auto px-6 py-5 ${initialLoading ? 'opacity-40 pointer-events-none' : ''}`} style={{ scrollbarGutter: 'stable' }}>
            {/* User Account Section */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <Mail size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Email Address</span>
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    placeholder="john@example.com"
                    disabled={isSubmitting || initialLoading}
                  />
                </div>

                {/* Username - Read only */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <User size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Username</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="handle"
                    value={formData.handle}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed"
                    placeholder="@username"
                    disabled={true}
                    title="Username cannot be changed through admin API"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <Shield size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Role</span>
                    </div>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    disabled={isSubmitting || initialLoading}
                  >
                    <option value="user">User</option>
                    <option value="pro_user">Pro User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Status and Verified Group */}
                <div className="flex items-end gap-6">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                      Status
                    </label>
                    <label
                      className="relative inline-flex items-center cursor-pointer"
                      title={formData.status === 'Active' ? 'Deactivate user' : 'Activate user'}
                    >
                      <input
                        type="checkbox"
                        checked={formData.status === 'Active'}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.checked ? 'Active' : 'Inactive',
                          }))
                        }
                        className="sr-only peer"
                        disabled={isSubmitting || initialLoading}
                      />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Verified Account */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                      Verified
                    </label>
                    <label
                      className="relative inline-flex items-center cursor-pointer"
                      title={formData.is_verified ? 'Unverify user' : 'Verify user'}
                    >
                      <input
                        type="checkbox"
                        checked={formData.is_verified}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_verified: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                        disabled={isSubmitting || initialLoading}
                      />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="mb-6 pt-4 border-t border-purple-100 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Profile Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <User size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Full Name</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Profile Picture File Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <Image size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Profile Picture</span>
                    </div>
                  </label>
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleProfilePictureChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-400"
                    disabled={isSubmitting}
                  />
                  {fileErrors.profile_picture && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fileErrors.profile_picture}</p>
                  )}
                  {(profilePicturePreview || formData.profile_picture) && (
                    <div className="mt-2">
                      <img
                        src={profilePicturePreview || formData.profile_picture}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-purple-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>

                {/* Profile Background File Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <Image size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Profile Background</span>
                    </div>
                  </label>
                  <input
                    type="file"
                    name="profile_background"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleProfileBackgroundChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-400"
                    disabled={isSubmitting}
                  />
                  {fileErrors.profile_background && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fileErrors.profile_background}</p>
                  )}
                  {(profileBackgroundPreview || formData.profile_background) && (
                    <div className="mt-2">
                      <img
                        src={profileBackgroundPreview || formData.profile_background}
                        alt="Background preview"
                        className="w-full h-24 rounded-lg object-cover border-2 border-purple-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>

                {/* Tagline */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <Briefcase size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Tagline</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    placeholder="Your tagline here"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Profile Bio */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <User size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Bio</span>
                    </div>
                  </label>
                  <textarea
                    name="profile_bio"
                    value={formData.profile_bio}
                    onChange={handleTextareaChange}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all resize-none"
                    placeholder="Tell us about yourself..."
                    disabled={isSubmitting}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    Gender
                  </label>
                  <select
                    name="profile_gender"
                    value={formData.profile_gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Birthday */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <Calendar size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Birthday</span>
                    </div>
                  </label>
                  <input
                    type="date"
                    name="profile_birthday"
                    value={formData.profile_birthday}
                    onChange={handleInputChange}
                    max={getMaxDate()}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <Globe size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Website</span>
                    </div>
                  </label>
                  <input
                    type="url"
                    name="profile_website"
                    value={formData.profile_website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    placeholder="https://example.com"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <MapPin size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Location</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="profile_location"
                    value={formData.profile_location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    placeholder="City, Country"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="pt-4 border-t border-purple-100 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    User ID
                  </label>
                  <div className="px-3 py-2 text-sm rounded-lg bg-purple-50 dark:bg-purple-900/20 text-gray-600 dark:text-gray-300">
                    #{user.id}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Joined Date
                  </label>
                  <div className="px-3 py-2 text-sm rounded-lg bg-purple-50 dark:bg-purple-900/20 text-gray-600 dark:text-gray-300">
                    {user.joined}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-user-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-semibold shadow-md active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

EditUserModal.displayName = 'EditUserModal';
export default EditUserModal;
