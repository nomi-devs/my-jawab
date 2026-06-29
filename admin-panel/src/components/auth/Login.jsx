// src/components/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import authApi from "../../api/authApi";
import BRANDING from "../../constants/branding";
import BrandLogo from "../common/BrandLogo";

const Login = ({ onLogin, onForgotPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = { "identifier": email, "password": password };
      const res = await authApi.login(data);

      // Assuming backend returns { access_token: "xxxx", user: {...} }
      const token = res.data.access_token;

      if (!token) {
        setError("Token not returned from backend");
        setLoading(false);
        return;
      }

      // Choose storage based on "Remember Me" checkbox
      // If checked: use localStorage (persists after browser close)
      // If unchecked: use sessionStorage (cleared when browser closes)
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Save token to appropriate storage
      storage.setItem("token", token);
      
      // Optionally save user info if returned
      if (res.data.user) {
        storage.setItem("username", res.data.user.username || res.data.user.email);
        storage.setItem("email", res.data.user.email || email);
        storage.setItem("role", res.data.user.role || "admin");
        storage.setItem("is_active", res.data.user.is_active !== false ? "true" : "false");
        storage.setItem("is_verified", res.data.user.is_verified !== false ? "true" : "false");
      } else {
        storage.setItem("username", email.split('@')[0]);
        storage.setItem("email", email);
        storage.setItem("role", "admin");
        storage.setItem("is_active", "true");
        storage.setItem("is_verified", "true");
      }
      
      // Clear the opposite storage to avoid conflicts
      if (rememberMe) {
        // If using localStorage, clear sessionStorage
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("is_active");
        sessionStorage.removeItem("is_verified");
      } else {
        // If using sessionStorage, clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        localStorage.removeItem("is_active");
        localStorage.removeItem("is_verified");
      }

      // Call parent's onLogin handler to update authentication state
      if (onLogin) {
        onLogin();
      }
      
      // Navigate to dashboard
      navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error("Login error:", err);
      // Show more specific error message if available
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Invalid email or password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm overflow-hidden border border-purple-100 dark:border-gray-700 transition-colors duration-300">

        {/* Header */}
        <div className="purple-gradient p-5 text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center overflow-hidden">
              <img 
                src={BRANDING.logo.main} 
                alt={BRANDING.name}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">{BRANDING.name}</h2>
          <p className="text-purple-100 mt-1 text-sm">Welcome back, Admin</p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm animate-fade-in transition-colors">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all disabled:opacity-50 text-sm"
                placeholder="admin@social.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                Password
              </label>
              <div className="relative">
              <input
                  type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all disabled:opacity-50 text-sm"
                placeholder="••••••••"
                required
                disabled={loading}
              />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 dark:text-purple-400 rounded focus:ring-purple-500 dark:focus:ring-purple-400"
                  disabled={loading}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full purple-gradient text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : "Sign In"}
            </button>

            <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                  onClick={() => navigate("/reset")}
                >
                  Contact Administrator
                </button>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;