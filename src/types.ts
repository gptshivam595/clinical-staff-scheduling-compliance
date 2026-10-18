/**
 * Shiftwell CareVerify
 * Healthcare Credential Verification & Safe Scheduling
 * Built as a prototype for CarePoint Clinics as part of the Shiftwell product ecosystem.
 * Tagline: Every shift. Verified before assignment.
 */

export type RoleType = 'Registered Nurse' | 'General Physician' | 'Clinical Specialist';

export type CredentialType = 'BLS' | 'NURSING_COUNCIL' | 'MEDICAL_REGISTRATION';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'FAILED' | 'MISSING';

export interface CredentialRecord {
  id: string;
  credentialType: CredentialType;
  name: string;
  description: string;
  issueDate: string | null; // ISO YYYY-MM-DD
  expiryDate: string | null; // ISO YYYY-MM-DD
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  licenseNumber?: string;
  issuingAuthority?: string;
  lastUpdated: string; // ISO string or human string
}

export interface Employee {
  id: string; // e.g. "CP-001"
  name: string;
  role: RoleType;
  clinicLocation: string;
  email: string;
  phone: string;
  requiredCredentials: CredentialType[];
  credentials: CredentialRecord[];
  avatarBg: string;
}

export type ValidationOutcome =
  | 'ELIGIBLE'
  | 'BLOCKED_EXPIRED'
  | 'UNABLE_TO_VERIFY'
  | 'NEEDS_REVIEW';

export interface CredentialCheckResult {
  credentialType: CredentialType;
  name: string;
  passed: boolean;
  status: VerificationStatus;
  expiryDate: string | null;
  issueDate: string | null;
  message: string;
  reason?: string;
  isExpiringSoon?: boolean; // Expiring within 30 days of reference date
}

export interface EligibilityEvaluation {
  overallOutcome: ValidationOutcome;
  isEligible: boolean;
  employeeId: string;
  employeeName: string;
  role: RoleType;
  shiftDate: string; // ISO YYYY-MM-DD
  station: string;
  startTime: string;
  endTime: string;
  passedChecks: CredentialCheckResult[];
  failedChecks: CredentialCheckResult[];
  overallReason: string;
  evaluatedAt: string;
  hasExpiringSoonWarning: boolean;
  requiresReview: boolean;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  role: RoleType;
  clinicLocation: string;
  shiftDate: string; // ISO YYYY-MM-DD
  startTime: string; // "08:00"
  endTime: string; // "16:30"
  station: string; // "ICU", "Emergency Ward", "Outpatient", "Pediatrics"
  status: 'CONFIRMED' | 'SWAPPED' | 'CANCELLED';
  swappedWith?: {
    originalEmployeeId: string;
    originalEmployeeName: string;
    swappedAt: string;
  };
  verifiedAt: string;
  evaluationSnapshot: {
    passedCredentials: string[];
    enforcementRule: string;
  };
}

export type ActivityActionType =
  | 'ELIGIBILITY_CHECK_PASSED'
  | 'ELIGIBILITY_CHECK_BLOCKED'
  | 'ASSIGNMENT_CONFIRMED'
  | 'ASSIGNMENT_BLOCKED'
  | 'CREDENTIAL_UPDATED'
  | 'SWAP_CONFIRMED'
  | 'SWAP_BLOCKED'
  | 'DATA_RESET';

export interface ActivityEvent {
  id: string;
  timestamp: string; // Display string like "19 Oct 2026, 09:42"
  isoTimestamp: string;
  employeeId?: string;
  employeeName?: string;
  action: ActivityActionType;
  outcome: 'SUCCESS' | 'BLOCKED' | 'WARNING' | 'INFO';
  summary: string;
  details: string;
  shiftDate?: string;
  station?: string;
}

export interface RoleRequirements {
  [key: string]: {
    role: RoleType;
    requiredCredentials: {
      type: CredentialType;
      name: string;
      authority: string;
      requiresExpiry: boolean;
    }[];
  };
}
