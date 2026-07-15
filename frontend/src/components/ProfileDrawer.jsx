import React, { useState, useEffect } from "react";
import { FiX, FiHome, FiMapPin, FiMail, FiLogOut } from "react-icons/fi";
import useAuth from "../hooks/useAuth";

export const ProfileDrawer = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, logout } = useAuth();
  const [houseName, setHouseName] = useState("");
  const [houseLocation, setHouseLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state values with currentUser fields upon drawer open
  useEffect(() => {
    if (currentUser && isOpen) {
      setHouseName(currentUser.houseName || "Living Room Hub");
      setHouseLocation(currentUser.houseLocation || "Bengaluru, India");
    }
  }, [currentUser, isOpen]);

  if (!currentUser) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateProfile({
        houseName: houseName.trim(),
        houseLocation: houseLocation.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile values:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Dark backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 bg-samsung-dark/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-out drawer body */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-samsung-cardBorder bg-white p-6 shadow-drawer transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* Header controls */}
            <div className="flex items-center justify-between border-b border-samsung-cardBorder/60 pb-4">
              <h2 className="text-base font-bold text-samsung-dark">SmartThings Hub Profile</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-samsung-grayText hover:bg-samsung-gray hover:text-samsung-dark transition-colors duration-255"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="mt-6 flex flex-col items-center border-b border-samsung-cardBorder/40 pb-6 text-center">
              <img
                className="h-20 w-20 rounded-full border-2 border-samsung-blue object-cover p-0.5 shadow-md"
                src={currentUser.photoURL}
                alt={currentUser.name}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200";
                }}
              />
              <h3 className="mt-3 text-lg font-bold text-samsung-dark">{currentUser.name}</h3>
              <p className="flex items-center text-xs text-samsung-grayText mt-1">
                <FiMail className="mr-1 h-3.5 w-3.5 text-samsung-grayText" /> {currentUser.email}
              </p>
            </div>

            {/* Profile Details Edit Form */}
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-samsung-grayText">Hub Settings</h4>
              
              {/* House Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-samsung-dark">House Hub Name</label>
                <div className="relative">
                  <FiHome className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-samsung-grayText" />
                  <input
                    type="text"
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    placeholder="e.g. Living Room Hub"
                    className="w-full rounded-xl border border-samsung-cardBorder py-2.5 pl-10 pr-4 text-sm font-medium text-samsung-dark placeholder:text-samsung-grayText/60 focus:border-samsung-blue focus:outline-none focus:ring-2 focus:ring-samsung-blue/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* House Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-samsung-dark">Location</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-samsung-grayText" />
                  <input
                    type="text"
                    value={houseLocation}
                    onChange={(e) => setHouseLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, India"
                    className="w-full rounded-xl border border-samsung-cardBorder py-2.5 pl-10 pr-4 text-sm font-medium text-samsung-dark placeholder:text-samsung-grayText/60 focus:border-samsung-blue focus:outline-none focus:ring-2 focus:ring-samsung-blue/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Saved feedback */}
              {savedSuccess && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-100 animate-fadeIn">
                  Settings updated successfully!
                </div>
              )}

              {/* Save trigger */}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-samsung-blue py-2.5 text-center text-sm font-bold text-white shadow-md hover:bg-samsung-darkBlue transition-all duration-300 disabled:opacity-50"
              >
                {saving ? "Updating profile..." : "Save Settings"}
              </button>
            </form>
          </div>

          {/* Sign Out bottom trigger */}
          <div className="border-t border-samsung-cardBorder/60 pt-4">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-rose-50 py-3 text-center text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100/80 duration-200"
            >
              <FiLogOut className="h-4 w-4" />
              <span>Sign Out of SmartThings</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDrawer;
