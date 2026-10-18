/**
 * Shiftwell CareVerify
 * Healthcare Credential Verification & Safe Scheduling
 * Built as a prototype for CarePoint Clinics as part of the Shiftwell product ecosystem.
 * Tagline: Every shift. Verified before assignment.
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CredentialOverview } from './components/CredentialOverview';
import { StaffProfile } from './components/StaffProfile';
import { AssignShift } from './components/AssignShift';
import { RosterView } from './components/RosterView';
import { ShiftSwapView } from './components/ShiftSwapView';
import { ActivityLogView } from './components/ActivityLogView';
import { ToastContainer } from './components/ToastContainer';
import { Menu, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, selectedEmployeeId } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Render current active view
  const renderView = () => {
    switch (activeTab) {
      case 'overview':
        return <CredentialOverview />;
      case 'staff':
        return <StaffProfile />;
      case 'assign':
        return <AssignShift />;
      case 'roster':
        return <RosterView />;
      case 'swap':
        return <ShiftSwapView />;
      case 'activity':
        return <ActivityLogView />;
      default:
        return <CredentialOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-900 font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-xs text-white">
            CV
          </div>
          <span className="font-bold text-sm tracking-tight">Shiftwell CareVerify</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-300 hover:text-white rounded-lg"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 bg-slate-900 h-full overflow-y-auto">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />
        <main className="flex-1 pb-16">{renderView()}</main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
