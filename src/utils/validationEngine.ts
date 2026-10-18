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
  let hasMissingOrUnverified = false;
  let hasExpiringSoonWarning = false;

  for (const requirement of requiredList) {
    const record = employee.credentials.find(c => c.credentialType === requirement.type);

    // Rule 1: Missing mandatory record
    if (!record || record.verificationStatus === 'MISSING') {
      hasMissingOrUnverified = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: 'MISSING',
        expiryDate: null,
        issueDate: null,
        message: `${requirement.name} record is completely missing from staff profile.`,
        reason: `Mandatory compliance document not uploaded or registered with CarePoint Clinics compliance desk.`,
      });
      continue;
    }

    // Rule 2: Pending verification
    if (record.verificationStatus === 'PENDING') {
      hasMissingOrUnverified = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: 'PENDING',
        expiryDate: record.expiryDate,
        issueDate: record.issueDate,
        message: `${requirement.name} is currently pending compliance verification.`,
        reason: `Record was uploaded but awaits clinical administrator sign-off. Cannot assign until verified.`,
      });
      continue;
    }

    // Rule 3: Verification failed
    if (record.verificationStatus === 'FAILED') {
      hasMissingOrUnverified = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: 'FAILED',
        expiryDate: record.expiryDate,
        issueDate: record.issueDate,
        message: `${requirement.name} failed verification review.`,
        reason: record.verificationNote || `Issuing authority verification failed. Re-verification required.`,
      });
      continue;
    }

    // Rule 4: Unknown expiry date when required
    if (requirement.requiresExpiry && !record.expiryDate) {
      hasMissingOrUnverified = true;
      failedChecks.push({
        credentialType: requirement.type,
        name: requirement.name,
        passed: false,
        status: record.verificationStatus,
        expiryDate: null,
        issueDate: record.issueDate,
        message: `${requirement.name} has no valid expiry date recorded.`,
        reason: `Regulatory standards require a verified valid-through expiry date.`,
      });
      continue;
    }

    // Rule 5: Expired mandatory credential on or before shift date
    // Note: If shiftDate > record.expiryDate, it expired prior to the shift!
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
        reason: `Credential expired prior to selected shift date (${formatDisplayDate(shiftDate)}). Assignment blocked by CareVerify guardrail.`,
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

  if (hasExpired) {
    overallOutcome = 'BLOCKED_EXPIRED';
    const expiredNames = failedChecks
      .filter(f => f.expiryDate && isExpiredForShift(f.expiryDate, shiftDate))
      .map(f => f.name)
      .join(', ');
    overallReason = `This employee cannot be assigned to this shift because a required credential (${expiredNames}) has expired before ${formatDisplayDate(shiftDate)}. Verify and update the credential record before trying again.`;
  } else if (hasMissingOrUnverified) {
    overallOutcome = 'UNABLE_TO_VERIFY';
    const unverifiedNames = failedChecks.map(f => `${f.name} (${f.status})`).join(', ');
    overallReason = `A required credential is missing or has not been verified (${unverifiedNames}). This assignment cannot be confirmed until the required record is available and verified.`;
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
  };
}
