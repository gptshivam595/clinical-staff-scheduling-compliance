import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Calendar,
  Clock,
  Building2,
  Eye,
} from 'lucide-react';
import { formatDisplayDate } from '../utils/dateUtils';
import { EligibilityEvaluation, ShiftAssignment } from '../types';

export const ShiftSwapView: React.FC = () => {
  const {
    assignments,
    employees,
    demoDate,
    processSwap,
    evaluateEmployee,
    setActiveTab,
    setSelectedEmployeeId,
  } = useApp();

  // Active confirmed shifts available for swap
  const confirmedAssignments = assignments.filter(a => a.status === 'CONFIRMED');

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    confirmedAssignments[0]?.id || ''
  );
  // Default replacement: Rohan Verma (CP-002) for test scenarios, or Priya/Kavya
  const [replacementEmpId, setReplacementEmpId] = useState<string>('CP-002');
  const [evaluationResult, setEvaluationResult] = useState<EligibilityEvaluation | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [swapSuccess, setSwapSuccess] = useState<boolean>(false);

  const targetAssignment = confirmedAssignments.find(a => a.id === selectedAssignmentId) || confirmedAssignments[0];
  const replacementEmployee = employees.find(e => e.id === replacementEmpId) || employees[1];

  const handleShiftSelect = (id: string) => {
    setSelectedAssignmentId(id);
    setIsStale(true);
    setSwapSuccess(false);
  };

  const handleReplacementSelect = (id: string) => {
    setReplacementEmpId(id);
    setIsStale(true);
    setSwapSuccess(false);
  };

  const handleCheckSwapEligibility = () => {
    if (!targetAssignment || !replacementEmployee) return;

    // Apply the exact same credential-validation engine for shift swap
    const result = evaluateEmployee(
      replacementEmployee.id,
      targetAssignment.shiftDate,
      targetAssignment.station,
      targetAssignment.startTime,
      targetAssignment.endTime
    );
    setEvaluationResult(result);
    setIsStale(false);
    setSwapSuccess(false);
  };

  const handleConfirmSwap = () => {
    if (!evaluationResult || !evaluationResult.isEligible || isStale || !targetAssignment) return;

    const outcome = processSwap(targetAssignment.id, replacementEmployee.id);
    if (outcome.success) {
      setSwapSuccess(true);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Shiftwell CareVerify Shift-Swap Verification</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Shift Swap Compliance Verification
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Shift swaps are subject to the identical mandatory credential invariant. The replacement employee must be 100% compliant.
        </p>
      </div>

      {/* Success Notification */}
      {swapSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-emerald-950">
                Shift Swap Verified & Confirmed
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                {replacementEmployee?.name} has officially replaced {targetAssignment?.employeeName} for the shift on {formatDisplayDate(targetAssignment?.shiftDate)}. Roster and activity log updated.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('roster')}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition-colors shrink-0"
          >
            View Confirmed Roster
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Swap Configuration */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Select Shift & Replacement Staff
            </h2>
          </div>

          {confirmedAssignments.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No confirmed shifts currently available to swap. Please assign a shift first.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Existing Shift Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Shift To Be Swapped (Original Staff) *
                </label>
                <select
                  value={selectedAssignmentId}
                  onChange={e => handleShiftSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                >
                  {confirmedAssignments.map(asgn => (
                    <option key={asgn.id} value={asgn.id}>
                      {asgn.employeeName} — {formatDisplayDate(asgn.shiftDate)} ({asgn.station})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Shift Details Preview */}
              {targetAssignment && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Original Shift Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Currently Assigned:</span>
                      <span className="font-bold text-slate-900">{targetAssignment.employeeName} ({targetAssignment.employeeId})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Shift Date:</span>
                      <span className="font-bold text-slate-900">{formatDisplayDate(targetAssignment.shiftDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Station:</span>
                      <span className="font-medium text-slate-800">{targetAssignment.station}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hours:</span>
                      <span className="font-mono text-slate-800">{targetAssignment.startTime} – {targetAssignment.endTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Replacement Employee Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Proposed Replacement Employee *
                </label>
                <select
                  value={replacementEmpId}
                  onChange={e => handleReplacementSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                >
                  {employees
                    .filter(e => e.id !== targetAssignment?.employeeId)
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id}) — {emp.role}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  CareVerify will inspect {replacementEmployee?.name}'s credentials for {formatDisplayDate(targetAssignment?.shiftDate)}.
                </p>
              </div>

              {/* Check Swap Eligibility Button */}
              <button
                type="button"
                onClick={handleCheckSwapEligibility}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Check Swap Eligibility</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Swap Eligibility Evaluation */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Swap Guardrail Result
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">
                Rule Check
              </span>
            </div>

            {isStale && evaluationResult && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Selection modified. Re-check swap eligibility to continue.</span>
              </div>
            )}

            {!evaluationResult ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Ready to Validate Swap
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  CareVerify enforces that replacement staff must possess active, verified credentials. No swaps can bypass clinical compliance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Banner */}
                {evaluationResult.overallOutcome === 'ELIGIBLE' ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="font-extrabold text-sm uppercase tracking-wide text-emerald-900">
                        Swap Eligible & Approved
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {replacementEmployee?.name} is verified compliant for {formatDisplayDate(targetAssignment.shiftDate)}. Safe to confirm swap.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                      <span className="font-extrabold text-sm uppercase tracking-wide text-rose-900">
                        Shift Swap Blocked
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      {evaluationResult.overallReason}
                    </p>
                  </div>
                )}

                {/* Granular checklist */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Replacement Credential Status
                  </h3>
                  <div className="space-y-2">
                    {evaluationResult.passedChecks.map((check, i) => (
                      <div
                        key={`p-${i}`}
                        className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-xs flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold text-slate-900 block">{check.name}</span>
                          <span className="text-[11px] text-emerald-800">{check.message}</span>
                        </div>
                      </div>
                    ))}
                    {evaluationResult.failedChecks.map((check, i) => (
                      <div
                        key={`f-${i}`}
                        className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 text-xs flex items-start gap-2.5"
                      >
                        <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold text-rose-950 block">{check.name}</span>
                          <span className="text-[11px] text-rose-800 font-medium">
                            {check.reason || check.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {evaluationResult && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {evaluationResult.isEligible && !isStale ? (
                <button
                  type="button"
                  onClick={handleConfirmSwap}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Safe Shift Swap</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>Confirm Shift Swap (Blocked)</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-500">
                    Shiftwell CareVerify prevents unverified shift substitutions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
