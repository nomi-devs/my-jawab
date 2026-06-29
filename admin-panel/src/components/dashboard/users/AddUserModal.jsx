// src/components/dashboard/users/AddUserModal.jsx
import React, { useState } from 'react';
import { X, UserPlus, Mail, User, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react';

const AddUserModal = ({ isOpen, onClose, onAddUser }) => {
  const [formData, setFormData] = useState({
    email: '',
    handle: '',
    password: '',
    role: 'user',
    status: 'Active',
    is_verified: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onAddUser(formData);
      // If onAddUser doesn't throw, close modal
      resetForm();
      onClose();
    } catch (err) {
      // Error is handled by parent component
      console.error('Error adding user:', err);
      // Don't close modal on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      handle: '',
      password: '',
      role: 'user',
      status: 'Active',
      is_verified: false
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Fixed Modal Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserPlus className="text-purple-600 dark:text-purple-400" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors">Add New User</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Fill in the user details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form id="add-user-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarGutter: 'stable' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <Mail size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>Email Address *</span>
                  </div>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <User size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>Username *</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="handle"
                  value={formData.handle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  placeholder="username"
                  disabled={isSubmitting}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <Shield size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>Password * (min 6 characters)</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    placeholder="Enter password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role and Status - Side by side */}
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
                  disabled={isSubmitting}
                >
                  <option value="user">User</option>
                  <option value="pro_user">Pro User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

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
                    disabled={isSubmitting}
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Verified Account */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  Verified Account
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
                        is_verified: e.target.checked
                      }))
                    }
                    className="sr-only peer"
                    disabled={isSubmitting}
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Fixed Modal Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-user-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg transition-all text-xs font-semibold shadow-md active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Add User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
};

export default React.memo(AddUserModal);