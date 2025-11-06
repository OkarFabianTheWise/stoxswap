import ResetPassword from "./components/ResetPassword";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import Trending from "./components/Trending";
import WalletContextProvider from "./components/Wallet";
import WalletSidebar from "./components/WalletSidebar";
import { WalletSidebarProvider } from "./context/WalletSidebarContext";
import List from "./components/List-token";
import BuyPage from "./components/BuyPage";
import Login from "./Login";
import Signup from "./Signup";
import NotFoundPage from "./components/404page";
import { AuthProvider } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";
import Profile from "./components/Profile";
import ForgotPassword from "./components/ForgotPassword";
import KYCVerification from "./components/KYCVerification";
import TermsOfService from "./components/TermsOfService";
import TermsConsentPopup from "./components/TermsConsentPopup";
import JupSwapInitializer from "./pages/JupAgSwap";
import NotificationDemo from "./components/NotificationDemo";
import NotificationsPage from "./pages/NotificationsPage";
import TransactionsPage from "./components/TransactionsPage";
import InitializeAdmin from "./components/InitializeAdmin";
import ICMWidget from "./components/ICMWidget";
import BaseSwap from "./components/BaseSwap";

// Admin components
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import Analytics from "./components/admin/Analytics";
import UserManagement from "./components/admin/UserManagement";
import TransactionManagement from "./components/admin/TransactionManagement";
import TransactionVerifier from "./components/admin/TransactionVerifier";
import KYCManagement from "./components/admin/KYCManagement";
import TokenManagement from "./components/admin/TokenManagement";
import ActivityLogs from "./components/admin/ActivityLogs";
import AdminSettings from "./components/admin/AdminSettings";
import AdminUsers from "./components/admin/AdminUsers";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import Landing from "./Ui/landing";

const App: React.FC = () => {
  const handleTermsAccept = () => {
    console.log("Terms accepted");
  };
  return (
    <Router>
      {/* Wrap with AuthProvider inside Router since it uses useNavigate */}
      <NotificationProvider>
        <AuthProvider>
          <AdminProvider>
            {/* Wrap the App with WalletContextProvider to provide a wallet state */}
            <WalletContextProvider>
              <WalletSidebarProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/terms-of-service"
                    element={<TermsOfService />}
                  />
                  <Route
                    path="/initialize-admin"
                    element={<InitializeAdmin />}
                  />
                  {/* Protected routes - require authentication */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<ProtectedLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/trending" element={<Trending />} />
                      <Route path="/buy" element={<BuyPage />} />
                      <Route path="/swap" element={<JupSwapInitializer />} />
                      <Route path="/stox" element={<BaseSwap />} />
                      <Route path="/list-token" element={<List />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route
                        path="/transactions"
                        element={<TransactionsPage />}
                      />
                      <Route
                        path="/notifications"
                        element={<NotificationsPage />}
                      />
                      <Route
                        path="/notification-demo"
                        element={<NotificationDemo />}
                      />
                      <Route
                        path="/kyc-verification"
                        element={<KYCVerification />}
                      />
                      <Route path="/icm" element={<ICMWidget />} />
                    </Route>
                  </Route>
                  {/* Admin routes - require admin authentication */}
                  <Route element={<AdminProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/analytics" element={<Analytics />} />
                      <Route path="/admin/users" element={<UserManagement />} />
                      <Route
                        path="/admin/transactions"
                        element={<TransactionManagement />}
                      />
                      <Route
                        path="/admin/verifier"
                        element={<TransactionVerifier />}
                      />
                      <Route path="/admin/kyc" element={<KYCManagement />} />
                      <Route
                        path="/admin/tokens"
                        element={<TokenManagement />}
                      />
                      <Route path="/admin/logs" element={<ActivityLogs />} />
                      <Route
                        path="/admin/admin-users"
                        element={<AdminUsers />}
                      />
                      <Route
                        path="/admin/settings"
                        element={<AdminSettings />}
                      />
                    </Route>
                  </Route>
                  {/* Catch-all route for 404 page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>

                {/* Wallet Sidebar - available globally */}
                <WalletSidebar />
              </WalletSidebarProvider>
            </WalletContextProvider>
          </AdminProvider>
        </AuthProvider>
      </NotificationProvider>
      <TermsConsentPopup onAccept={handleTermsAccept} />
    </Router>
  );
};
export default App;
