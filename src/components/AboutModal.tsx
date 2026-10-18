import React from 'react';
import { ShieldCheck, X, AlertTriangle, Building2, CheckCircle2, FileText, Lock } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Shiftwell CareVerify Prototype</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Shiftwell CareVerify
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Healthcare Credential Verification & Safe Scheduling
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-medium">
              <Building2 className="w-3.5 h-3.5" />
              <span>Built as a prototype for CarePoint Clinics as part of the Shiftwell product ecosystem</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* Tagline & Purpose */}
          <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-4">
            <div className="font-semibold text-teal-950 text-sm flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>Tagline: Every shift. Verified before assignment.</span>
            </div>
            <p className="text-xs text-teal-900">
              Shiftwell CareVerify embeds hard compliance guardrails directly into the clinical scheduling and shift-swap workflows. No manager can confirm an assignment or swap if any role-mandatory credential (e.g. BLS certificate or State Nursing Council registration) is expired, missing, or unverified on the shift date.
            </p>
          </div>

          {/* Business Context */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              Customer Context: CarePoint Clinics
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <li className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900">Scale:</span> 40 clinical locations, 900 active staff
              </li>
              <li className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900">Account Value:</span> ₹60 Lakh ARR (Renewal Dec 2026)
              </li>
              <li className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-1 sm:col-span-2">
                <span className="font-semibold text-slate-900">Challenge:</span> 2 documented audit findings involving nurses with expired BLS certificates while relying on manual Excel tracking.
              </li>
            </ul>
          </div>

          {/* Core Product Invariant */}
          <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-4">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-700" />
              Core Invariant Enforced
            </h3>
            <p className="text-xs text-amber-950 font-medium">
              "No assignment or swap may be confirmed if any mandatory credential required for that employee's role is missing, unverified, or invalid for the relevant shift date."
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Warnings alone are insufficient in clinical environments. Invalid scheduling actions are strictly prevented by design.
            </p>
          </div>

          {/* Prototype Disclosures (Part 17) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              Prototype Disclosures & Limitations
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
              <li>This application is an interactive product design prototype built for demonstration and evaluation.</li>
              <li>All employee records, IDs, licenses, and dates are completely fictional.</li>
              <li>Credential verification is simulated using deterministic calendar-date compliance rules.</li>
              <li>This prototype is not deployed at CarePoint Clinics and is not certified for clinical use.</li>
              <li>No real external issuing authorities (KSNC, IRCF, AHA, NMC) are queried.</li>
              <li>Browser local storage is used for state persistence; it is not a production audit or security log.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors"
          >
            Got it, return to CareVerify
          </button>
        </div>
      </div>
    </div>
  );
};
