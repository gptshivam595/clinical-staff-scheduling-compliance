import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarCheck2,
  CalendarPlus,
  ArrowLeftRight,
  ShieldCheck,
  Building2,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  Eye,
} from 'lucide-react';
import { formatDisplayDate } from '../utils/dateUtils';
import { evaluateEligibility } from '../utils/validationEngine';
import { ShiftAssignment } from '../types';

export const RosterView: React.FC = () => {
  const { assignments, employees, demoDate, setActiveTab, setAssignShiftPrefill } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<ShiftAssignment | null>(null);

  const filteredAssignments = assignments.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.employeeName.toLowerCase().includes(q) ||
      a.employeeId.toLowerCase().includes(q) ||
      a.station.toLowerCase().includes(q) ||
      a.clinicLocation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Shiftwell CareVerify</span>
            <span className="text-slate-400 font-normal">| Safe Clinical Scheduling</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Confirmed Roster
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            All scheduled clinical shifts verified compliant with mandatory credentials before assignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('swap')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeftRight className="w-4 h-4 text-teal-600" />
            <span>Shift Swap Verification</span>
          </button>
          <button
            onClick={() => {
              setAssignShiftPrefill(null);
              setActiveTab('assign');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search confirmed shifts by staff name, station, location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 px-3 py-1 bg-slate-100 rounded-lg shrink-0">
          {filteredAssignments.length} Confirmed Shifts
        </span>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Assigned Staff</th>
                <th className="py-3.5 px-3">Role</th>
                <th className="py-3.5 px-3">Shift Date & Time</th>
                <th className="py-3.5 px-3">Station & Clinic</th>
                <th className="py-3.5 px-3">Compliance Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <CalendarCheck2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">No confirmed shifts found</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Use "New Assignment" to check credential eligibility and schedule clinical staff.
                      </p>
                      <button
                        onClick={() => {
                          setAssignShiftPrefill(null);
                          setActiveTab('assign');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                      >
                        Assign a Shift
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map(shift => {
                  // Revalidate current employee state to detect if a credential changed after confirmation
                  const currentEmp = employees.find(e => e.id === shift.employeeId);
                  const currentEval = currentEmp
                    ? evaluateEligibility(currentEmp, shift.shiftDate, shift.station, shift.startTime, shift.endTime, demoDate)
                    : null;
                  const isStillCompliant = currentEval?.isEligible ?? true;

                  return (
                    <tr
                      key={shift.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedAssignment(shift)}
                    >
                      {/* Staff */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {shift.employeeName
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                              {shift.employeeName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {shift.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-3">
                        <span className="font-medium text-slate-800 text-xs">
                          {shift.role}
                        </span>
                      </td>

                      {/* Shift Date & Time */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-900">
                          {formatDisplayDate(shift.shiftDate)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {shift.startTime} – {shift.endTime}
                        </div>
                      </td>

                      {/* Station & Clinic */}
                      <td className="py-4 px-3">
                        <div className="font-semibold text-slate-800 text-xs">
                          {shift.station}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {shift.clinicLocation}
                        </div>
                      </td>

                      {/* Compliance Status & Verification Seal */}
                      <td className="py-4 px-3">
                        {isStillCompliant ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>CareVerify Confirmed</span>
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Verified: {shift.verifiedAt}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Credential Modified</span>
                            </span>
                            <div className="text-[10px] text-amber-800 font-medium">
                              Requires revalidation
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedAssignment(shift)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                            title="View compliance verification details"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => setActiveTab('swap')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors"
                            title="Request safe shift swap"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Swap</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Shift Record & Compliance Snapshot
                </div>
                <h3 className="text-base font-bold text-white">
                  {selectedAssignment.employeeName} — {selectedAssignment.station}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Shift Date: {formatDisplayDate(selectedAssignment.shiftDate)} ({selectedAssignment.startTime}–{selectedAssignment.endTime})
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified at Confirmation</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  {selectedAssignment.evaluationSnapshot?.enforcementRule || 'Shiftwell CareVerify: Verified before assignment'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Verified Mandatory Credentials At Confirmation
                </span>
                <ul className="space-y-1.5">
                  {selectedAssignment.evaluationSnapshot?.passedCredentials?.map((cred, i) => (
                    <li key={i} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-800">{cred}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedAssignment.swappedWith && (
                <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-950">
                  <span className="font-bold block mb-0.5">Shift Swap Record:</span>
                  <span>
                    Swapped in place of {selectedAssignment.swappedWith.originalEmployeeName} on {selectedAssignment.swappedWith.swappedAt}.
                  </span>
                </div>
              )}

              <div className="pt-2 text-slate-500 text-[11px] border-t border-slate-100 flex justify-between">
                <span>Confirmation Timestamp:</span>
                <span className="font-semibold text-slate-700">{selectedAssignment.verifiedAt}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
