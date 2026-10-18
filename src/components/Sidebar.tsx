import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  CalendarCheck2,
  ArrowLeftRight,
  ClipboardList,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { isExpiredForShift } from '../utils/dateUtils';

interface SidebarProps {
  onOpenScenarios?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { activeTab, setActiveTab, setSelectedEmployeeId, setAssignShiftPrefill, employees, demoDate } = useApp();

  // Dynamic counts for notification badges
  const expiredStaffCount = employees.filter(emp =>
    emp.credentials.some(c => c.expiryDate && isExpiredForShift(c.expiryDate, demoDate))
  ).length;

  const missingStaffCount = employees.filter(emp =>
    emp.credentials.some(c => c.verificationStatus === 'MISSING')
  ).length;

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'staff' as const,
      label: 'Staff & Credentials',
      icon: <Users className="w-4 h-4" />,
      badge: expiredStaffCount + missingStaffCount > 0 ? `${expiredStaffCount + missingStaffCount}` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'assign' as const,
      label: 'Assign Shift',
      icon: <CalendarPlus className="w-4 h-4" />,
      badge: 'Verified',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    },
    {
      id: 'roster' as const,
      label: 'Roster',
      icon: <CalendarCheck2 className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'swap' as const,
      label: 'Shift Swap',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'activity' as const,
      label: 'Activity Log',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: null,
    },
  ];

  const handleNavClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    if (tabId === 'staff') {
      setSelectedEmployeeId(null);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-900/30 shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
              Shiftwell
            </div>
            <div className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5 leading-none">
              CareVerify
            </div>
          </div>
        </div>

        {/* Tagline & Descriptor */}
        <div className="mt-3 text-[11px] text-slate-400 font-medium leading-snug">
          Healthcare Credential Verification & Safe Scheduling
        </div>
        
        {/* Subtle Prototype Label */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/90 border border-slate-700/60 text-[10px] text-teal-300/90 font-medium">
          <Building2 className="w-3 h-3 text-teal-400" />
          <span>Built for CarePoint Clinics</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Context Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              Core Rule
            </span>
            <span className="text-[10px] text-slate-400">Strict Lock</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Every shift. Verified before assignment.
          </p>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
            Shiftwell product ecosystem
          </div>
        </div>
      </div>
    </aside>
  );
};
