import React from "react";
import { FiLogOut } from "react-icons/fi";
import { MdOutlineEnergySavingsLeaf } from "react-icons/md";
import useAuth from "../hooks/useAuth";

export const Navbar = ({ onOpenDrawer }) => {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-samsung-cardBorder bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo & Brand Details */}
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-samsung-blue text-white shadow-samsung-card">
              <MdOutlineEnergySavingsLeaf className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-samsung-dark">SmartThings</span>
                <span className="hidden rounded-full bg-samsung-blue/10 px-2.5 py-0.5 text-xs font-semibold text-samsung-blue sm:inline-block">
                  AI Energy
                </span>
              </div>
              <p className="hidden text-[10px] text-samsung-grayText sm:block">Samsung Smart Home Assistant</p>
            </div>
          </div>

          {/* User Details & Actions */}
          {currentUser && (
            <div className="flex items-center space-x-4">

              {/* Profile Avatar & Details */}
              <button 
                onClick={onOpenDrawer}
                className="group flex items-center space-x-3 rounded-full p-1.5 pr-3 transition-all hover:bg-samsung-lightBlue focus:outline-none focus:ring-2 focus:ring-samsung-blue/20"
                title="Open Profile Settings"
              >
                <img
                  className="h-8 w-8 rounded-full border border-samsung-cardBorder object-cover shadow-sm transition-transform group-hover:scale-105"
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200";
                  }}
                />
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-samsung-dark group-hover:text-samsung-blue transition-colors">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-samsung-grayText">
                    {currentUser.houseName || "Smart Home"}
                  </p>
                </div>
              </button>

              {/* Vertical divider */}
              <div className="h-6 w-px bg-samsung-cardBorder"></div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-samsung-grayText hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                title="Log Out"
              >
                <FiLogOut className="h-5 w-5" />
              </button>

            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
