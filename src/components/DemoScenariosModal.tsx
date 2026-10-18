import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertOctagon, AlertTriangle, ArrowRight, Play, X, RotateCcw } from 'lucide-react';

interface DemoScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoScenariosModal: React.FC<DemoScenariosModalProps> = ({ isOpen, onClose }) => {
  const { runPresetScenario, resetDemoData } = useApp();

  if (!isOpen) return null;

  const scenarios = [
    {
      key: 'TEST_A',
      badge: 'Test A',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Valid Assignment — Eligible',
      description: 'Ananya Sharma on 19 Oct 2026. Both BLS and Nursing Council credentials are verified & valid.',
      expected: 'Outcome: ELIGIBLE. "Confirm Assignment" button is active.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    {
      key: 'TEST_B',
      badge: 'Test B',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      title: 'Expired Certificate — Hard Block',
      description: 'Rohan Verma on 21 Oct 2026. BLS expired on 10 Oct 2026.',
      expected: 'Outcome: ASSIGNMENT BLOCKED. "Confirm Assignment" is disabled.',
      icon: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    {
      key: 'TEST_C',
      badge: 'Test C',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      title: 'Missing Mandatory Credential — Blocked',
      description: 'Priya Das on 19 Oct 2026. State Nursing Council registration is completely missing.',
      expected: 'Outcome: UNABLE TO VERIFY. Confirmation strictly disabled.',
      icon: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    {
      key: 'TEST_D_1',
      badge: 'Test D-1',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Boundary Check (Valid Day) — Eligible',
      description: 'Meera Singh on 20 Oct 2026. BLS expires on 20 Oct 2026 (last valid day).',
      expected: 'Outcome: ELIGIBLE on 20 Oct 2026 with expiring soon warning.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    {
      key: 'TEST_D_2',
      badge: 'Test D-2',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      title: 'Boundary Check (Expired Day) — Blocked',
      description: 'Meera Singh on 21 Oct 2026. BLS expired on 20 Oct 2026.',
      expected: 'Outcome: ASSIGNMENT BLOCKED for 21 Oct 2026.',
      icon: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    {
      key: 'TEST_E',
      badge: 'Test E',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      title: 'Pending Verification — Guardrail Block',
      description: 'Arjun Nair on 19 Oct 2026. BLS certificate is uploaded but pending review.',
      expected: 'Outcome: UNABLE TO VERIFY. Blocked until verified by compliance.',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    {
      key: 'TEST_F',
      badge: 'Test F',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      title: 'Shift Swap Guardrail Protection',
      description: 'Attempt swapping an active shift with an employee with expired or missing credentials.',
      expected: 'Outcome: Swap eligibility checks replacement credentials with same invariant.',
      icon: <ArrowRight className="w-5 h-5 text-blue-600 shrink-0" />,
    },
  ];

  const handleSelect = (key: string) => {
    runPresetScenario(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Test Harness
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Shiftwell CareVerify Demo Scenarios
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              One-click testing for all specification requirements (Tests A through J).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {scenarios.map(sc => (
            <div
              key={sc.key}
              onClick={() => handleSelect(sc.key)}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:bg-slate-50/80 cursor-pointer transition-all flex items-start justify-between gap-4 group"
            >
              <div className="flex items-start gap-3">
                {sc.icon}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-900 group-hover:text-teal-900 transition-colors">
                      {sc.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{sc.description}</p>
                  <p className="text-xs font-medium text-slate-700 bg-slate-100/70 inline-block px-2 py-0.5 rounded text-[11px]">
                    {sc.expected}
                  </p>
                </div>
              </div>
              <button
                className="shrink-0 p-2 text-slate-400 group-hover:text-teal-600 rounded-lg group-hover:bg-teal-50 transition-colors"
                aria-label={`Run ${sc.badge}`}
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Reset all demo records, assignments, and activity events to original state?')) {
                resetDemoData();
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-rose-700 font-medium hover:bg-rose-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
