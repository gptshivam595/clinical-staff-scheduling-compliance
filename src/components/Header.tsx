import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { CLINIC_LOCATIONS } from '../data/initialData';
import { formatDisplayDate } from '../utils/dateUtils';
import { AboutModal } from './AboutModal';
import { DemoScenariosModal } from './DemoScenariosModal';

export const Header: React.FC = () => {
  const {
    selectedLocation,
    setSelectedLocation,
    demoDate,
    setDemoDate,
    resetDemoData,
  } = useApp();

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left section: Product title & CarePoint Clinics prototype badge */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Shiftwell CareVerify
                </span>
                {/* User Prompt Requirement 3: Subtle 'Built for CarePoint Clinics' label in header */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Building2 className="w-3 h-3 text-teal-700" />
                  <span>Built for CarePoint Clinics</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Healthcare Credential Verification & Safe Scheduling
              </p>
            </div>
          </div>

          {/* Middle & Right section: Location selector, demo date, actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Location selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer"
                title="Select CarePoint Clinic Location"
              >
                {CLINIC_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Demo Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700" title="Fixed Demo Reference Date">
              <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="text-slate-500">Ref Date:</span>
              <span className="font-semibold text-slate-900">{formatDisplayDate(demoDate)}</span>
            </div>

            {/* Active Verification Badge */}
            <div className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>CareVerify Active</span>
            </div>

            {/* Test Scenarios Button */}
            <button
              onClick={() => setIsScenariosOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-semibold text-xs hover:bg-teal-100 transition-colors"
              title="Run pre-built test scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Scenarios</span>
            </button>

            {/* About Modal Button */}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="About Shiftwell CareVerify prototype and limitations"
              aria-label="About prototype"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Reset sample records & roster"
              aria-label="Reset demo data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* About Prototype Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Demo Scenarios Modal */}
      <DemoScenariosModal isOpen={isScenariosOpen} onClose={() => setIsScenariosOpen(false)} />

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              Reset Prototype Data?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This will restore initial fictional staff records, reset updated credentials, clear newly scheduled shifts, and reinstate the baseline activity log for CarePoint Clinics.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
