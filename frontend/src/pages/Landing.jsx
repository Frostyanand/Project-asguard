import React, { useState } from "react";
import { FcGoogle as GoogleIcon } from "react-icons/fc";
import { MdOutlineEnergySavingsLeaf } from "react-icons/md";
import { FiCheckCircle, FiShield, FiLock, FiCloud } from "react-icons/fi";
import useAuth from "../hooks/useAuth";

export const Landing = () => {
  const { login } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoggingIn(true);
    setError(null);
    console.log("[SmartThings Auth] Login initiated...");
    try {
      const profile = await login();
      console.log("[SmartThings Auth] Login successful. User:", profile?.name, "UID:", profile?.uid);
    } catch (err) {
      console.error("[SmartThings Auth] Login failed:", err);
      console.error("[SmartThings Auth] Error code:", err?.code || "N/A");
      console.error("[SmartThings Auth] Error message:", err?.message || "N/A");
      // Show the actual Firebase error message to the user
      setError(err?.message || "Failed to sign in. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden flex flex-col justify-between">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-samsung-gray rounded-bl-[150px] lg:block hidden -z-10"></div>
      <div className="absolute top-12 left-12 w-64 h-64 bg-samsung-blue/5 rounded-full blur-3xl -z-10"></div>

      {/* Header bar */}
      <header className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-samsung-blue text-white shadow-md">
            <MdOutlineEnergySavingsLeaf className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-samsung-dark">SmartThings</span>
            <span className="ml-1.5 text-xs text-samsung-grayText">Samsung Smart Home</span>
          </div>
        </div>
      </header>

      {/* Main hero page content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center py-8 lg:py-16 gap-12 lg:gap-16">
        
        {/* Left column: titles & authentication */}
        <div className="flex-1 max-w-xl text-left space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full bg-samsung-blue/10 px-3 py-1 text-xs font-bold text-samsung-blue">
            <span>Samsung Eco-System Integration</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-samsung-dark leading-[1.15]">
            SmartThings <br/>
            <span className="text-samsung-blue">AI Energy Assistant</span>
          </h1>
          
          <p className="text-base text-samsung-grayText leading-relaxed">
            Verify secure configuration credentials, authenticate with Google, and test cloud storage persistence inside your SmartThings user database.
          </p>

          {/* Phase 1 Verification list */}
          <ul className="space-y-3.5 pt-2 text-sm font-semibold text-samsung-dark">
            <li className="flex items-center space-x-3">
              <FiCheckCircle className="text-samsung-blue h-5 w-5 shrink-0" />
              <span>Google Popup OAuth Integration</span>
            </li>
            <li className="flex items-center space-x-3">
              <FiCheckCircle className="text-samsung-blue h-5 w-5 shrink-0" />
              <span>Cloud Firestore Auto-Profile Synchronization</span>
            </li>
            <li className="flex items-center space-x-3">
              <FiCheckCircle className="text-samsung-blue h-5 w-5 shrink-0" />
              <span>Session Persistence & Protected Router States</span>
            </li>
          </ul>

          {/* Login actions */}
          <div className="pt-4 space-y-4">
            <button
              onClick={handleLogin}
              disabled={loggingIn}
              className="flex items-center justify-center space-x-3 rounded-2xl bg-white border border-samsung-cardBorder px-6 py-4 shadow-samsung-card hover:shadow-samsung-hover transition-all hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-samsung-blue/20 w-full sm:w-auto"
            >
              {loggingIn ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-samsung-blue border-t-transparent"></div>
                  <span className="text-sm font-bold text-samsung-dark">Connecting...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5" />
                  <span className="text-sm font-bold text-samsung-dark">Continue with Google</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-xs font-semibold text-rose-500 animate-pulse">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Right column: static hub secure diagram representation */}
        <div className="flex-1 w-full max-w-md lg:max-w-none flex items-center justify-center">
          <div className="relative w-full max-w-sm aspect-square rounded-3xl bg-white border border-samsung-cardBorder p-8 shadow-samsung-hover flex items-center justify-center">
            
            {/* Background grid */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-4 p-8 opacity-20 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border border-dashed border-samsung-grayText rounded-lg"></div>
              ))}
            </div>

            {/* Smart hub visualization */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              
              {/* Central security shield indicator */}
              <div className="relative flex h-40 w-40 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-samsung-blue/5 border-2 border-samsung-blue/15 animate-ping"></div>
                <div className="absolute inset-4 rounded-full bg-samsung-blue/10 border border-samsung-blue/30 energy-pulse-ring"></div>
                
                {/* Center shield badge */}
                <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-samsung-blue text-white shadow-lg">
                  <FiShield className="h-8 w-8 text-white" />
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-1">Auth Core</span>
                </div>
              </div>

              {/* Connected node badges (Static Phase 1 states) */}
              <div className="absolute -top-4 flex flex-col items-center space-y-1">
                <div className="rounded-xl border border-samsung-cardBorder bg-white px-3 py-1.5 shadow-md flex items-center space-x-2 text-[10px] font-bold text-samsung-dark">
                  <FiLock className="text-emerald-500 h-3.5 w-3.5" />
                  <span>Google OAuth Active</span>
                </div>
              </div>

              <div className="absolute -left-8 bottom-8 flex flex-col items-center space-y-1">
                <div className="rounded-xl border border-samsung-cardBorder bg-white px-3 py-1.5 shadow-md flex items-center space-x-2 text-[10px] font-bold text-samsung-dark">
                  <FiCloud className="text-samsung-blue h-3.5 w-3.5 animate-pulse" />
                  <span>Firestore Sync</span>
                </div>
              </div>

              <div className="absolute -right-8 bottom-8 flex flex-col items-center space-y-1">
                <div className="rounded-xl border border-samsung-cardBorder bg-white px-3 py-1.5 shadow-md flex items-center space-x-2 text-[10px] font-bold text-samsung-dark">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-0.5 animate-pulse"></span>
                  <span>Session Persisted</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* Footer bar */}
      <footer className="mx-auto max-w-7xl w-full px-4 py-8 border-t border-samsung-cardBorder/60 text-center text-[10px] font-medium text-samsung-grayText">
        <p>&copy; {new Date().getFullYear()} Samsung SmartThings AI Energy Assistant. Phase 1 Authentication Sandbox.</p>
      </footer>
    </div>
  );
};

export default Landing;
