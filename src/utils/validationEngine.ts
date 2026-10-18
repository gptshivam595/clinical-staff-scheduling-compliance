import {
  CredentialCheckResult,
  CredentialType,
  EligibilityEvaluation,
  Employee,
  RoleRequirements,
  RoleType,
  ValidationOutcome,
} from '../types';
import { formatDisplayDate, isExpiredForShift, isExpiringSoon } from './dateUtils';

/**
 * Single source of truth for Role-specific Mandatory Credential Requirements
 */
export const ROLE_REQUIREMENTS_MAP: RoleRequirements = {
  'Registered Nurse': {
    role: 'Registered Nurse',
    requiredCredentials: [
      {
        type: 'BLS',
        name: 'Basic Life Support (BLS) Certification',
        authority: 'Indian Resuscitation Council Federation (IRCF) / AHA',
        requiresExpiry: true,
      },
      {
        type: 'NURSING_COUNCIL',
        name: 'State Nursing Council Registration',
        authority: 'Karnataka State Nursing Council (KSNC)',
        requiresExpiry: true,
      },
    ],
  },
  'General Physician': {
    role: 'General Physician',
    requiredCredentials: [
      {
        type: 'BLS',
        name: 'Basic Life Support (BLS) Certification',
        authority: 'Indian Resuscitation Council Federation (IRCF)',
        requiresExpiry: true,
      },
      {
        type: 'MEDICAL_REGISTRATION',
        name: 'State Medical Council Registration',
        authority: 'Karnataka Medical Council (KMC)',
        requiresExpiry: true,
      },
    ],
  },
};

/**
 * Deterministic Credential Validation Engine
 * Evaluates whether an employee is legally and clinically compliant to work on the specified shift date.
 * Enforces fail-closed logic: any missing, unverified, pending, or expired credential strictly blocks assignment.
 * No AI or probabilistic logic — pure deterministic regulatory compliance.
 */
export function evaluateEligibility(
  employee: Employee,
  shiftDate: string,
  station: string = 'ICU / General Ward',
  startTime: string = '08:00',
  endTime: string = '16:30',
  referenceDemoDate: string = '2026-10-19'
): EligibilityEvaluation {
  const roleConfig = ROLE_REQUIREMENTS_MAP[employee.role] || ROLE_REQUIREMENTS_MAP['Registered Nurse'];
  const requiredList = roleConfig.requiredCredentials;

  const passedChecks: CredentialCheckResult[] = [];
  const failedChecks: CredentialCheckResult[] = [];
  let hasExpired = false;
  let hasMissing = false;
  let hasPending = false;
  let hasFailed = false;
  let hasUnknownExpiry = false;
  let hasExpiringSoonWarning = false;

  for (const requirement of requiredList) {
    const record = employee.credentials.find(c => c.credentialType === requirement.type);

    // Rule 1: Missing mandatory record
    if (!record || record.verificationStatus === 'MISSING') {
      hasMissing = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: 'MISSING',
        expiryDate: null,
        issueDate: null,
        message: `${requirement.name} record is absent from staff profile.`,
        reason: `Mandatory compliance document not uploaded or registered with CarePoint Clinics compliance desk.`,
      });
      continue;
    }

    // Rule 2: Pending verification review
    if (record.verificationStatus === 'PENDING') {
      hasPending = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: 'PENDING',
        expiryDate: record.expiryDate,
        issueDate: record.issueDate,
        message: `${requirement.name} is awaiting compliance verification sign-off.`,
        reason: `Uploaded record has not yet been verified by compliance. Assignments cannot be confirmed while review is pending.`,
      });
      continue;
    }

    // Rule 3: Verification failed / revoked
    if (record.verificationStatus === 'FAILED') {
      hasFailed = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: 'FAILED',
        expiryDate: record.expiryDate,
        issueDate: record.issueDate,
        message: `${requirement.name} failed verification review.`,
        reason: record.verificationNote || `Issuing authority check failed. Re-verification required before assignment.`,
      });
      continue;
    }

    // Rule 4: Unknown or missing expiry date when expiry is mandatory
    if (requirement.requiresExpiry && !record.expiryDate) {
      hasUnknownExpiry = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: record.verificationStatus,
        expiryDate: null,
        issueDate: record.issueDate,
        message: `${requirement.name} has no valid expiry date recorded.`,
        reason: `Clinical standards require a verified valid-through expiry date. Missing expiry cannot be treated as valid.`,
      });
      continue;
    }

    // Rule 5: Expired mandatory credential on or before shift date
    // Boundary rule: credential is valid through its stated expiry date.
    // If shiftDate > record.expiryDate, it expired prior to the shift.
    if (requirement.requiresExpiry && record.expiryDate && isExpiredForShift(record.expiryDate, shiftDate)) {
      hasExpired = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: 'VERIFIED',
        expiryDate: record.expiryDate,
        issueDate: record.issueDate,
        message: `${requirement.name} expired on ${formatDisplayDate(record.expiryDate)}.`,
        reason: `Credential expired on ${formatDisplayDate(record.expiryDate)}, prior to selected shift date (${formatDisplayDate(shiftDate)}). Assignment blocked by CareVerify guardrail.`,
      });
      continue;
    }

    // Check expiring soon warning (relative to reference demo date)
    const expiringSoon = record.expiryDate ? isExpiringSoon(record.expiryDate, referenceDemoDate) : false;
    if (expiringSoon) {
      hasExpiringSoonWarning = true;
    }

    // If passed all checks:
    passedChecks.push({
      credentialType: requirement.type,
      name: requirement.name,
      passed: true,
      status: 'VERIFIED',
      expiryDate: record.expiryDate,
      issueDate: record.issueDate,
      message: `Verified and valid through ${formatDisplayDate(record.expiryDate)}.`,
      isExpiringSoon: expiringSoon,
    });
  }

  // Derive overall outcome
  let overallOutcome: ValidationOutcome = 'ELIGIBLE';
  let overallReason = `All mandatory credentials for ${employee.role} are verified and valid on ${formatDisplayDate(shiftDate)}.`;

  if (failedChecks.length > 0) {
    if (hasExpired) {
      overallOutcome = 'BLOCKED_EXPIRED';
    } else if (hasPending && !hasMissing && !hasFailed) {
      overallOutcome = 'NEEDS_REVIEW';
    } else {
      overallOutcome = 'UNABLE_TO_VERIFY';
    }

    // Multi-failure diagnostic output: list all relevant failure reasons explicitly
    const failureSummaries = failedChecks.map(f => {
      if (f.status === 'MISSING') return `${f.name} is missing`;
      if (f.status === 'PENDING') return `${f.name} is pending review`;
      if (f.status === 'FAILED') return `${f.name} failed verification`;
      if (f.expiryDate && isExpiredForShift(f.expiryDate, shiftDate)) {
        return `${f.name} expired on ${formatDisplayDate(f.expiryDate)}`;
      }
      return `${f.name} is invalid`;
    });

    overallReason = `Assignment blocked: ${failureSummaries.join('; ')}. Verify and update the credential records before trying again.`;
  }

  return {
    overallOutcome,
    isEligible: overallOutcome === 'ELIGIBLE',
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    shiftDate,
    station,
    startTime,
    endTime,
    passedChecks,
    failedChecks,
    overallReason,
    evaluatedAt: new Date().toISOString(),
    hasExpiringSoonWarning,
    requiresReview: overallOutcome === 'NEEDS_REVIEW',
  };
}
