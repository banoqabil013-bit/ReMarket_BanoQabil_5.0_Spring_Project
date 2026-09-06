import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import ChangePassword from "../pages/ChangePassword";
import Ads from "../pages/ads/Ads";
import AdDetails from "../pages/ads/AdDetails";
import CreateAd from "../pages/ads/CreateAd";
import EditAd from "../pages/ads/EditAd";
import MyAds from "../pages/ads/MyAds";
import AdminAds from "../pages/admin/AdminAds";
import AdminUsers from "../pages/admin/AdminUsers";

import { isTokenValid, isAdmin } from "../utils/auth";
import { getProfile } from "../services/userService";

/* Only redirect logged-in users away from login/signup */
const PublicOnlyRoute = ({ children }) => {
  const authenticated = isTokenValid();
  if (authenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

/* Block unauthenticated access */
const ProtectedRoute = ({ children }) => {
  const authenticated = isTokenValid();
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const authenticated = isTokenValid();
  if (!authenticated) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  useEffect(() => {
    if (isTokenValid()) {
      getProfile()
        .then((userData) => {
          if (userData && userData.email) {
            localStorage.setItem("user", JSON.stringify({
              id: userData._id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              city: userData.city,
              role: userData.role,
            }));
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Public Home ─── */}
        <Route path="/" element={<Home />} />

        {/* ─── Auth (redirect away if already logged in) ─── */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />

        {/* ─── Public Ads (browsable without login) ─── */}
        <Route path="/ads" element={<Ads />} />
        <Route path="/ads/:id" element={<AdDetails />} />

        {/* ─── Protected Routes ─── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ads/create"
          element={
            <ProtectedRoute>
              <CreateAd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-ads"
          element={
            <ProtectedRoute>
              <MyAds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ads/:id/edit"
          element={
            <ProtectedRoute>
              <EditAd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ads"
          element={
            <AdminRoute>
              <AdminAds />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />

        {/* ─── 404 fallback ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
