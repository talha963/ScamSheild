import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';
import { BankAccount, BankPayee, BankTransaction, RiskTier } from '../../types';
import { MOCK_PAYEES } from '../../mockData/scenarios';

interface MockBankProps {
  currentTier: RiskTier;
  activeCallId?: string;
  isCallActive: boolean;
  onSimulateGuardianApproval?: () => void;
}

export const MockBank: React.FC<MockBankProps> = ({
  currentTier,
  activeCallId,
  isCallActive,
  onSimulateGuardianApproval,
}) => {
  const [account, setAccount] = useState<BankAccount>({
    account_id: 'acc_pk_9941',
    account_number: 'PK60HABB00018492019482',
    holder_name: 'Tariq Mahmood',
    balance: 245000,
    currency: 'PKR',
  });

  const [payees, setPayees] = useState<BankPayee[]>(MOCK_PAYEES);
  const [selectedPayee, setSelectedPayee] = useState<BankPayee>(MOCK_PAYEES[1]);
  const [amount, setAmount] = useState<string>('85000');
  const [transactions, setTransactions] = useState<BankTransaction[]>([
    {
      id: 'txn_001',
      amount: 4820,
      payee_name: 'K-Electric Bill Payment',
      payee_account: 'PK92KELEC0001928374',
      timestamp: 'Today, 10:14 AM',
      status: 'completed',
      circuit_breaker_tier: 0,
    },
  ]);

  const [activeHold, setActiveHold] = useState<BankTransaction | null>(null);
  const [coolOffSeconds, setCoolOffSeconds] = useState<number>(0);
  const [showOtpPrompt, setShowOtpPrompt] = useState<boolean>(false);
  const [enteredOtp, setEnteredOtp] = useState<string>('');

  // Handle cool-off countdown timer
  useEffect(() => {
    if (coolOffSeconds <= 0) return;
    const interval = setInterval(() => {
      setCoolOffSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [coolOffSeconds]);

  // Execute transfer button clicked
  const handleInitiateTransfer = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newTxn: BankTransaction = {
      id: `txn_${Date.now().toString().slice(-4)}`,
      amount: numAmount,
      payee_name: selectedPayee.name,
      payee_account: selectedPayee.account_number,
      timestamp: 'Just now',
      status: 'completed',
      circuit_breaker_tier: currentTier,
    };

    // Apply Circuit-Breaker Logic based on real-time Call-Transaction Correlation & Tier:
    if (currentTier === 3 || (isCallActive && selectedPayee.is_new && numAmount > 50000)) {
      // Tier 3: HARD HOLD
      newTxn.status = 'held';
      newTxn.hold_reason = 'ScamShield F5 Circuit-Breaker: Active unverified call + OTP request detected';
      setActiveHold(newTxn);
      setTransactions([newTxn, ...transactions]);
    } else if (currentTier === 2) {
      // Tier 2: 60-Second Cool-Off
      newTxn.status = 'cool_off';
      newTxn.hold_reason = 'High-risk emotional urgency detected on phone call. 60-second safety cool-off applied.';
      setCoolOffSeconds(60);
      setActiveHold(newTxn);
      setTransactions([newTxn, ...transactions]);
    } else if (currentTier === 1) {
      // Tier 1: Soft Warning + proceed
      newTxn.status = 'completed';
      setAccount((prev) => ({ ...prev, balance: prev.balance - numAmount }));
      setTransactions([newTxn, ...transactions]);
    } else {
      // Tier 0: Normal safe transfer
      newTxn.status = 'completed';
      setAccount((prev) => ({ ...prev, balance: prev.balance - numAmount }));
      setTransactions([newTxn, ...transactions]);
    }
  };

  // Guardian or manual release
  const handleReleaseHold = () => {
    if (!activeHold) return;
    setAccount((prev) => ({ ...prev, balance: prev.balance - activeHold.amount }));
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === activeHold.id ? { ...t, status: 'completed', hold_reason: 'Released after Guardian Step-Up Verification' } : t
      )
    );
    setActiveHold(null);
    setCoolOffSeconds(0);
  };

  const handleBlockTransfer = () => {
    if (!activeHold) return;
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === activeHold.id ? { ...t, status: 'blocked', hold_reason: 'Blocked by Guardian Circle • Case Logged' } : t
      )
    );
    setActiveHold(null);
    setCoolOffSeconds(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banking Correlation Telemetry Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">ShieldPay Instant Banking SDK</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-800">
                Core Banking API v1.4
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Correlated with live phone call events via Pub/Sub event bus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isCallActive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>ACTIVE CALL DETECTED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs">
              <span>No Active Call</span>
            </div>
          )}

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Friction Tier</span>
            <span className={`text-xs font-bold font-mono ${currentTier === 3 ? 'text-rose-400' : currentTier === 2 ? 'text-orange-400' : currentTier === 1 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              TIER {currentTier} {currentTier === 3 ? '(HARD STOP)' : currentTier === 2 ? '(COOL OFF)' : currentTier === 1 ? '(WARN)' : '(SILENT)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Bank Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Mobile Banking Interface */}
        <div className="lg:col-span-7 space-y-5">
          {/* Virtual Account Card */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950/80 border border-slate-700/80 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                  Primary Shield Account
                </span>
                <p className="text-sm font-semibold text-white mt-0.5">{account.holder_name}</p>
                <p className="text-xs font-mono text-slate-400 mt-1">{account.account_number}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Protected</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-400">Available Balance</span>
                <div className="text-3xl font-black font-mono text-white tracking-tight">
                  Rs. {account.balance.toLocaleString()}
                </div>
              </div>
              <span className="text-xs font-mono text-cyan-400">Raast / IBFT Enabled</span>
            </div>
          </div>

          {/* Transfer Form Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              Initiate Fast Payment / Raast Transfer
            </h3>

            {/* Select Payee */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                Select Payee Beneficiary
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {payees.map((p) => {
                  const isSelected = selectedPayee.payee_id === p.payee_id;
                  return (
                    <button
                      key={p.payee_id}
                      onClick={() => setSelectedPayee(p)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/60 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{p.bank_name}</div>
                      {p.is_new && (
                        <span className="mt-1 inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          NEW PAYEE • MULE RISK
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                Transfer Amount (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-mono text-slate-400">Rs.</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Enter amount..."
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Typical daily transfer average: Rs. 11,500. Attempted amount:{' '}
                <span className="text-cyan-400 font-mono">
                  {(parseFloat(amount || '0') / 11500).toFixed(1)}x normal history
                </span>
              </p>
            </div>

            {/* Tier 1 soft alert banner */}
            {currentTier === 1 && (
              <div className="p-3 rounded-xl bg-yellow-950/30 border border-yellow-500/40 flex items-start gap-2.5 text-xs text-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cautionary Advisory (Tier 1):</span>
                  <p className="text-[11px] text-yellow-300/90 mt-0.5">
                    Official banks will never call and ask you to transfer funds to a "secure safety account" or read out your OTP.
                  </p>
                </div>
              </div>
            )}

            {/* Transfer Action Button */}
            <button
              onClick={handleInitiateTransfer}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                currentTier === 3
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md font-extrabold'
              }`}
            >
              <Send className="w-4 h-4" />
              {currentTier === 3 ? 'Attempt Transfer (Test Circuit-Breaker)' : 'Confirm & Authorize Payment'}
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Circuit-Breaker State & Interventions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Circuit Breaker Status Inspector */}
          {activeHold ? (
            <div className={`p-5 rounded-2xl glass-panel border ${activeHold.status === 'held' ? 'border-rose-500/60 bg-rose-950/20 glow-rose' : 'border-orange-500/60 bg-orange-950/20 glow-amber'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Lock className={`w-5 h-5 ${activeHold.status === 'held' ? 'text-rose-400 animate-pulse' : 'text-orange-400'}`} />
                <h3 className={`text-sm font-black ${activeHold.status === 'held' ? 'text-rose-400' : 'text-orange-400'}`}>
                  {activeHold.status === 'held' ? 'TRANSACTION HARD HOLD (TIER 3)' : '60-SECOND SAFETY COOL-OFF (TIER 2)'}
                </h3>
              </div>

              <p className="text-xs text-slate-200 font-medium">
                {activeHold.hold_reason}
              </p>

              <div className="my-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Payee:</span>
                  <span className="text-white font-bold">{activeHold.payee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paused:</span>
                  <span className="text-rose-400 font-bold">Rs. {activeHold.amount.toLocaleString()}</span>
                </div>
                {activeHold.status === 'cool_off' && (
                  <div className="flex justify-between items-center text-orange-400 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Cool-off Remaining:
                    </span>
                    <span className="text-base font-black">{coolOffSeconds}s</span>
                  </div>
                )}
              </div>

              {/* Resolution Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleBlockTransfer}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <XCircle className="w-4 h-4" /> Confirm Scam • Block & Blacklist Payee
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReleaseHold}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Unlock className="w-3.5 h-3.5" /> User Override
                  </button>

                  {onSimulateGuardianApproval && (
                    <button
                      onClick={onSimulateGuardianApproval}
                      className="flex-1 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-cyan-500/40"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Guardian Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center py-8">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-white">Circuit-Breaker Standing By</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                No active hold on account. System is silently correlating call telemetry with payment orders.
              </p>
            </div>
          )}

          {/* Recent Ledger Audit */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
              Bank Transaction & Intervention Log
            </h4>
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{t.payee_name}</span>
                    <span className="text-[10px] text-slate-400">{t.timestamp}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white block">
                      Rs. {t.amount.toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold ${
                        t.status === 'held'
                          ? 'text-rose-400'
                          : t.status === 'cool_off'
                          ? 'text-orange-400'
                          : t.status === 'blocked'
                          ? 'text-red-500'
                          : 'text-emerald-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
