import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  CalendarPlus,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Clock,
  Edit3,
  Building2,
  Mail,
  Phone,
  FileText,
  Calendar,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { formatDisplayDate, isExpiredForShift, isExpiringSoon } from '../utils/dateUtils';
import { evaluateEligibility, ROLE_REQUIREMENTS_MAP } from '../utils/validationEngine';
import { CredentialRecord, VerificationStatus } from '../types';

export const StaffProfile: React.FC = () => {
  const {
    employees,
    selectedEmployeeId,
    setSelectedEmployeeId,
    setActiveTab,
    setAssignShiftPrefill,
    demoDate,
    updateCredential,
  } = useApp();

  // Find selected employee, default to first if none selected
  const employee = employees.find(e => e.id === selectedEmployeeId) || employees[0];

  // Modal state for updating credential
  const [editingCredential, setEditingCredential] = useState<CredentialRecord | null>(null);
  const [editStatus, setEditStatus] = useState<VerificationStatus>('VERIFIED');
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');
  const [editIssueDate, setEditIssueDate] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  if (!employee) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Employee record not found.</p>
        <button
          onClick={() => setActiveTab('overview')}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  // Current readiness evaluation on demo reference date
  const evaluation = evaluateEligibility(employee, demoDate, 'ICU', '08:00', '16:30', demoDate);

  const handleOpenEdit = (cred: CredentialRecord) => {
    setEditingCredential(cred);
    setEditStatus(cred.verificationStatus);
    setEditExpiryDate(cred.expiryDate || '');
    setEditIssueDate(cred.issueDate || '');
    setEditNote(cred.verificationNote || '');
    setFormError('');
  };

  const handleCloseEdit = () => {
    setEditingCredential(null);
    setFormError('');
  };

  const handleSaveCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCredential) return;

    // Validation
    if (editStatus === 'VERIFIED' && !editExpiryDate) {
      setFormError('A verified credential must have a valid expiry date specified.');
      return;
    }

    if (editIssueDate && editExpiryDate && editIssueDate > editExpiryDate) {
      setFormError('Issue date cannot be later than the expiry date.');
      return;
    }

    updateCredential(employee.id, editingCredential.id, {
      verificationStatus: editStatus,
      expiryDate: editStatus === 'MISSING' ? null : editExpiryDate || null,
      issueDate: editStatus === 'MISSING' ? null : editIssueDate || null,
      verificationNote: editNote,
    });

    handleCloseEdit();
  };

  const handleAssignShiftClick = () => {
    setAssignShiftPrefill({
      employeeId: employee.id,
      shiftDate: demoDate,
    });
    setActiveTab('assign');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top back navigation & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Staff Overview</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAssignShiftClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Assign Shift for this Staff</span>
          </button>
        </div>
      </div>

      {/* Staff Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl ${employee.avatarBg} text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md`}
            >
              {employee.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {employee.name}
                </h1>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {employee.id}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                  {employee.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {employee.clinicLocation}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {employee.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {employee.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Overall Readiness Badge */}
          <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Current Scheduling Readiness (as of {formatDisplayDate(demoDate)})
            </div>
            {evaluation.isEligible ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Eligible for Assignment</span>
              </div>
            ) : evaluation.overallOutcome === 'BLOCKED_EXPIRED' ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Blocked: Expired Credential</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Blocked: Unverified / Missing</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1.5 max-w-xs leading-snug">
              {evaluation.overallReason}
            </p>
          </div>
        </div>
      </div>

      {/* Role Compliance Requirements & Credentials List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Mandatory Role Credentials
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              CarePoint Clinics compliance standards for {employee.role}. All required documents must be active and verified.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {employee.credentials.length} Records Tracked
          </span>
        </div>

        <div className="space-y-4">
          {employee.credentials.map(cred => {
            const isExpired = cred.expiryDate ? isExpiredForShift(cred.expiryDate, demoDate) : false;
            const expiringSoon = cred.expiryDate ? isExpiringSoon(cred.expiryDate, demoDate) : false;

            let statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified Active
              </span>
            );

            if (cred.verificationStatus === 'MISSING') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  Missing Document
                </span>
              );
            } else if (cred.verificationStatus === 'PENDING') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Pending Review
                </span>
              );
            } else if (cred.verificationStatus === 'FAILED') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  Verification Failed
                </span>
              );
            } else if (isExpired) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  Expired on {formatDisplayDate(cred.expiryDate)}
                </span>
              );
            } else if (expiringSoon) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Expiring Soon ({formatDisplayDate(cred.expiryDate)})
                </span>
              );
            }

            return (
              <div
                key={cred.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {cred.name}
                      </h3>
                      {statusBadge}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cred.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Issuing Authority
                        </span>
                        <span className="font-semibold text-slate-800">
                          {cred.issuingAuthority || 'Standard Authority'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Registration / License #
                        </span>
                        <span className="font-mono font-medium text-slate-800">
                          {cred.licenseNumber || 'None recorded'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Issue Date
                        </span>
                        <span className="text-slate-800 font-medium">
                          {formatDisplayDate(cred.issueDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Expiry Date
                        </span>
                        <span
                          className={`font-semibold ${
                            isExpired
                              ? 'text-rose-700'
                              : expiringSoon
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {formatDisplayDate(cred.expiryDate)}
                        </span>
                      </div>
                    </div>

                    {/* Verification Note */}
                    {cred.verificationNote && (
                      <div className="text-[11px] bg-white border border-slate-200 rounded-lg p-2.5 text-slate-600 mt-2">
                        <span className="font-semibold text-slate-700">Audit Note: </span>
                        {cred.verificationNote}
                        <span className="text-slate-400 ml-2">
                          (Updated {cred.lastUpdated})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Edit button */}
                  <div className="shrink-0 pt-1">
                    <button
                      onClick={() => handleOpenEdit(cred)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-teal-600 hover:text-teal-700 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update Credential</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Update Credential Record */}
      {editingCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Shiftwell CareVerify Record Update
                </div>
                <h3 className="text-base font-bold text-white">
                  Update: {editingCredential.name}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Staff: {employee.name} ({employee.id})
                </p>
              </div>
              <button
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCredential} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Verification Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Verification Status *
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as VerificationStatus)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="VERIFIED">Verified (Primary Registry Validated)</option>
                  <option value="PENDING">Pending Verification (Awaiting Sign-off)</option>
                  <option value="FAILED">Verification Failed (Discrepancy / Revoked)</option>
                  <option value="MISSING">Missing Document (Record absent)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  CareVerify requires "Verified" for scheduling authorization.
                </p>
              </div>

              {/* Expiry Date */}
              {editStatus !== 'MISSING' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={editExpiryDate}
                      onChange={e => setEditExpiryDate(e.target.value)}
                      required={editStatus === 'VERIFIED'}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Final day credential is valid.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={editIssueDate}
                      onChange={e => setEditIssueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Compliance Audit Note
                </label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Verified renewal document on KSNC portal on 19 Oct 2026."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  Save Credential & Revalidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
