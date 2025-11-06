import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiTrendingUp,
  FiShoppingBag,
  FiRepeat,
  FiList,
  FiUser,
  FiShield,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronRight,
  FiLink,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import LogoWhite from "./assets/@images/logo-white.png";
// import { useWalletSidebar } from '../context/WalletSidebarContext';

interface NavItemProps {
  icon: React.ReactNode;
  to: string;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  to,
  label,
  isActive,
  isCollapsed,
}) => {
  return (
    <Link to={to} className="w-full mb-2 block group">
      <div
        className={`
          relative flex items-center px-5 py-3 
          ${isCollapsed ? "justify-center" : "justify-between"}
          ${isActive ? "text-white" : "text-gray-400 hover:text-gray-200"}
          transition-all duration-200 ease-in-out
        `}
      >
        <div className="flex items-center">
          <div
            className={`
            relative z-20 text-xl 
            ${isActive ? "text-white font-bold" : "group-hover:text-white"}
            transition-colors duration-200
          `}
          >
            {icon}
          </div>

          {!isCollapsed && (
            <span
              className={`
              ml-4 font-medium text-sm tracking-wide z-20 relative
              ${isActive ? "text-white font-bold" : "group-hover:text-white"}
              transition-colors duration-200
            `}
            >
              {label}
            </span>
          )}
        </div>

        {!isCollapsed && isActive && (
          <div className="text-white z-20 relative opacity-100 transition-opacity duration-200">
            <FiChevronRight size={16} />
          </div>
        )}

        {/* Background element */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-r z-10
            ${
              isActive
                ? "from-cyan-500 to-blue-600 opacity-100"
                : "from-gray-700/0 to-gray-700/0 opacity-0 group-hover:opacity-50 group-hover:from-cyan-800/30 group-hover:to-blue-800/30"
            }
            rounded-xl transition-all duration-200 ease-out
          `}
        />
      </div>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();
  // const { /* openWalletSidebar */ } = useWalletSidebar();

  // Use ref to track user-initiated collapse
  const userCollapsedRef = useRef(false);

  useEffect(() => {
    // Function to handle sidebar width change event dispatching
    const dispatchSidebarResize = () => {
      const width = isCollapsed ? 70 : 240;
      const event = new CustomEvent("sidebarResize", { detail: { width } });
      window.dispatchEvent(event);
    };

    // Function to check if mobile view
    const checkMobile = () => window.innerWidth < 768;

    // Function to handle window resize
    const handleResize = () => {
      const mobile = checkMobile();

      // Update mobile state
      setIsMobile(mobile);

      // Auto-collapse on mobile, but only if the user hasn't manually toggled
      if (mobile && !userCollapsedRef.current) {
        setIsCollapsed(true);
      } else if (!mobile && userCollapsedRef.current) {
        // Reset user preference when moving to desktop if they previously
        // collapsed the sidebar manually
        userCollapsedRef.current = false;
      }
    };

    // Handle toggle event from header button
    const handleToggleSidebar = () => {
      userCollapsedRef.current = true; // Mark as user toggled
      toggleSidebar();
    };

    // Initial setup
    handleResize();
    dispatchSidebarResize();

    // Add event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("toggleSidebar", handleToggleSidebar);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("toggleSidebar", handleToggleSidebar);
    };
  }, [isCollapsed]);
  const navItems = [
    { icon: <FiHome />, to: "/dashboard", label: "Dashboard" },
    { icon: <FiTrendingUp />, to: "/trending", label: "Trending" },
    { icon: <FiShoppingBag />, to: "/buy", label: "Buy" },
    { icon: <FiRepeat />, to: "/swap", label: "Jupiter Swap" },
    { icon: <FiRepeat />, to: "/stox", label: "STOX" },
    { icon: <FiList />, to: "/list-token", label: "List Token" },
    { icon: <FiLink />, to: "/icm", label: "Colab Trade" },
    { icon: <FiUser />, to: "/profile", label: "Profile" },
    { icon: <FiShield />, to: "/kyc-verification", label: "KYC Verification" },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarWidth = isCollapsed ? "70px" : "240px";
  const sidebarTransform =
    isMobile && isCollapsed ? "translateX(-100%)" : "translateX(0)";

  return (
    <div
      className="h-screen bg-gray-900 shadow-xl fixed top-0 left-0 z-40 flex flex-col backdrop-blur-lg overflow-hidden"
      style={{
        width: sidebarWidth,
        transform: sidebarTransform,
        transition: "width 0.25s ease, transform 0.25s ease",
        backgroundImage:
          "radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent 70%)",
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div
          className={`flex ${isCollapsed ? "justify-center w-full" : "items-center"}`}
        >
          {!isCollapsed && (
            <>
              <img src={LogoWhite} alt="FiatRouter Logo" className="h-8" />
              <span
                className="text-xl font-bold text-white ml-2"
                style={{ transition: "opacity 0.3s", opacity: 1 }}
              >
                FiatRouter
              </span>
            </>
          )}
        </div>

        {/* Only show toggle when not in mobile view or when sidebar is expanded */}
        {(!isMobile || !isCollapsed) && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300"
          >
            {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
          </button>
        )}
      </div>
      <div className="mt-6 px-3 relative z-10">
        <div
          className={`text-xs uppercase text-gray-500 font-medium mb-3 ml-2 transition-opacity duration-200`}
          style={{ opacity: isCollapsed ? 0 : 1 }}
        >
          Navigation
        </div>

        <div className="space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              icon={item.icon}
              to={item.to}
              label={item.label}
              isActive={location.pathname === item.to}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto mb-6 px-3 relative z-10">
        {!isCollapsed && (
          <div
            className="mb-4 rounded-xl bg-gray-800/30 backdrop-blur-sm p-3 border border-white/5"
            style={{ transition: "opacity 0.3s", opacity: isCollapsed ? 0 : 1 }}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white">
                {user?.name?.charAt(0) || <FiUser size={16} />}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-400 mb-2">
              KYC Status:{" "}
              <span
                className={
                  user?.kycVerifiedAt ? "text-green-400" : "text-red-400"
                }
              >
                {user?.kycVerifiedAt ? "Verified" : "Not Verified"}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`
            w-full rounded-xl 
            flex items-center ${isCollapsed ? "justify-center" : "justify-start"} 
            px-4 py-3 ${!isCollapsed ? "space-x-3" : ""}
            bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-red-950/30 hover:to-red-900/30
            text-gray-400 hover:text-red-400
            border border-white/5 hover:border-red-500/20
            transition-all duration-300
          `}
        >
          <FiLogOut size={isCollapsed ? 20 : 16} />
          {!isCollapsed && (
            <span className="text-sm font-medium ml-3">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
