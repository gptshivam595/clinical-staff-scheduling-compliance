import React, { useEffect, useRef, useState } from 'react';
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
  Play,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowRight,
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
    runPresetScenario,
  } = useApp();

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const quickScenarios = [
    {
      id: 'TEST_A',
      title: 'Valid Assignment',
      description: 'Demonstrates an eligible staff member.',
      subtext: 'Ananya Sharma (RN) · All credentials active & verified',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      badgeText: 'Eligible',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'TEST_B',
      title: 'Expired Certificate',
      description: 'Demonstrates an assignment blocked because a mandatory credential has expired.',
      subtext: 'Rohan Verma (RN) · BLS certificate expired 10 Oct 2026',
      icon: AlertOctagon,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
      badgeText: 'Expired Block',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'TEST_C',
      title: 'Missing Credential',
      description: 'Demonstrates a blocked assignment due to a missing mandatory document.',
      subtext: 'Priya Das (RN) · State Nursing Council document missing',
      icon: AlertOctagon,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
      badgeText: 'Missing Block',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'TEST_E',
      title: 'Unverified Credential',
      description: 'Demonstrates a blocked assignment when verification is incomplete.',
      subtext: 'Arjun Nair (RN) · BLS certificate pending compliance review',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
      badgeText: 'Needs Review',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  const handleSelectQuickScenario = (scenarioId: string) => {
    runPresetScenario(scenarioId);
    setIsMenuOpen(false);
  };

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

            {/* Renamed & Highlighted Try Demo Scenarios Button with Quick-Access Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                aria-label="Try Demo Scenarios"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                title="Explore interactive CareVerify demo scenarios"
              >
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Try Demo Scenarios</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Quick-Access Dropdown Popover */}
              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                      <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                        Try a Demo Scenario
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Explore how CareVerify handles valid, expired, missing, and unverified credentials.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {quickScenarios.map(sc => {
                      const IconComponent = sc.icon;
                      return (
                        <button
                          key={sc.id}
                          onClick={() => handleSelectQuickScenario(sc.id)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-start gap-3 group focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          role="menuitem"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${sc.iconBg}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900 group-hover:text-teal-900">
                                {sc.title}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sc.badgeColor}`}>
                                {sc.badgeText}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                              {sc.description}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {sc.subtext}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-100 mt-3 pt-3">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsScenariosOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors group focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      role="menuitem"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>View All Test Scenarios</span>
                      </div>
                      <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Tests A–J →
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
