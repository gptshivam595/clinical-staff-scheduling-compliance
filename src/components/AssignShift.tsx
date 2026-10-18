import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarPlus,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  UserX,
  RotateCcw,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import { formatDisplayDate } from '../utils/dateUtils';
import { EligibilityEvaluation } from '../types';

export const AssignShift: React.FC = () => {
  const {
    employees,
    assignments,
    demoDate,
    selectedLocation,
    setActiveTab,
    setSelectedEmployeeId,
    assignShiftPrefill,
    setAssignShiftPrefill,
    addAssignment,
    evaluateEmployee,
    addToast,
  } = useApp();

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    assignShiftPrefill?.employeeId || 'CP-001' // Default Ananya Sharma as specified
  );
  const [shiftDate, setShiftDate] = useState<string>(
    assignShiftPrefill?.shiftDate || demoDate // Default 19 Oct 2026 as specified
  );
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('16:30');
  const [station, setStation] = useState<string>('ICU / Critical Care');
  const [clinic, setClinic] = useState<string>(selectedLocation);

  // Validation & Result State
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<EligibilityEvaluation | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState<boolean>(false);

  // Respond to prefill changes (e.g. from scenarios or table actions)
  useEffect(() => {
    if (assignShiftPrefill) {
      if (assignShiftPrefill.employeeId) {
        setSelectedEmpId(assignShiftPrefill.employeeId);
      }
      if (assignShiftPrefill.shiftDate) {
        setShiftDate(assignShiftPrefill.shiftDate);
      }
      setIsStale(true);
      setConfirmedSuccess(false);
    }
  }, [assignShiftPrefill]);

  // Selected employee record from active state
  const currentEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];

  // Whenever inputs change after a check, mark previous evaluation as stale
  const handleInputChange = (field: 'emp' | 'date' | 'start' | 'end' | 'station' | 'clinic', val: string) => {
    setIsStale(true);
    setConfirmedSuccess(false);
    if (field === 'emp') setSelectedEmpId(val);
    if (field === 'date') setShiftDate(val);
    if (field === 'start') setStartTime(val);
    if (field === 'end') setEndTime(val);
    if (field === 'station') setStation(val);
    if (field === 'clinic') setClinic(val);
  };

  // Run deterministic credential check
  const handleCheckEligibility = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormErrors([]);
    setConfirmedSuccess(false);

    const errors: string[] = [];
    if (!selectedEmpId) errors.push('Please select a staff member.');
    if (!shiftDate) errors.push('Please choose a shift date.');
    if (!startTime) errors.push('Please specify start time.');
    if (!endTime) errors.push('Please specify end time.');
    if (startTime && endTime && startTime >= endTime) {
      errors.push('Shift end time must be later than start time.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    // Evaluate deterministically
    const result = evaluateEmployee(selectedEmpId, shiftDate, station, startTime, endTime);
    setEvaluationResult(result);
    setIsStale(false);
  };

  // Priority One: Confirmation-time revalidation
  const handleConfirmAssignment = () => {
    if (isSubmitting) return; // Prevent double-click duplicates

    // 1. Re-read current staff & credential details from state
    const latestEmployee = employees.find(e => e.id === selectedEmpId);
    if (!latestEmployee) {
      addToast('error', 'Employee Not Found', 'The selected staff member record no longer exists.');
      return;
    }

    // 2. Perform real-time confirmation revalidation
    const freshEvaluation = evaluateEmployee(
      selectedEmpId,
      shiftDate,
      station,
      startTime,
      endTime
    );

    if (!freshEvaluation || !freshEvaluation.isEligible) {
      // Confirmation BLOCKED: record failure in state & activity log
      setEvaluationResult(freshEvaluation);
      setIsStale(false);
      addToast(
        'error',
        'Confirmation Blocked by CareVerify',
        freshEvaluation ? freshEvaluation.overallReason : 'Eligibility check failed on confirmation revalidation.'
      );
      return;
    }

    // 3. Confirm only if all required checks pass
    setIsSubmitting(true);
    const outcome = addAssignment({
      employeeId: selectedEmpId,
      shiftDate,
      startTime,
      endTime,
      station,
    });
    setIsSubmitting(false);

    if (outcome.success) {
      setConfirmedSuccess(true);
    }
  };

  const handleResetForm = () => {
    setSelectedEmpId('CP-001');
    setShiftDate(demoDate);
    setStartTime('08:00');
    setEndTime('16:30');
    setStation('ICU / Critical Care');
    setClinic(selectedLocation);
    setFormErrors([]);
    setEvaluationResult(null);
    setIsStale(false);
    setConfirmedSuccess(false);
    setAssignShiftPrefill(null);
  };

  const stationOptions = [
    'ICU / Critical Care',
    'Emergency Ward',
    'Outpatient CarePoint',
    'Pediatrics & Neonatal',
    'Cardiology Day Care',
    'Dialysis Center',
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Shiftwell CareVerify Safe Scheduling</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Assign Shift
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Verify mandatory staff credentials against the selected shift date before allowing an assignment.
        </p>
      </div>

      {/* Visual Workflow Progression Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <span className="font-bold text-slate-900 block leading-tight">Shift Parameters</span>
              <span className="text-[10px] text-slate-500">Staff, date, times & station</span>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl border ${
              !evaluationResult
                ? 'bg-white border-slate-200 text-slate-400'
                : evaluationResult.isEligible && !isStale
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                !evaluationResult
                  ? 'bg-slate-200 text-slate-600'
                  : evaluationResult.isEligible && !isStale
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              2
            </span>
            <div>
              <span className="font-bold block leading-tight">
                {!evaluationResult
                  ? 'Eligibility Check'
                  : evaluationResult.isEligible && !isStale
                  ? 'Eligible (Passed)'
                  : 'Blocked by Guardrail'}
              </span>
              <span className="text-[10px] opacity-80">
                {!evaluationResult
                  ? 'Pending manual run'
                  : isStale
                  ? 'Revalidation required'
                  : 'Deterministic check'}
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl border ${
              confirmedSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : evaluationResult?.isEligible && !isStale
                ? 'bg-teal-50 border-teal-200 text-teal-950'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                confirmedSuccess
                  ? 'bg-emerald-600 text-white'
                  : evaluationResult?.isEligible && !isStale
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <div>
              <span className="font-bold block leading-tight">
                {confirmedSuccess ? 'Confirmed on Roster' : 'Confirmation Recheck'}
              </span>
              <span className="text-[10px] opacity-80">
                {confirmedSuccess ? 'Logged to audit trail' : 'Revalidates before commit'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner if just confirmed */}
      {confirmedSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-emerald-950">
                Shift Successfully Confirmed & Verified
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                {currentEmployee?.name} is scheduled for {formatDisplayDate(shiftDate)} at {station} ({startTime}–{endTime}). Recorded in the roster and activity log.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('roster')}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition-colors"
            >
              View Roster
            </button>
            <button
              onClick={handleResetForm}
              className="px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-semibold text-xs hover:bg-emerald-100 transition-colors"
            >
              Assign Another Shift
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assignment Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Shift Parameters
            </h2>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Form
            </button>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleCheckEligibility(); }} className="space-y-4">
            {formErrors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                {formErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Staff Member Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Staff Member *
              </label>
              <select
                value={selectedEmpId}
                onChange={e => handleInputChange('emp', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id}) — {emp.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Automatically Displayed Role & Clinic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Employee Role
                </span>
                <span className="font-bold text-slate-900">{currentEmployee?.role}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Location
                </span>
                <span className="font-medium text-slate-800 truncate block">
                  {currentEmployee?.clinicLocation}
                </span>
              </div>
            </div>

            {/* Shift Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Shift Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={shiftDate}
                  onChange={e => handleInputChange('date', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                CareVerify checks credential validity as of this specific shift date.
              </p>
            </div>

            {/* Shift Time & Station */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => handleInputChange('start', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => handleInputChange('end', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden"
                />
              </div>
            </div>

            {/* Station / Ward */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Clinical Station / Unit *
              </label>
              <select
                value={station}
                onChange={e => handleInputChange('station', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              >
                {stationOptions.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCheckEligibility()}
                className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Check Credential Eligibility</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Screen 4 - Eligibility Result View */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Eligibility Evaluation
                </h2>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Deterministic Engine
                </span>
              </div>

              {/* Notice if parameters changed after validation */}
              {isStale && evaluationResult && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Shift parameters were modified. Please click <strong>Check Credential Eligibility</strong> to revalidate.
                  </span>
                </div>
              )}

              {/* State 1: Not Checked */}
              {!evaluationResult ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Not Checked — Awaiting Validation
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Shiftwell CareVerify will inspect {currentEmployee?.name}'s mandatory certificates against {formatDisplayDate(shiftDate)} before allowing scheduling.
                  </p>
                  <button
                    onClick={() => handleCheckEligibility()}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Run Check Now
                  </button>
                </div>
              ) : (
                /* State 2 & 3: Evaluated Outcome */
                <div className="space-y-4">
                  {/* Outcome Banner */}
                  {evaluationResult.overallOutcome === 'ELIGIBLE' ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="font-extrabold text-sm uppercase tracking-wide text-emerald-900">
                          Eligible for Assignment
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        All mandatory credentials required for {evaluationResult.role} are verified and compliant on {formatDisplayDate(evaluationResult.shiftDate)}.
                      </p>
                    </div>
                  ) : evaluationResult.overallOutcome === 'BLOCKED_EXPIRED' ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="font-extrabold text-sm uppercase tracking-wide text-rose-900">
                          Assignment Blocked: Expired Credential
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        {evaluationResult.overallReason}
                      </p>
                    </div>
                  ) : evaluationResult.overallOutcome === 'NEEDS_REVIEW' ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                        <span className="font-extrabold text-sm uppercase tracking-wide text-amber-900">
                          Blocked: Verification Pending Review
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {evaluationResult.overallReason}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="font-extrabold text-sm uppercase tracking-wide text-rose-900">
                          Assignment Blocked: Incomplete Records
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        {evaluationResult.overallReason}
                      </p>
                    </div>
                  )}

                  {/* Summary of shift under check */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Staff:</span>
                      <span className="font-bold text-slate-800">{evaluationResult.employeeName} ({evaluationResult.employeeId})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Shift:</span>
                      <span className="font-semibold text-slate-800">{formatDisplayDate(evaluationResult.shiftDate)} ({startTime}–{endTime})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unit Station:</span>
                      <span className="font-medium text-slate-700">{station}</span>
                    </div>
                  </div>

                  {/* Credential-by-Credential Diagnostic Breakdown */}
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Mandatory Credential Checks
                    </h3>
                    <div className="space-y-2">
                      {/* Passed Checks */}
                      {evaluationResult.passedChecks.map((check, i) => (
                        <div
                          key={`p-${i}`}
                          className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-xs flex items-start gap-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold text-slate-900 block">{check.name}</span>
                            <span className="text-[11px] text-emerald-800">
                              {check.message}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Failed Checks */}
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

            {/* Bottom Actions based on Outcome */}
            {evaluationResult && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                {evaluationResult.isEligible && !isStale ? (
                  <button
                    type="button"
                    onClick={handleConfirmAssignment}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Assignment to Roster</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2"
                      title="Assignment blocked by Shiftwell CareVerify guardrail"
                    >
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      <span>Confirm Assignment (Blocked)</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-500">
                      {isStale
                        ? 'Re-evaluate modified parameters before confirmation.'
                        : 'CareVerify invariant: No scheduling with expired, missing, or unverified records.'}
                    </p>
                  </div>
                )}

                {/* Secondary navigation buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmployeeId(selectedEmpId);
                      setActiveTab('staff');
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-teal-700 font-semibold p-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Staff Profile</span>
                  </button>

                  {!evaluationResult.isEligible && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmployeeId(selectedEmpId);
                        setActiveTab('staff');
                      }}
                      className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold p-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update Credential</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
