import React from 'react';
import {
  ShieldCheck,
  Lock,
  Users,
  Phone,
  CheckCircle2,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { TransferValidateResponse, fmtPKR } from './types';

interface Props {
  result: TransferValidateResponse;
  onViewDetails: () => void;
  onRequestRelease: () => void;
  busy?: boolean;
}

/**
 * Shown when the circuit-breaker holds a transfer during a scam call.
 *
 * Deliberately NOT a red error. The person reading this has just been manipulated and is
 * frightened; the first thing they must understand is that their money is still theirs.
 * Green, calm, and the reassurance comes before any explanation.
 */
export const LockdownScreen: React.FC<Props> = ({
  result,
  onViewDetails,
  onRequestRelease,
  busy,
}) => {
  const held = result.held_amount ?? 0;
  const guardian = result.guardian;

  return (
    <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 overflow-hidden shadow-sm">
      {/* Reassurance first */}
      <div className="p-5 sm:p-7 text-center border-b border-emerald-200/70 dark:border-emerald-900/50">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mb-3">
          <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h3 className="text-lg sm:text-xl font-black text-emerald-900 dark:text-emerald-200">
          Your money is safe
        </h3>

        <p className="mt-2 text-sm text-emerald-900/80 dark:text-emerald-200/80 max-w-md mx-auto">
          {result.message_en}
        </p>
        <p
          className="mt-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300"
          dir="auto"
        >
          {result.message_ur}
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Amount in escrow */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            Funds held in safety escrow
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white whitespace-nowrap">
            {fmtPKR(held)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Still inside your own account. Nothing was sent to anyone.
          </p>
        </div>

        {/* Why */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <AlertOctagon className="w-3.5 h-3.5" />
            Why we paused this
          </div>
          <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
            A high-pressure call from an unknown number was active while this transfer was being
            made.
          </p>
          <ul className="mt-2 space-y-1">
            {result.reasons.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guardian */}
        {guardian && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" />
              Trusted contact
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {guardian.name} ({guardian.relationship})
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Alert sent via {guardian.channel}
              </span>
            </div>
          </div>
        )}

        {/* What to do next */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={onViewDetails}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            View details
          </button>

          <a
            href="tel:111000000"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Phone className="w-3.5 h-3.5" />
            Bank helpline 111-000-000
          </a>

          <button
            onClick={onRequestRelease}
            disabled={busy}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {busy ? 'Asking…' : 'I am safe — ask guardian'}
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
          A real bank will never ask for an OTP, PIN or password on a phone call.
        </p>
      </div>
    </div>
  );
};
