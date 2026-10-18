import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  CheckCircle2,
  AlertOctagon,
  FileQuestion,
  Search,
  Filter,
  CalendarPlus,
  Eye,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDisplayDate, isExpiredForShift, isExpiringSoon } from '../utils/dateUtils';
import { evaluateEligibility } from '../utils/validationEngine';
import { Employee, RoleType } from '../types';

export const CredentialOverview: React.FC = () => {
  const {
    employees,
    demoDate,
    setActiveTab,
    setSelectedEmployeeId,
    setAssignShiftPrefill,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | RoleType>('ALL');
  const [readinessFilter, setReadinessFilter] = useState<'ALL' | 'ELIGIBLE' | 'BLOCKED'>('ALL');
  const [credentialFilter, setCredentialFilter] = useState<'ALL' | 'EXPIRED' | 'MISSING' | 'PENDING'>('ALL');

  // Compute live KPI cards dynamically from current state and demo reference date
  const kpiData = useMemo(() => {
    const totalStaff = employees.length;

    let eligibleStaff = 0;
    let expiredCredentials = 0;
    let missingRecords = 0;

    employees.forEach(emp => {
      // Evaluate readiness for the demo reference date
      const evaluation = evaluateEligibility(emp, demoDate, 'ICU', '08:00', '16:30', demoDate);
      if (evaluation.isEligible) {
        eligibleStaff++;
      }

      emp.credentials.forEach(cred => {
        if (cred.verificationStatus === 'MISSING') {
          missingRecords++;
        }
        if (cred.expiryDate && isExpiredForShift(cred.expiryDate, demoDate)) {
          expiredCredentials++;
        }
      });
    });

    return {
      totalStaff,
      eligibleStaff,
      expiredCredentials,
      missingRecords,
    };
  }, [employees, demoDate]);

  // Filtered staff list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.clinicLocation.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Role filter
      if (roleFilter !== 'ALL' && emp.role !== roleFilter) {
        return false;
      }

      // Evaluation on demo date
      const evaluation = evaluateEligibility(emp, demoDate, 'ICU', '08:00', '16:30', demoDate);

      // Readiness filter
      if (readinessFilter === 'ELIGIBLE' && !evaluation.isEligible) {
        return false;
      }
      if (readinessFilter === 'BLOCKED' && evaluation.isEligible) {
        return false;
      }

      // Credential issue filter
      if (credentialFilter === 'EXPIRED') {
        const hasExpired = emp.credentials.some(c => c.expiryDate && isExpiredForShift(c.expiryDate, demoDate));
        if (!hasExpired) return false;
      } else if (credentialFilter === 'MISSING') {
        const hasMissing = emp.credentials.some(c => c.verificationStatus === 'MISSING');
        if (!hasMissing) return false;
      } else if (credentialFilter === 'PENDING') {
        const hasPending = emp.credentials.some(c => c.verificationStatus === 'PENDING');
        if (!hasPending) return false;
      }

      return true;
    });
  }, [employees, searchQuery, roleFilter, readinessFilter, credentialFilter, demoDate]);

  const handleViewProfile = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setActiveTab('staff');
  };

  const handleAssignShift = (employeeId: string) => {
    setAssignShiftPrefill({
      employeeId,
      shiftDate: demoDate,
    });
    setActiveTab('assign');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Shiftwell CareVerify</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Credential Overview
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Monitor staff readiness and prevent scheduling with invalid credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAssignShiftPrefill(null);
              setActiveTab('assign');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Assign Shift</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Staff
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {kpiData.totalStaff}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Clinical workforce in system</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Eligible Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Eligible Staff
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              {kpiData.eligibleStaff}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified on {formatDisplayDate(demoDate)}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Expired Credentials */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Expired Credentials
            </span>
            <div className="text-2xl font-extrabold text-rose-700 mt-1">
              {kpiData.expiredCredentials}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Strictly blocked from roster</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* Missing Records */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Missing Records
            </span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              {kpiData.missingRecords}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Mandatory documents absent</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <FileQuestion className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee ID, role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">All Roles</option>
            <option value="Registered Nurse">Registered Nurse</option>
            <option value="General Physician">General Physician</option>
          </select>

          {/* Readiness */}
          <select
            value={readinessFilter}
            onChange={e => setReadinessFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">All Readiness</option>
            <option value="ELIGIBLE">Eligible Only</option>
            <option value="BLOCKED">Blocked / Ineligible</option>
          </select>

          {/* Credential Status */}
          <select
            value={credentialFilter}
            onChange={e => setCredentialFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">All Credential States</option>
            <option value="EXPIRED">Has Expired</option>
            <option value="MISSING">Has Missing</option>
            <option value="PENDING">Has Pending</option>
          </select>

          {(searchQuery || roleFilter !== 'ALL' || readinessFilter !== 'ALL' || credentialFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('ALL');
                setReadinessFilter('ALL');
                setCredentialFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Staff Member</th>
                <th className="py-3.5 px-3">Role & Location</th>
                <th className="py-3.5 px-3">BLS Status</th>
                <th className="py-3.5 px-3">State Nursing Registration</th>
                <th className="py-3.5 px-3">Readiness Status</th>
                <th className="py-3.5 px-3">Next Expiry</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">No matching staff found</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Try clearing or adjusting search terms and filter criteria.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setRoleFilter('ALL');
                          setReadinessFilter('ALL');
                          setCredentialFilter('ALL');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const evaluation = evaluateEligibility(emp, demoDate, 'ICU', '08:00', '16:30', demoDate);
                  const bls = emp.credentials.find(c => c.credentialType === 'BLS');
                  const nsc = emp.credentials.find(c => c.credentialType === 'NURSING_COUNCIL');

                  // Helper for BLS pill
                  let blsBadge = <span className="text-slate-400">N/A</span>;
                  if (bls) {
                    if (bls.verificationStatus === 'MISSING') {
                      blsBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertOctagon className="w-3 h-3" /> Missing
                        </span>
                      );
                    } else if (bls.verificationStatus === 'PENDING') {
                      blsBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      );
                    } else if (bls.expiryDate && isExpiredForShift(bls.expiryDate, demoDate)) {
                      blsBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertOctagon className="w-3 h-3" /> Expired ({formatDisplayDate(bls.expiryDate)})
                        </span>
                      );
                    } else if (bls.expiryDate && isExpiringSoon(bls.expiryDate, demoDate)) {
                      blsBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Expiring Soon ({formatDisplayDate(bls.expiryDate)})
                        </span>
                      );
                    } else {
                      blsBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Valid ({formatDisplayDate(bls.expiryDate)})
                        </span>
                      );
                    }
                  }

                  // Helper for Nursing council pill
                  let nscBadge = <span className="text-slate-400">N/A</span>;
                  if (nsc) {
                    if (nsc.verificationStatus === 'MISSING') {
                      nscBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertOctagon className="w-3 h-3" /> Missing
                        </span>
                      );
                    } else if (nsc.verificationStatus === 'PENDING') {
                      nscBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      );
                    } else if (nsc.expiryDate && isExpiredForShift(nsc.expiryDate, demoDate)) {
                      nscBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertOctagon className="w-3 h-3" /> Expired
                        </span>
                      );
                    } else {
                      nscBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                      );
                    }
                  }

                  // Calculate earliest relevant expiry
                  const expiryDates = emp.credentials
                    .map(c => c.expiryDate)
                    .filter((d): d is string => !!d)
                    .sort();
                  const nextExpiry = expiryDates.length > 0 ? expiryDates[0] : null;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleViewProfile(emp.id)}
                    >
                      {/* Name & ID */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${emp.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            {emp.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {emp.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Location */}
                      <td className="py-4 px-3">
                        <div className="font-medium text-slate-800 text-xs">
                          {emp.role}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {emp.clinicLocation}
                        </div>
                      </td>

                      {/* BLS status */}
                      <td className="py-4 px-3">{blsBadge}</td>

                      {/* Nursing Council */}
                      <td className="py-4 px-3">{nscBadge}</td>

                      {/* Overall Readiness on demo date */}
                      <td className="py-4 px-3">
                        {evaluation.isEligible ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Eligible
                          </span>
                        ) : evaluation.overallOutcome === 'BLOCKED_EXPIRED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            Blocked (Expired)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            Blocked (Unverified)
                          </span>
                        )}
                      </td>

                      {/* Next Expiry */}
                      <td className="py-4 px-3 text-xs text-slate-600 font-medium">
                        {nextExpiry ? formatDisplayDate(nextExpiry) : 'None'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleViewProfile(emp.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="View Staff Profile & Credentials"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAssignShift(emp.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs border border-teal-200 transition-colors"
                            title="Schedule a shift for this staff member"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Assign</span>
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
    </div>
  );
};
