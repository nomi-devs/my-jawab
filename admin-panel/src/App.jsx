// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { BASE_PATH, BASE_URL } from "./config/app";
import Login from "./components/auth/Login";
import ResetPassword from "./components/auth/ResetPassword";
import Sidebar from "./components/dashboard/layout/Sidebar";
import Header from "./components/dashboard/layout/Header";
import DashboardOverview from "./components/dashboard/overview/DashboardOverview";
import UsersTable from "./components/dashboard/users/UsersTable";
import PostsList from "./components/dashboard/posts/PostsList";
import CommentsView from "./components/dashboard/comments/CommentsView";
import TopicsPage from "./components/dashboard/topics/TopicsPage";
import SubTopicsPage from "./components/dashboard/topics/SubTopicsPage";
import ForgotPassword from "./components/auth/ForgotPassword";
import CommunitiesPage from "./components/dashboard/communities/CommunitiesPage";
import PollsPage from "./components/dashboard/polls/PollsPage";
import SubscriptionsPage from "./components/dashboard/subscriptions/SubscriptionsPage";
import PaymentsPage from "./components/dashboard/payments/PaymentsPage";
import ProfileSettings from "./components/dashboard/profile/ProfileSettings";
import NotificationsPage from "./components/dashboard/notifications/NotificationsPage";
import CurrenciesPage from "./components/dashboard/settings/CurrenciesPage";
import AppSettingsPage from "./components/dashboard/settings/AppSettingsPage";
import PrivacyPolicyPage from "./components/dashboard/privacy-policy/PrivacyPolicyPage";
import SupportPage from "./components/dashboard/support/SupportPage";
import BannersPage from "./components/dashboard/banners/BannersPage";
import DeletedUsersPage from "./components/dashboard/users-deleted/DeletedUsersPage";

// Dashboard Layout Component
const DashboardLayout = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50/50 via-white to-purple-100/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans transition-colors duration-300">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-5 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="max-w-7xl mx-auto">
            <Outlet /> {/* This renders the matched child route */}
          </div>
        </main>
      </div>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication - check both localStorage and sessionStorage
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-gray-700 border-t-purple-600 dark:border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Wrapper (for login/register pages)
const PublicRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication - check both localStorage and sessionStorage
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-gray-700 border-t-purple-600 dark:border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
    const basePath = BASE_PATH;
    const baseUrl = BASE_URL;

  // Check initial authentication state
  useEffect(() => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      // Clear both localStorage and sessionStorage
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("is_active");
      localStorage.removeItem("is_verified");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("email");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("is_active");
      sessionStorage.removeItem("is_verified");

      // Update state
      setIsAuthenticated(false);

      // Redirect to login
      window.location.href = `${baseUrl}/login`;
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleForgotPassword = () => {
    // Navigate to reset password page
    window.location.href = `${baseUrl}/forgot`;
  };

  return (
    <DarkModeProvider>
      <Router basename={basePath}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login onLogin={handleLogin} onForgotPassword={handleForgotPassword} />
              </PublicRoute>
            }
          />

          <Route
            path="/forgot"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />


          {/* Protected Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout onLogout={handleLogout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />

            <Route path="users" element={<UsersTable />} />
            <Route path="users/deleted" element={<DeletedUsersPage />} />
            <Route path="posts" element={<PostsList />} />
            <Route path="communities" element={<CommunitiesPage />} />
            <Route path="topics" element={<TopicsPage />} />
            <Route path="sub-topics" element={<SubTopicsPage />} />
            <Route path="comments" element={<CommentsView />} />
            <Route path="polls" element={<PollsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="currencies" element={<CurrenciesPage />} />
            <Route path="settings" element={<AppSettingsPage />} />
            <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="notifications" element={<NotificationsPage />} />


            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch all other routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
};

export default App;