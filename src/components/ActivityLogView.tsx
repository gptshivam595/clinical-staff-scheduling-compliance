import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  User,
  Calendar,
  Clock,
  ArrowLeftRight,
  Edit3,
} from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { activities } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'SUCCESS' | 'BLOCKED' | 'WARNING' | 'INFO'>('ALL');

  const filteredActivities = activities.filter(act => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      act.summary.toLowerCase().includes(q) ||
      act.details.toLowerCase().includes(q) ||
      (act.employeeName && act.employeeName.toLowerCase().includes(q)) ||
      (act.employeeId && act.employeeId.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (outcomeFilter !== 'ALL' && act.outcome !== outcomeFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Shiftwell CareVerify Audit Trail</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Compliance Activity Log
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tamper-evident record of scheduling attempts, guardrail blocks, confirmations, and credential record changes.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 w-fit">
          {activities.length} Recorded Events
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity log by employee name, action, reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">Success / Confirmed</option>
            <option value="BLOCKED">Blocked by CareVerify</option>
            <option value="WARNING">Warnings / Incomplete</option>
            <option value="INFO">Updates & Resets</option>
          </select>

          {(searchQuery || outcomeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setOutcomeFilter('ALL');
              }}
              className="px-2.5 py-1 text-xs text-rose-600 font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No activity events match your filter.</p>
          </div>
        ) : (
          filteredActivities.map(act => {
            let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
            let icon = <Clock className="w-4 h-4 text-slate-500 shrink-0" />;

            if (act.outcome === 'SUCCESS') {
              badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
            } else if (act.outcome === 'BLOCKED') {
              badgeBg = 'bg-rose-50 text-rose-800 border-rose-200';
              icon = <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
            } else if (act.outcome === 'WARNING') {
              badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
              icon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
            } else if (act.action === 'CREDENTIAL_UPDATED') {
              badgeBg = 'bg-teal-50 text-teal-800 border-teal-200';
              icon = <Edit3 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />;
            }

            return (
              <div
                key={act.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-colors flex items-start gap-3.5"
              >
                {icon}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {act.summary}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {act.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {act.details}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className={`font-semibold px-2 py-0.5 rounded border text-[10px] ${badgeBg}`}>
                      {act.outcome}
                    </span>
                    {act.employeeName && (
                      <span className="text-slate-500 font-medium">
                        Staff: <strong className="text-slate-700">{act.employeeName}</strong>
                      </span>
                    )}
                    {act.shiftDate && (
                      <span className="text-slate-500 font-medium">
                        Shift Date: <strong className="text-slate-700">{act.shiftDate}</strong>
                      </span>
                    )}
                    {act.station && (
                      <span className="text-slate-500 font-medium">
                        Station: <strong className="text-slate-700">{act.station}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
