import React from 'react';
import {
  Shield,
  ShieldCheck,
  FileCheck2,
  UploadCloud,
  History,
  FileText,
  UserCheck,
  Cpu,
  Bot,
  LogIn,
  LogOut,
  Radio,
  Crosshair
} from 'lucide-react';
import { ActiveTab, UserProfile, cleanDisplayName } from '../types/client.ts';
import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase.ts';
import { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  firebaseUser,
  onSignIn,
  onSignOut
}) => {
  const handleGoogleSignIn = async () => {
    if (onSignIn) {
      onSignIn();
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Google sign-in notice:', err?.message || err);
    }
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-950/80 bg-[#050b16]/95 backdrop-blur-md">
      {/* Top Threat Telemetry Micro-strip */}
      <div className="bg-[#03070f] border-b border-cyan-950/60 px-4 py-1 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="font-mono text-cyan-300 font-semibold">SOC ENGINE ONLINE</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-400">C2PA ISO 21496-1 TRUST ANCHORS ACTIVE</span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="font-mono text-slate-500 hidden md:inline">NIST SP 800-86 EVIDENCE PRESERVATION</span>
        </div>
        <div className="flex items-center gap-3">
          {firebaseUser ? (
            <>
              <span className="font-mono text-cyan-300 text-xs font-semibold">
                {cleanDisplayName(firebaseUser.displayName) || firebaseUser.email}
              </span>
              <div className="flex items-center gap-1 text-[11px] bg-[#071329] text-cyan-300 px-2.5 py-0.5 rounded border border-cyan-700/50">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono">Authenticated</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[11px] font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded hover:bg-rose-950/30"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <span className="font-mono text-slate-400 text-xs">
                Guest Session
              </span>
              <div className="flex items-center gap-1 text-[11px] bg-[#071329] text-slate-400 px-2 py-0.5 rounded border border-slate-700/50">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono">Not Signed In</span>
              </div>
              <button
                onClick={handleGoogleSignIn}
                className="text-[11px] font-mono bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer transition-colors shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              >
                <LogIn className="w-3 h-3 text-cyan-400" />
                <span>Google Sign-In</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 lg:py-0 lg:h-16 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Brand Lockup */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-600 via-cyan-700 to-blue-900 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/40 shrink-0">
            <Shield className="w-5 h-5 text-white drop-shadow-[0_0_4px_#22d3ee]" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-white tracking-wider flex items-center gap-2 font-mono">
              <span className="tracking-widest">CHARS DETECT</span>
              <span className="text-[9px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                PROVENANCE CHECKER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-sans">Enterprise Forensic Intelligence & Media Trust</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071329]'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071329]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071329]'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.25)]'
                : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-300" />
            <span>AI Analyst</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'identity'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071329]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Identity Trust</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071329]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('transparency')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'transparency'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071329]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Engine Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071329]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Docs</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
