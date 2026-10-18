import { evaluateEligibility } from './validationEngine';
import { INITIAL_EMPLOYEES } from '../data/initialData';
import { Employee } from '../types';

function runTests() {
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
      failedCount++;
    }
  }

  console.log('--- Running Shiftwell CareVerify Validation Engine Tests ---');

  const ananya = INITIAL_EMPLOYEES.find(e => e.id === 'CP-001')!;
  const rohan = INITIAL_EMPLOYEES.find(e => e.id === 'CP-002')!;
  const priya = INITIAL_EMPLOYEES.find(e => e.id === 'CP-003')!;
  const meera = INITIAL_EMPLOYEES.find(e => e.id === 'CP-004')!;
  const arjun = INITIAL_EMPLOYEES.find(e => e.id === 'CP-005')!;
  const kavya = INITIAL_EMPLOYEES.find(e => e.id === 'CP-006')!;

  // Test 1: Scenario A - Valid staff member on 19 Oct 2026
  console.log('\n[Group 1: Valid Staff Members]');
  const resAnanya = evaluateEligibility(ananya, '2026-10-19');
  assert(resAnanya.isEligible === true, 'Ananya Sharma is ELIGIBLE for 19 Oct 2026');
  assert(resAnanya.overallOutcome === 'ELIGIBLE', 'Outcome is ELIGIBLE');
  assert(resAnanya.passedChecks.length === 2, 'Both required credentials passed');
  assert(resAnanya.failedChecks.length === 0, 'Zero failed checks for valid staff');

  const resKavya = evaluateEligibility(kavya, '2026-10-19');
  assert(resKavya.isEligible === true, 'Kavya Patel is ELIGIBLE for 19 Oct 2026');

  // Test 2: Scenario B - Expired BLS (Rohan Verma)
  console.log('\n[Group 2: Expired Credential]');
  const resRohan = evaluateEligibility(rohan, '2026-10-21');
  assert(resRohan.isEligible === false, 'Rohan Verma is BLOCKED for 21 Oct 2026');
  assert(resRohan.overallOutcome === 'BLOCKED_EXPIRED', 'Outcome is BLOCKED_EXPIRED');
  assert(resRohan.failedChecks.some(f => f.credentialType === 'BLS'), 'BLS is in failedChecks');
  assert(resRohan.overallReason.includes('expired'), 'Reason explains expired BLS');

  // Test 3: Scenario C - Missing Credential (Priya Das)
  console.log('\n[Group 3: Missing Credential]');
  const resPriya = evaluateEligibility(priya, '2026-10-19');
  assert(resPriya.isEligible === false, 'Priya Das is BLOCKED for 19 Oct 2026');
  assert(resPriya.overallOutcome === 'UNABLE_TO_VERIFY', 'Outcome is UNABLE_TO_VERIFY');
  assert(resPriya.failedChecks.some(f => f.status === 'MISSING'), 'Missing record identified in failedChecks');
  assert(resPriya.overallReason.includes('missing'), 'Reason explains missing registration');

  // Test 4: Scenario D - Pending Verification (Arjun Nair)
  console.log('\n[Group 4: Pending Verification Review]');
  const resArjun = evaluateEligibility(arjun, '2026-10-19');
  assert(resArjun.isEligible === false, 'Arjun Nair is BLOCKED while review is pending');
  assert(resArjun.requiresReview === true, 'Flagged as requiresReview');
  assert(resArjun.overallOutcome === 'NEEDS_REVIEW', 'Outcome is NEEDS_REVIEW');
  assert(resArjun.failedChecks.some(f => f.status === 'PENDING'), 'Pending check identified');

  // Test 5: Scenario E - Expiry Boundary Handling (Meera Singh)
  console.log('\n[Group 5: Expiry Boundary (Meera Singh - BLS expires 20 Oct 2026)]');
  const resMeeraValidDay = evaluateEligibility(meera, '2026-10-20');
  assert(resMeeraValidDay.isEligible === true, 'Meera Singh is ELIGIBLE on the exact expiry day (20 Oct 2026)');
  assert(resMeeraValidDay.passedChecks.some(c => c.credentialType === 'BLS'), 'BLS passes check on 20 Oct 2026');
  assert(resMeeraValidDay.hasExpiringSoonWarning === true, 'Expiring soon warning flagged on 20 Oct');

  const resMeeraExpiredDay = evaluateEligibility(meera, '2026-10-21');
  assert(resMeeraExpiredDay.isEligible === false, 'Meera Singh is BLOCKED on the day after expiry (21 Oct 2026)');
  assert(resMeeraExpiredDay.overallOutcome === 'BLOCKED_EXPIRED', 'Outcome is BLOCKED_EXPIRED for 21 Oct');

  // Test 6: Multiple Failures in a single check
  console.log('\n[Group 6: Multiple Failures]');
  const multiFailEmployee: Employee = {
    ...ananya,
    id: 'TEST-MULTI',
    name: 'Multi Failure Test Employee',
    credentials: [
      {
        id: 'CR-M-1',
        credentialType: 'BLS',
        name: 'Basic Life Support (BLS)',
        description: 'BLS',
        issueDate: '2024-01-01',
        expiryDate: '2026-10-10', // Expired!
        verificationStatus: 'VERIFIED',
        lastUpdated: '10 Oct 2026',
      },
      {
        id: 'CR-M-2',
        credentialType: 'NURSING_COUNCIL',
        name: 'State Nursing Council Registration',
        description: 'Nursing Council',
        issueDate: null,
        expiryDate: null,
        verificationStatus: 'MISSING', // Missing!
        lastUpdated: '10 Oct 2026',
      },
    ],
  };
  const resMulti = evaluateEligibility(multiFailEmployee, '2026-10-19');
  assert(resMulti.isEligible === false, 'Multi-failure employee is BLOCKED');
  assert(resMulti.failedChecks.length === 2, 'Both failures are captured in failedChecks');
  assert(resMulti.overallReason.includes('expired') && resMulti.overallReason.includes('missing'), 'Reason mentions both expired BLS and missing registration');

  // Test 7: Missing Expiry on a credential that requires expiry
  console.log('\n[Group 7: Missing Expiry on Mandatory Credential]');
  const noExpiryEmployee: Employee = {
    ...ananya,
    credentials: ananya.credentials.map(c =>
      c.credentialType === 'BLS' ? { ...c, expiryDate: null } : c
    ),
  };
  const resNoExpiry = evaluateEligibility(noExpiryEmployee, '2026-10-19');
  assert(resNoExpiry.isEligible === false, 'Missing expiry date fails closed');
  assert(resNoExpiry.failedChecks.some(f => f.credentialType === 'BLS'), 'BLS failed due to missing expiry');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passedCount} passed, ${failedCount} failed`);
  console.log(`========================================`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
