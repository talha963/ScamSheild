import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Send,
  Receipt,
  PlusCircle,
  Users,
  Wifi,
  Clock,
  PhoneCall,
  PhoneOff,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  SlidersHorizontal,
  RotateCcw,
  Lock,
  X,
} from 'lucide-react';
import { LockdownScreen } from './LockdownScreen';
import {
  AccountStatus,
  BANKS,
  HoldActionResponse,
  TIER_META,
  TransferValidateResponse,
  Txn,
  fmtPKR,
} from './types';

const ACCOUNT_ID = 'acc_pk_9941';

const RECENT: Txn[] = [
  { id: 't1', name: 'K-Electric', detail: 'Utility bill', amount: 8450, credit: false, when: 'Today, 09:12' },
  { id: 't2', name: 'Salary — Descon Engineering', detail: 'Monthly credit', amount: 185000, credit: true, when: 'Yesterday' },
  { id: 't3', name: 'Imtiaz Super Market', detail: 'Debit card', amount: 6230, credit: false, when: '2 days ago' },
  { id: 't4', name: 'Hamza Tariq', detail: 'Raast transfer', amount: 15000, credit: false, when: '3 days ago' },
];

/**
 * Smart Banking Protection — a mobile-banking app with the graduated circuit-breaker built in.
 *
 * The point it demonstrates: the bank can see a transfer is being made DURING a scam call, and
 * can hold the money inside the customer's own account instead of letting it reach the scammer.
 */
export const BankGuard: React.FC = () => {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [result, setResult] = useState<TransferValidateResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Transfer form
  const [bank, setBank] = useState(BANKS[0]);
  const [iban, setIban] = useState('PK44MBL00098472910');
  const [amount, setAmount] = useState('85000');
  const [purpose, setPurpose] = useState('Family support');

  // Judge / tester controls
  const [callActive, setCallActive] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const tier = status?.circuit_breaker_tier ?? 0;
  const meta = TIER_META[tier];

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/bank/account/${ACCOUNT_ID}/status`);
      if (r.ok) setStatus(await r.json());
    } catch {
      /* offline: keep showing the last known state */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Tier 1 cooling-off countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  /**
   * `overrides` matters: the demo buttons set state and submit in the same gesture, and React
   * state is not visible to this closure until the next render. Passing the values explicitly
   * avoids sending a stale "no call active".
   */
  const submitTransfer = async (overrides?: {
    callActive?: boolean;
    riskScore?: number;
    amount?: number;
  }) => {
    const isCall = overrides?.callActive ?? callActive;
    const risk = overrides?.riskScore ?? riskScore;
    const amt = overrides?.amount ?? (Number(amount) || 0);

    setBusy(true);
    setResult(null);
    try {
      const r = await fetch('/bank/transfers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: ACCOUNT_ID,
          recipient_iban: iban,
          recipient_bank: bank,
          amount: amt,
          purpose,
          is_call_active: isCall,
          active_call_risk_score: isCall ? risk : 0,
        }),
      });
      const data: TransferValidateResponse = await r.json();
      setResult(data);
      setSendOpen(false);
      if (data.action === 'COOLING_OFF') setCooldown(data.cooling_off_seconds ?? 60);
      if (data.action === 'INSTANT_TRANSFER') flash('Transfer sent.');
      await refresh();
    } catch {
      flash('Could not reach the bank service. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  const decideHold = async (action: 'APPROVE' | 'BLOCK') => {
    if (!result?.hold_id) return;
    setBusy(true);
    try {
      const r = await fetch(`/bank/holds/${result.hold_id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          actor: 'GUARDIAN',
          reason: action === 'BLOCK' ? 'Guardian confirmed scam' : 'Guardian verified with family',
        }),
      });
      const data: HoldActionResponse = await r.json();
      flash(data.message_en);
      setResult(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const resetDemo = async () => {
    await fetch('/bank/demo/reset', { method: 'POST' });
    setResult(null);
    setCallActive(false);
    setRiskScore(0);
    setCooldown(0);
    await refresh();
    flash('Demo reset.');
  };

  /** The headline demo: a scammer is on the line and pushing for Rs. 85,000. */
  const triggerTier3 = async () => {
    setCallActive(true);
    setRiskScore(96);
    setAmount('85000');
    await submitTransfer({ callActive: true, riskScore: 96, amount: 85000 });
  };

  return (
    <div className="space-y-5">
      {/* ---------------- Judge / tester controls ---------------- */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Simulation controls
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            — try it without a real phone call
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <button
              onClick={() => setCallActive((v) => !v)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                callActive
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {callActive ? <PhoneCall className="w-3.5 h-3.5" /> : <PhoneOff className="w-3.5 h-3.5" />}
              {callActive ? 'Call active' : 'No call'}
            </button>
          </div>

          <div className="lg:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Caller threat score: <span className="font-mono font-bold">{riskScore}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={riskScore}
              onChange={(e) => setRiskScore(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
              aria-label="Caller threat score"
            />
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={triggerTier3}
              className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              Trigger Tier 3 hold
            </button>
            <button
              onClick={() => decideHold('APPROVE')}
              disabled={!result?.hold_id}
              className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              Guardian approves
            </button>
            <button
              onClick={resetDemo}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Account card ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-5">
          <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 border border-slate-700/70 shadow-xl">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                  ShieldPay Current Account
                </p>
                <p className="text-sm font-semibold text-white mt-1">
                  {status?.holder_name ?? 'Tariq Mahmood'}
                </p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  {status?.account_number_masked ?? 'PK60HA••••••9482'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                Protected
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400">Available balance</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight whitespace-nowrap">
                  {fmtPKR(status?.available_balance ?? 248500)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 shrink-0">
                <Wifi className="w-3.5 h-3.5 rotate-90" />
                Raast / IBFT enabled
              </div>
            </div>

            {(status?.held_funds_total ?? 0) > 0 && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                <span className="flex items-center gap-2 text-[11px] font-bold text-amber-200">
                  <Lock className="w-3.5 h-3.5" />
                  Held safely in escrow
                </span>
                <span className="font-mono text-sm font-bold text-amber-100 whitespace-nowrap">
                  {fmtPKR(status!.held_funds_total)}
                </span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 to-amber-500 opacity-90" />
              <span className="font-mono text-sm tracking-[0.3em] text-slate-300">
                •••• 9482
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: Send, label: 'Send Money', primary: true, onClick: () => setSendOpen(true) },
              { icon: Receipt, label: 'Pay Bills' },
              { icon: PlusCircle, label: 'Deposit' },
              { icon: Users, label: 'Guardian' },
            ].map(({ icon: Icon, label, primary, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold cursor-pointer transition-colors ${
                  primary
                    ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>

          {/* Outcome of the last attempt */}
          {result?.action === 'GUARDIAN_HOLD' && (
            <LockdownScreen
              result={result}
              busy={busy}
              onViewDetails={() => setShowDetails(true)}
              onRequestRelease={() => decideHold('APPROVE')}
            />
          )}

          {result?.action === 'COOLING_OFF' && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <Clock className="w-4 h-4" />
                Take a moment {cooldown > 0 && <span className="font-mono">({cooldown}s)</span>}
              </div>
              <p className="mt-1.5 text-sm text-amber-900/80 dark:text-amber-200/80">
                {result.message_en}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1" dir="auto">
                {result.message_ur}
              </p>
              <button
                onClick={() => submitTransfer()}
                disabled={cooldown > 0 || busy}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                {cooldown > 0 ? `Please wait ${cooldown}s` : 'Send now'}
              </button>
            </div>
          )}

          {result?.action === 'STEP_UP_REQUIRED' && (
            <div className="rounded-2xl border border-orange-200 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/30 p-4">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 font-bold text-sm">
                <Fingerprint className="w-4 h-4" />
                Confirm it is really you
              </div>
              <p className="mt-1.5 text-sm text-orange-900/80 dark:text-orange-200/80">
                {result.message_en}
              </p>
              {result.hold_id && (
                <p className="mt-2 text-xs font-mono text-orange-700 dark:text-orange-400">
                  {fmtPKR(result.held_amount ?? 0)} held · released automatically after the pause
                </p>
              )}
            </div>
          )}

          {result?.action === 'INSTANT_TRANSFER' && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {result.message_en}
              </span>
            </div>
          )}

          {/* Recent activity */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Recent activity
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {RECENT.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.detail} · {t.when}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold whitespace-nowrap shrink-0 ${
                      t.credit
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t.credit ? '+' : '−'}
                    {fmtPKR(t.amount).replace('Rs. ', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------------- Right column: live protection state ---------------- */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Circuit-breaker
              </span>
              <span className={`flex items-center gap-1.5 text-xs font-bold ${meta.tone}`}>
                <span className={`w-2 h-2 rounded-full ${meta.dot} animate-pulse`} />
                Tier {tier} · {meta.label}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { t: 0, label: 'Normal transfers', range: '0–20' },
                { t: 1, label: 'Calm warning + 60s pause', range: '21–49' },
                { t: 2, label: 'Fingerprint + 15 min escrow', range: '50–74' },
                { t: 3, label: 'Funds held, guardian alerted', range: '75–100' },
              ].map((row) => (
                <div
                  key={row.t}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 border text-xs ${
                    tier === row.t
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="truncate">
                    Tier {row.t} · {row.label}
                  </span>
                  <span className="font-mono shrink-0">{row.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Trusted contact
            </span>
            <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {status?.guardian?.name ?? 'Ayesha'} ({status?.guardian?.relationship ?? 'Daughter'})
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Alerted on {status?.guardian?.channel ?? 'WhatsApp'} when funds are held
                </p>
              </div>
              {status?.active_holds ? (
                <button
                  onClick={() => decideHold('BLOCK')}
                  disabled={busy || !result?.hold_id}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  Block & return money
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">No alerts</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Send money modal ---------------- */}
      {sendOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white">Send money</h3>
              <button
                onClick={() => setSendOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Live call interlock */}
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border ${
                  callActive
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {callActive ? <PhoneCall className="w-3.5 h-3.5" /> : <PhoneOff className="w-3.5 h-3.5" />}
                {callActive
                  ? `Call in progress · threat ${riskScore}%`
                  : 'No call in progress'}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Recipient bank
                </label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                >
                  {BANKS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Account / IBAN
                </label>
                <input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Amount (PKR)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Purpose
                </label>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={() => submitTransfer()}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm cursor-pointer"
              >
                {busy ? 'Checking…' : 'Send'}
                {!busy && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Details modal ---------------- */}
      {showDetails && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-900 dark:text-white">Hold details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ['Reference', result.hold_id ?? '—'],
                ['Amount held', fmtPKR(result.held_amount ?? 0)],
                ['Tier', `${result.tier} (${TIER_META[result.tier].label})`],
                ['Caller threat score', `${result.risk_score}%`],
                ['Recipient', `${bank} · ${iban}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className="font-mono text-slate-900 dark:text-white text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  );
};
