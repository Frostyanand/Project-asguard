import React, { useState } from "react";
import Navbar from "../components/Navbar";
import ProfileDrawer from "../components/ProfileDrawer";
import useAuth from "../hooks/useAuth";
import { FiHome, FiMapPin, FiShield, FiDatabase, FiTrendingUp, FiCpu, FiPlay } from "react-icons/fi";

export const Dashboard = () => {
  const { currentUser, firebaseError } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Format today's date
  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-samsung-gray text-samsung-dark pb-16">
      
      {/* Navbar with avatar drawer trigger */}
      <Navbar onOpenDrawer={() => setIsDrawerOpen(true)} />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Welcome greeting header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-samsung-dark">
              Hello, {currentUser?.name || "SmartThings User"}
            </h1>
            <p className="text-xs font-medium text-samsung-grayText mt-0.5">
              Welcome back to your Smart Home.
            </p>
          </div>
          <div className="rounded-xl border border-samsung-cardBorder bg-white px-4 py-2.5 shadow-samsung-card inline-flex items-center text-xs font-semibold text-samsung-grayText">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2.5 animate-pulse"></span>
            <span>{todayStr}</span>
          </div>
        </div>

        {/* Phase 1 Verification Panels: Hub Location, Auth Status, Firebase Status */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1: Hub location metadata */}
          <div className="rounded-2xl border border-samsung-cardBorder bg-white p-5 shadow-samsung-card flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-samsung-grayText mb-4">Hub Location Details</h3>
              <div className="space-y-3.5">
                <div className="flex items-center space-x-3 text-sm text-samsung-dark">
                  <FiHome className="h-5 w-5 text-samsung-blue shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-samsung-grayText uppercase">Hub Name</p>
                    <p className="font-bold text-samsung-dark">{currentUser?.houseName || "Smart Home Hub"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm text-samsung-dark">
                  <FiMapPin className="h-5 w-5 text-samsung-blue shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-samsung-grayText uppercase">Location</p>
                    <p className="font-bold text-samsung-dark">{currentUser?.houseLocation || "Bengaluru, India"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-samsung-cardBorder/60">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="text-xs font-bold text-samsung-blue hover:text-samsung-darkBlue transition-colors focus:outline-none"
              >
                Edit Location Settings &rarr;
              </button>
            </div>
          </div>

          {/* Card 2: Auth credentials */}
          <div className="rounded-2xl border border-samsung-cardBorder bg-white p-5 shadow-samsung-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-samsung-grayText mb-4">Authentication Status</h3>
            <div className="space-y-3.5">
              <div className="flex items-center space-x-3 text-sm text-samsung-dark">
                <FiShield className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-samsung-grayText uppercase">Session State</p>
                  <p className="font-bold text-emerald-600">Active (Authenticated)</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-samsung-grayText uppercase">Provider ID</p>
                <p className="text-xs font-bold text-samsung-dark">google.com (Google Sign-In)</p>
              </div>
              <div className="pt-2 border-t border-samsung-cardBorder/40">
                <p className="text-[10px] font-semibold text-samsung-grayText uppercase">Firebase UID</p>
                <p className="font-mono text-[10px] text-samsung-dark truncate select-all" title={currentUser?.uid}>
                  {currentUser?.uid || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Database sync mode */}
          <div className="rounded-2xl border border-samsung-cardBorder bg-white p-5 shadow-samsung-card flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-samsung-grayText mb-4">Firebase Status</h3>
              <div className="space-y-3.5">
                <div className="flex items-center space-x-3 text-sm text-samsung-dark">
                  <span className={`h-2.5 w-2.5 rounded-full ${firebaseError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 energy-pulse-ring'}`}></span>
                  <div>
                    <p className="text-[10px] font-semibold text-samsung-grayText uppercase">Connection Mode</p>
                    <p className="font-bold text-samsung-dark">
                      {firebaseError ? "Not Connected" : "Live Firebase Cloud Linked"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-samsung-grayText leading-relaxed">
                  {firebaseError 
                    ? firebaseError
                    : "Linked to live Firebase service. Profiles are synced automatically inside your cloud Firestore database."
                  }
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Phase 2 Feature Placeholders */}
        <section className="space-y-6">
          <div className="border-b border-samsung-cardBorder/60 pb-3">
            <h2 className="text-sm font-bold text-samsung-dark tracking-wide uppercase">Assistant Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Placeholder 1: Devices */}
            <div className="rounded-2xl border border-dashed border-samsung-cardBorder bg-white/50 p-6 flex flex-col justify-between min-h-[220px] transition-all hover:bg-white hover:shadow-samsung-hover">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
                  <FiCpu className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-samsung-dark">Devices</h3>
                <p className="text-xs text-samsung-grayText mt-2 leading-relaxed">
                  Status toggling, live power draw metrics, and detailed consumption logs for your Samsung appliances.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 w-fit">
                Coming in Phase 2
              </span>
            </div>

            {/* Placeholder 2: Energy Analytics */}
            <div className="rounded-2xl border border-dashed border-samsung-cardBorder bg-white/50 p-6 flex flex-col justify-between min-h-[220px] transition-all hover:bg-white hover:shadow-samsung-hover">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
                  <FiTrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-samsung-dark">Energy Analytics</h3>
                <p className="text-xs text-samsung-grayText mt-2 leading-relaxed">
                  Weekly consumption AreaCharts, estimated electricity bill forecasts, alert notifications, and AI saving optimization tips.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 w-fit">
                Coming in Phase 2
              </span>
            </div>

            {/* Placeholder 3: Data Generation */}
            <div className="rounded-2xl border border-dashed border-samsung-cardBorder bg-white/50 p-6 flex flex-col justify-between min-h-[220px] transition-all hover:bg-white hover:shadow-samsung-hover">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
                  <FiPlay className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-samsung-dark">Data Generation</h3>
                <p className="text-xs text-samsung-grayText mt-2 leading-relaxed">
                  One-click simulation control to fast-forward device runtimes and populate database energy histories.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 w-fit">
                Coming in Phase 2
              </span>
            </div>

          </div>
        </section>

      </main>

      {/* Slide drawer settings panel */}
      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
};

export default Dashboard;
