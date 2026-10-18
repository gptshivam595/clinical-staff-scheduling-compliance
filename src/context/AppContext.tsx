import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ActivityEvent,
  CredentialRecord,
  EligibilityEvaluation,
  Employee,
  ShiftAssignment,
} from '../types';
import {
  CLINIC_LOCATIONS,
  DEMO_REFERENCE_DATE,
  INITIAL_ACTIVITY_LOG,
  INITIAL_ASSIGNMENTS,
  INITIAL_EMPLOYEES,
} from '../data/initialData';
import { formatDisplayDate } from '../utils/dateUtils';
import { evaluateEligibility } from '../utils/validationEngine';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  employees: Employee[];
  assignments: ShiftAssignment[];
  activities: ActivityEvent[];
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  demoDate: string;
  setDemoDate: (date: string) => void;
  activeTab: 'overview' | 'staff' | 'assign' | 'roster' | 'swap' | 'activity';
  setActiveTab: (tab: 'overview' | 'staff' | 'assign' | 'roster' | 'swap' | 'activity') => void;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  assignShiftPrefill: { employeeId?: string; shiftDate?: string } | null;
  setAssignShiftPrefill: (prefill: { employeeId?: string; shiftDate?: string } | null) => void;
  
  // Actions
  updateCredential: (employeeId: string, credentialId: string, updates: Partial<CredentialRecord>) => boolean;
  addAssignment: (newAssignment: {
    employeeId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    station: string;
  }) => { success: boolean; error?: string; assignment?: ShiftAssignment };
  processSwap: (
    originalAssignmentId: string,
    replacementEmployeeId: string
  ) => { success: boolean; error?: string };
  resetDemoData: () => void;
  evaluateEmployee: (
    employeeId: string,
    shiftDate: string,
    station?: string,
    startTime?: string,
    endTime?: string
  ) => EligibilityEvaluation | null;
  
  // Feedback
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  dismissToast: (id: string) => void;

  // Preset Scenario Runner
  runPresetScenario: (scenarioKey: string) => void;
}

const STORAGE_KEY_PREFIX = 'shiftwell_careverify_';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence with localStorage fallback
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}employees`);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [assignments, setAssignments] = useState<ShiftAssignment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}assignments`);
      return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  });

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}activities`);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOG;
    } catch {
      return INITIAL_ACTIVITY_LOG;
    }
  });

  const [selectedLocation, setSelectedLocation] = useState<string>(CLINIC_LOCATIONS[0]);
  const [demoDate, setDemoDate] = useState<string>(DEMO_REFERENCE_DATE);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'assign' | 'roster' | 'swap' | 'activity'>('overview');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [assignShiftPrefill, setAssignShiftPrefill] = useState<{ employeeId?: string; shiftDate?: string } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}employees`, JSON.stringify(employees));
    } catch (e) {
      console.warn('Failed to save employees to localStorage', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}assignments`, JSON.stringify(assignments));
    } catch (e) {
      console.warn('Failed to save assignments to localStorage', e);
    }
  }, [assignments]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}activities`, JSON.stringify(activities));
    } catch (e) {
      console.warn('Failed to save activities to localStorage', e);
    }
  }, [activities]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addActivity = (event: Omit<ActivityEvent, 'id' | 'timestamp' | 'isoTimestamp'>) => {
    const now = new Date();
    const timeFormatted = `${formatDisplayDate(demoDate)}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newEvent: ActivityEvent = {
      ...event,
      id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: timeFormatted,
      isoTimestamp: now.toISOString(),
    };
    setActivities(prev => [newEvent, ...prev]);
  };

  const evaluateEmployee = (
    employeeId: string,
    shiftDate: string,
    station: string = 'ICU / General Ward',
    startTime: string = '08:00',
    endTime: string = '16:30'
  ): EligibilityEvaluation | null => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;
    return evaluateEligibility(employee, shiftDate, station, startTime, endTime, demoDate);
  };

  const updateCredential = (
    employeeId: string,
    credentialId: string,
    updates: Partial<CredentialRecord>
  ): boolean => {
    let targetEmployeeName = '';
    let targetCredentialName = '';

    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id !== employeeId) return emp;
        targetEmployeeName = emp.name;
        const updatedCredentials = emp.credentials.map(c => {
          if (c.id !== credentialId) return c;
          targetCredentialName = c.name;
          return {
            ...c,
            ...updates,
            lastUpdated: `${formatDisplayDate(demoDate)}`,
          };
        });
        return {
          ...emp,
          credentials: updatedCredentials,
        };
      })
    );

    addActivity({
      employeeId,
      employeeName: targetEmployeeName,
      action: 'CREDENTIAL_UPDATED',
      outcome: 'INFO',
      summary: `Credential Record Updated: ${targetEmployeeName} — ${targetCredentialName}`,
      details: `Record modified: Expiry: ${formatDisplayDate(updates.expiryDate)}, Status: ${updates.verificationStatus}. Re-evaluation of scheduling eligibility will immediately apply.`,
    });

    addToast('success', 'Credential Record Updated', `${targetCredentialName} has been updated and eligibility re-evaluated.`);
    return true;
  };

  const addAssignment = (newAssignmentData: {
    employeeId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    station: string;
  }): { success: boolean; error?: string; assignment?: ShiftAssignment } => {
    const employee = employees.find(e => e.id === newAssignmentData.employeeId);
    if (!employee) {
      return { success: false, error: 'Employee not found.' };
    }

    // MANDATORY REVALIDATION AT CONFIRMATION
    const evaluation = evaluateEligibility(
      employee,
      newAssignmentData.shiftDate,
      newAssignmentData.station,
      newAssignmentData.startTime,
      newAssignmentData.endTime,
      demoDate
    );

    if (!evaluation.isEligible) {
      addActivity({
        employeeId: employee.id,
        employeeName: employee.name,
        action: 'ASSIGNMENT_BLOCKED',
        outcome: 'BLOCKED',
        summary: `Assignment Blocked: ${employee.name} for ${formatDisplayDate(newAssignmentData.shiftDate)}`,
        details: evaluation.overallReason,
        shiftDate: newAssignmentData.shiftDate,
        station: newAssignmentData.station,
      });
      addToast('error', 'Assignment Blocked by CareVerify', evaluation.overallReason);
      return { success: false, error: evaluation.overallReason };
    }

    // Duplicate check: Same employee already has a confirmed assignment on this date and station
    const isDuplicate = assignments.some(
      a =>
        a.employeeId === employee.id &&
        a.shiftDate === newAssignmentData.shiftDate &&
        a.status === 'CONFIRMED'
    );

    if (isDuplicate) {
      const err = `${employee.name} is already assigned to a confirmed shift on ${formatDisplayDate(newAssignmentData.shiftDate)}.`;
      addToast('error', 'Duplicate Shift Conflict', err);
      return { success: false, error: err };
    }

    const confirmedAtFormatted = `${formatDisplayDate(demoDate)}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newAssignment: ShiftAssignment = {
      id: `ASGN-${Date.now().toString().slice(-4)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      clinicLocation: employee.clinicLocation || selectedLocation,
      shiftDate: newAssignmentData.shiftDate,
      startTime: newAssignmentData.startTime,
      endTime: newAssignmentData.endTime,
      station: newAssignmentData.station,
      status: 'CONFIRMED',
      verifiedAt: confirmedAtFormatted,
      evaluationSnapshot: {
        passedCredentials: evaluation.passedChecks.map(c => `${c.name} (Valid through ${formatDisplayDate(c.expiryDate)})`),
        enforcementRule: 'Shiftwell CareVerify: Verified before assignment',
      },
    };

    setAssignments(prev => [newAssignment, ...prev]);

    addActivity({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'ASSIGNMENT_CONFIRMED',
      outcome: 'SUCCESS',
      summary: `Shift Assignment Confirmed: ${employee.name} for ${formatDisplayDate(newAssignmentData.shiftDate)}`,
      details: `Shift confirmed at ${newAssignmentData.station} (${newAssignmentData.startTime}-${newAssignmentData.endTime}). All credentials verified compliant.`,
      shiftDate: newAssignmentData.shiftDate,
      station: newAssignmentData.station,
    });

    addToast('success', 'Shift Assignment Confirmed', `Successfully scheduled ${employee.name} on ${formatDisplayDate(newAssignmentData.shiftDate)} at ${newAssignmentData.station}.`);
    return { success: true, assignment: newAssignment };
  };

  const processSwap = (
    originalAssignmentId: string,
    replacementEmployeeId: string
  ): { success: boolean; error?: string } => {
    const originalAssignment = assignments.find(a => a.id === originalAssignmentId);
    if (!originalAssignment) {
      return { success: false, error: 'Original shift assignment not found.' };
    }

    const replacementEmployee = employees.find(e => e.id === replacementEmployeeId);
    if (!replacementEmployee) {
      return { success: false, error: 'Replacement employee not found.' };
    }

    // MANDATORY SAME VALIDATION ENGINE FOR SWAP
    const evaluation = evaluateEligibility(
      replacementEmployee,
      originalAssignment.shiftDate,
      originalAssignment.station,
      originalAssignment.startTime,
      originalAssignment.endTime,
      demoDate
    );

    if (!evaluation.isEligible) {
      addActivity({
        employeeId: replacementEmployee.id,
        employeeName: replacementEmployee.name,
        action: 'SWAP_BLOCKED',
        outcome: 'BLOCKED',
        summary: `Shift Swap Blocked: Replacement ${replacementEmployee.name} ineligible for ${formatDisplayDate(originalAssignment.shiftDate)}`,
        details: `Swap rejected: ${evaluation.overallReason}`,
        shiftDate: originalAssignment.shiftDate,
        station: originalAssignment.station,
      });
      addToast('error', 'Shift Swap Blocked', `Replacement staff ${replacementEmployee.name} failed credential validation: ${evaluation.overallReason}`);
      return { success: false, error: evaluation.overallReason };
    }

    // Check if replacement employee already has a confirmed shift on that day
    const alreadyWorking = assignments.some(
      a =>
        a.id !== originalAssignmentId &&
        a.employeeId === replacementEmployee.id &&
        a.shiftDate === originalAssignment.shiftDate &&
        a.status === 'CONFIRMED'
    );
    if (alreadyWorking) {
      const err = `${replacementEmployee.name} already has a confirmed shift on ${formatDisplayDate(originalAssignment.shiftDate)}.`;
      addToast('error', 'Swap Conflict', err);
      return { success: false, error: err };
    }

    const swappedAtFormatted = `${formatDisplayDate(demoDate)}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setAssignments(prev =>
      prev.map(a => {
        if (a.id !== originalAssignmentId) return a;
        return {
          ...a,
          employeeId: replacementEmployee.id,
          employeeName: replacementEmployee.name,
          role: replacementEmployee.role,
          clinicLocation: replacementEmployee.clinicLocation,
          status: 'CONFIRMED',
          swappedWith: {
            originalEmployeeId: originalAssignment.employeeId,
            originalEmployeeName: originalAssignment.employeeName,
            swappedAt: swappedAtFormatted,
          },
          evaluationSnapshot: {
            passedCredentials: evaluation.passedChecks.map(c => `${c.name} (Valid through ${formatDisplayDate(c.expiryDate)})`),
            enforcementRule: 'Shiftwell CareVerify: Verified before swap confirmation',
          },
        };
      })
    );

    addActivity({
      employeeId: replacementEmployee.id,
      employeeName: replacementEmployee.name,
      action: 'SWAP_CONFIRMED',
      outcome: 'SUCCESS',
      summary: `Shift Swap Confirmed: ${replacementEmployee.name} replaced ${originalAssignment.employeeName}`,
      details: `Shift on ${formatDisplayDate(originalAssignment.shiftDate)} (${originalAssignment.station}) safely swapped. Replacement credentials verified compliant.`,
      shiftDate: originalAssignment.shiftDate,
      station: originalAssignment.station,
    });

    addToast('success', 'Shift Swap Confirmed', `${replacementEmployee.name} now assigned in place of ${originalAssignment.employeeName} for ${formatDisplayDate(originalAssignment.shiftDate)}.`);
    return { success: true };
  };

  const resetDemoData = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}employees`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}assignments`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}activities`);

    setEmployees(INITIAL_EMPLOYEES);
    setAssignments(INITIAL_ASSIGNMENTS);
    setActivities(INITIAL_ACTIVITY_LOG);
    setDemoDate(DEMO_REFERENCE_DATE);
    setSelectedEmployeeId(null);
    setAssignShiftPrefill(null);

    addActivity({
      action: 'DATA_RESET',
      outcome: 'INFO',
      summary: 'Prototype Demo Dataset Restored',
      details: 'Restored initial CarePoint Clinics staff records, credentials, confirmed roster, and baseline activity log.',
    });

    addToast('info', 'Demo Data Reset', 'Initial sample records, credential statuses, and roster restored.');
  };

  const runPresetScenario = (scenarioKey: string) => {
    switch (scenarioKey) {
      case 'TEST_A': // Ananya Sharma - 19 Oct 2026 - Eligible
        setAssignShiftPrefill({ employeeId: 'CP-001', shiftDate: '2026-10-19' });
        setActiveTab('assign');
        addToast('info', 'Scenario Loaded: Test A (Valid Assignment)', 'Ananya Sharma on 19 Oct 2026. Expect: Eligible for assignment.');
        break;

      case 'TEST_B': // Rohan Verma - 21 Oct 2026 - Blocked Expired BLS
        setAssignShiftPrefill({ employeeId: 'CP-002', shiftDate: '2026-10-21' });
        setActiveTab('assign');
        addToast('warning', 'Scenario Loaded: Test B (Expired Credential)', 'Rohan Verma on 21 Oct 2026. Expect: Blocked (BLS expired 10 Oct 2026).');
        break;

      case 'TEST_C': // Priya Das - Missing nursing registration
        setAssignShiftPrefill({ employeeId: 'CP-003', shiftDate: '2026-10-19' });
        setActiveTab('assign');
        addToast('warning', 'Scenario Loaded: Test C (Missing Credential)', 'Priya Das on 19 Oct 2026. Expect: Blocked (Nursing council missing).');
        break;

      case 'TEST_D_1': // Meera Singh - 20 Oct 2026 (Valid boundary day)
        setAssignShiftPrefill({ employeeId: 'CP-004', shiftDate: '2026-10-20' });
        setActiveTab('assign');
        addToast('info', 'Scenario Loaded: Test D-1 (Boundary Pass)', 'Meera Singh on 20 Oct 2026. Expect: Eligible (BLS valid through 20 Oct).');
        break;

      case 'TEST_D_2': // Meera Singh - 21 Oct 2026 (Expired boundary day)
        setAssignShiftPrefill({ employeeId: 'CP-004', shiftDate: '2026-10-21' });
        setActiveTab('assign');
        addToast('warning', 'Scenario Loaded: Test D-2 (Boundary Fail)', 'Meera Singh on 21 Oct 2026. Expect: Blocked (BLS expired 20 Oct).');
        break;

      case 'TEST_E': // Arjun Nair - Pending verification
        setAssignShiftPrefill({ employeeId: 'CP-005', shiftDate: '2026-10-19' });
        setActiveTab('assign');
        addToast('warning', 'Scenario Loaded: Test E (Pending Verification)', 'Arjun Nair on 19 Oct 2026. Expect: Blocked (BLS pending review).');
        break;

      case 'TEST_F': // Swap test
        setActiveTab('swap');
        addToast('info', 'Scenario Loaded: Test F (Shift Swap Protection)', 'Testing shift swap guardrail with replacement employee verification.');
        break;

      case 'TEST_G': // Credential update and revalidation
        setSelectedEmployeeId('CP-002');
        setActiveTab('staff');
        addToast('info', 'Scenario Loaded: Test G (Credential Update)', 'Opened Rohan Verma (CP-002). Click "Update Credential" on BLS to verify immediate re-evaluation.');
        break;

      case 'TEST_H': // Stale result protection
        setAssignShiftPrefill({ employeeId: 'CP-001', shiftDate: '2026-10-19' });
        setActiveTab('assign');
        addToast('info', 'Scenario Loaded: Test H (Stale Result Protection)', 'Loaded Ananya Sharma on 19 Oct. Check eligibility, then modify the date to observe stale invalidation.');
        break;

      case 'TEST_I': // Workforce reconciliation & filters
        setActiveTab('overview');
        addToast('info', 'Scenario Loaded: Test I (Workforce Reconciliation)', 'Navigated to Overview. All 6 staff records are accounted for and reconciled.');
        break;

      case 'TEST_J': // Persistence and reset
        setActiveTab('overview');
        addToast('info', 'Scenario Loaded: Test J (Persistence & Reset)', 'Active data is saved in localStorage. Use "Reset Demo Data" to restore initial baseline.');
        break;

      default:
        break;
    }
  };

  return (
    <AppContext.Provider
      value={{
        employees,
        assignments,
        activities,
        selectedLocation,
        setSelectedLocation,
        demoDate,
        setDemoDate,
        activeTab,
        setActiveTab,
        selectedEmployeeId,
        setSelectedEmployeeId,
        assignShiftPrefill,
        setAssignShiftPrefill,
        updateCredential,
        addAssignment,
        processSwap,
        resetDemoData,
        evaluateEmployee,
        toasts,
        addToast,
        dismissToast,
        runPresetScenario,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
