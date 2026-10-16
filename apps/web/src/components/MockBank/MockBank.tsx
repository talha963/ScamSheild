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
  PhoneOff,
  ArrowRight,
  Shield,
  AlertOctagon,
  Users,
  Check,
  HelpCircle,
} from 'lucide-react';
import { RiskTier } from '../../types';

interface MockBankProps {
  currentTier?: RiskTier;
  activeCallId?: string;
  isCallActive?: boolean;
  onSimulateGuardianApproval?: () => void;
}

interface TransferItem {
  id: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  time: string;
  status: 'completed' | 'frozen_15min' | 'cancelled_saved' | 'released';
  reason?: string;
}

export const MockBank: React.FC<MockBankProps> = ({
  currentTier = 0,
  isCallActive = false,
  onSimulateGuardianApproval,
}) => {
  // Customer Account Balance (starts with Rs. 245,000)
  const [balance, setBalance] = useState<number>(245000);

  // Demo Simulation Mode (Customer / Commercial Presentation Controls)
  const [simulatedCallActive, setSimulatedCallActive] = useState<boolean>(true);
  const [isScammerDetected, setIsScammerDetected] = useState<boolean>(true);

  // Transfer Form State
  const [selectedRecipient, setSelectedRecipient] = useState<'scammer' | 'electric' | 'relative'>('scammer');
  const [transferAmount, setTransferAmount] = useState<string>('85000');
  const [transferPurpose, setTransferPurpose] = useState<string>('Urgent Security Clearance (Coerced)');

  // 15-Minute Safety Escrow State
  const [is15MinHoldActive, setIs15MinHoldActive] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(900); // 15:00 minutes (900 seconds)
  const [heldTransfer, setHeldTransfer] = useState<{
    id: string;
    amount: number;
    recipientName: string;
    accountNumber: string;
    bankName: string;
  } | null>(null);

  // Success Notification Banner
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [guardianNotified, setGuardianNotified] = useState<boolean>(false);

  // Transaction History Feed
  const [history, setHistory] = useState<TransferItem[]>([
    {
      id: 'TXN-9021',
      recipientName: 'K-Electric Bill Payment',
      bankName: 'Utility Collection',
      accountNumber: 'PK92KELEC0001928374',
      amount: 4820,
      time: 'Today, 10:14 AM',
      status: 'completed',
    },
    {
      id: 'TXN-8840',
      recipientName: 'Ayesha Tariq (Daughter)',
      bankName: 'Meezan Bank',
      accountNumber: 'PK12MEZN0004928104',
      amount: 15000,
      time: 'Yesterday, 4:30 PM',
      status: 'completed',
    },
  ]);

  // Live 15-Minute Countdown Timer
  useEffect(() => {
    if (!is15MinHoldActive || countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // 15 minutes expired: funds release to scammer
          handleHoldExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [is15MinHoldActive, countdownSeconds]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // User presses "Send Money" button
  const handleSendMoney = () => {
    const numAmount = parseFloat(transferAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const recipientDetails =
      selectedRecipient === 'scammer'
        ? {
            name: 'Ali Raza (Unverified Unknown Account)',
            bank: 'Private Mule Bank',
            account: 'PK44MBL00098472910',
          }
        : selectedRecipient === 'electric'
        ? {
            name: 'K-Electric Payment',
            bank: 'Utility Collection',
            account: 'PK92KELEC0001928374',
          }
        : {
            name: 'Ayesha Tariq (Daughter)',
            bank: 'Meezan Bank',
            account: 'PK12MEZN0004928104',
          };

    // COMMERCIAL LOGIC:
    // If ScamShield detects that the user is currently talking to a scammer (or high-risk call):
    if (simulatedCallActive && isScammerDetected) {
      // 1. Immediately freeze the transaction in 15-Minute Safety Escrow
      const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
      const holdData = {
        id: txnId,
        amount: numAmount,
        recipientName: recipientDetails.name,
        accountNumber: recipientDetails.account,
        bankName: recipientDetails.bank,
      };

      setHeldTransfer(holdData);
      setIs15MinHoldActive(true);
      setCountdownSeconds(900); // 15 minutes
      setGuardianNotified(false);
      setSavedNotification(null);

      // Add to transaction log as frozen
      setHistory([
        {
          id: txnId,
          recipientName: recipientDetails.name,
          bankName: recipientDetails.bank,
          accountNumber: recipientDetails.account,
          amount: numAmount,
          time: 'Just now',
          status: 'frozen_15min',
          reason: 'Frozen in 15-Minute Safety Escrow due to active scam call',
        },
        ...history,
      ]);

      // Notify the backend
      try {
        fetch('/bank/holds/create-15min', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: numAmount,
            payee_name: recipientDetails.name,
            payee_account: recipientDetails.account,
          }),
        }).catch(() => {});
      } catch (e) {}
    } else {
      // Normal safe transfer (No scam call detected)
      setBalance((prev) => Math.max(0, prev - numAmount));
      setHistory([
        {
          id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
          recipientName: recipientDetails.name,
          bankName: recipientDetails.bank,
          accountNumber: recipientDetails.account,
          amount: numAmount,
          time: 'Just now',
          status: 'completed',
        },
        ...history,
      ]);
      setSavedNotification(`Payment of Rs. ${numAmount.toLocaleString()} sent successfully.`);
      setTimeout(() => setSavedNotification(null), 4000);
    }
  };

  // CUSTOMER ACTION: "Cancel & Return Money to My Account (I Suspect a Scam!)"
  const handleCancelAndSaveMoney = () => {
    if (!heldTransfer) return;

    const savedAmount = heldTransfer.amount;

    // Update history
    setHistory((prev) =>
      prev.map((t) =>
        t.id === heldTransfer.id
          ? {
              ...t,
              status: 'cancelled_saved',
              reason: 'Cancelled by user during 15-minute protection pause • 100% Money Saved',
            }
          : t
      )
    );

    // Close the hold screen
    setIs15MinHoldActive(false);
    setHeldTransfer(null);
    setCountdownSeconds(900);

    // Show celebration reassurance badge
    setSavedNotification(
      `🎉 MONEY SAVED! Rs. ${savedAmount.toLocaleString()} was protected and returned to your balance. The scammer received nothing.`
    );

    // Backend resolution call
    try {
      fetch('/bank/step-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hold_id: heldTransfer.id,
          verification_method: 'cancel_by_user',
          authorized_by: 'Tariq Mahmood (Account Holder)',
        }),
      }).catch(() => {});
    } catch (e) {}
  };

  // What happens if 15 minutes expire without cancellation
  const handleHoldExpired = () => {
    if (!heldTransfer) return;
    setBalance((prev) => Math.max(0, prev - heldTransfer.amount));
    setHistory((prev) =>
      prev.map((t) =>
        t.id === heldTransfer.id
          ? {
              ...t,
              status: 'released',
              reason: '15-minute cooling-off expired without cancellation • Funds released',
            }
          : t
      )
    );
    setIs15MinHoldActive(false);
    setHeldTransfer(null);
  };

  // Notify Family Guardian
  const handleSendGuardianWhatsApp = () => {
    setGuardianNotified(true);
    if (onSimulateGuardianApproval) {
      onSimulateGuardianApproval();
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. SALES DEMO BAR: Easy client presentation controls                 */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Live Banking Security Mode
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                15-Min Safety Escrow
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Switch scenarios below to demonstrate how ScamShield stops victims from sending money to fraudsters:
            </p>
          </div>
        </div>

        {/* Demo Scenario Switcher */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSimulatedCallActive(false);
              setIsScammerDetected(false);
              setSelectedRecipient('electric');
              setTransferAmount('4820');
              setTransferPurpose('Electricity Bill Payment');
              setIs15MinHoldActive(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !simulatedCallActive
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            🟢 Normal Day (No Call)
          </button>

          <button
            onClick={() => {
              setSimulatedCallActive(true);
              setIsScammerDetected(true);
              setSelectedRecipient('scammer');
              setTransferAmount('85000');
              setTransferPurpose('Urgent Police / Bank Clearance');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              simulatedCallActive
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-50'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>🔴 Scammer on Call!</span>
          </button>
        </div>
      </div>

      {/* Money Saved Celebration Notification */}
      {savedNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <span>{savedNotification}</span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. MAIN BANKING INTERFACE (Modern Digital Consumer Banking)          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Mobile Bank Card & Payment Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Authentic Bank Account Card */}
          <div className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl overflow-hidden border border-slate-700/80">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Bank Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">Meezan Digital Bank</h3>
                  <span className="text-[10px] text-slate-300 uppercase tracking-widest block">
                    Islamic Savings Account
                  </span>
                </div>
              </div>

              {/* ScamShield Safe Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Protected by ScamShield</span>
              </div>
            </div>

            {/* Account Details & Balance */}
            <div className="mt-7 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Account Holder &amp; IBAN</span>
                <p className="text-base font-bold text-white mt-0.5">Tariq Mahmood</p>
                <p className="text-xs font-mono text-slate-300 mt-0.5">PK60 MEZN 0001 8492 0194 82</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block font-medium">Available Balance</span>
                <span className="text-3xl font-black font-mono tracking-tight text-white block mt-0.5">
                  Rs. {balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Transfer Form (Consumer Experience) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Send Money (Raast / Instant IBFT)
                </h4>
              </div>

              {/* Status Pill */}
              {simulatedCallActive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 animate-pulse">
                  <PhoneCall className="w-3 h-3" />
                  <span>Call in Progress with Unknown Caller</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                  <span>No Call in Progress</span>
                </span>
              )}
            </div>

            {/* Recipient Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Choose Payee Recipient
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipient('scammer');
                    setTransferAmount('85000');
                    setTransferPurpose('Urgent Security Clearance (Coerced)');
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedRecipient === 'scammer'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-slate-900 dark:text-white ring-2 ring-rose-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block truncate">Ali Raza</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-600 text-white">
                      NEW PAYEE
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Unknown Private Bank
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block mt-1">
                    ⚠️ Scammer on Phone
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipient('electric');
                    setTransferAmount('4820');
                    setTransferPurpose('K-Electric Monthly Bill');
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedRecipient === 'electric'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">K-Electric Bill</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Verified Utility Payee
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                    ✓ Safe Regular Payee
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipient('relative');
                    setTransferAmount('15000');
                    setTransferPurpose('Pocket Money');
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedRecipient === 'relative'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">Ayesha Tariq</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Daughter • Meezan Bank
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                    ✓ Family Contact
                  </span>
                </button>
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Amount to Send (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-sm font-bold font-mono text-slate-400">
                  Rs.
                </span>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-base font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="85000"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Daily transaction limit remaining: Rs. 400,000
              </p>
            </div>

            {/* Reason input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Purpose of Payment
              </label>
              <input
                type="text"
                value={transferPurpose}
                onChange={(e) => setTransferPurpose(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl py-2.5 px-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Warning when scammer call is active */}
            {simulatedCallActive && selectedRecipient === 'scammer' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">
                    ⚠️ ScamShield Protection Notice:
                  </strong>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    You are currently talking to an unknown caller. If this caller is ordering you to transfer funds or claiming to be the police/bank, 
                    <strong> ScamShield will automatically freeze your money for 15 minutes</strong> so it cannot be stolen.
                  </p>
                </div>
              </div>
            )}

            {/* Transfer Confirmation Button */}
            <button
              onClick={handleSendMoney}
              className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                simulatedCallActive && selectedRecipient === 'scammer'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Confirm &amp; Send Rs. {parseFloat(transferAmount || '0').toLocaleString()}</span>
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): 15-Minute Safety Escrow & Protection View */}
        <div className="lg:col-span-5 space-y-6">
          {/* THE 15-MINUTE SAFETY ESCROW CARD */}
          {is15MinHoldActive && heldTransfer ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500 dark:border-rose-600 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              {/* Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-950">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <Lock className="w-5 h-5 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    15-Minute Safety Freeze Active
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                  Funds Held Safe
                </span>
              </div>

              {/* Huge 15:00 Live Countdown Clock */}
              <div className="text-center py-2 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/60">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-widest block">
                  Time Remaining to Cancel Transfer:
                </span>
                <div className="text-4xl sm:text-5xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1 tracking-tight">
                  {formatTime(countdownSeconds)}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  15:00 Minute Safety Cooling-Off Period
                </span>
              </div>

              {/* Clear Bilingual Reassurance */}
              <div className="space-y-2 text-xs leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block font-bold">
                    🛡️ Your money has NOT been sent to the caller:
                  </strong>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                    ScamShield detected that you are talking to an unknown caller while attempting to send 
                    <strong className="text-rose-600 dark:text-rose-400 font-mono"> Rs. {heldTransfer.amount.toLocaleString()}</strong>. 
                    The transaction is safely paused in bank escrow for 15 minutes.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-right font-urdu" dir="rtl">
                  <strong className="text-slate-900 dark:text-white block font-bold">
                    آپ کے پیسے ابھی تک نہیں گئے:
                  </strong>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                    دھوکہ دہی کے خدشے کی وجہ سے آپ کے {heldTransfer.amount.toLocaleString()} روپے 15 منٹ کے لیے روک دیے گئے ہیں۔ اگر کال کرنے والا فراڈیا ہے تو نیچے دیے گئے بٹن سے کال کاٹیں اور رقم واپس منسوخ کریں۔
                  </p>
                </div>
              </div>

              {/* Held Payment Details */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Intended Payee:</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {heldTransfer.recipientName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Held Amount:</span>
                  <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                    Rs. {heldTransfer.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Bank Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Held in Safety Escrow
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS (The Real Value Proposition) */}
              <div className="space-y-2.5 pt-2">
                {/* 1. Cancel and Keep Money Safe (Hero Action) */}
                <button
                  onClick={handleCancelAndSaveMoney}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cancel Transfer &amp; Save My Money (Refund Now)</span>
                </button>

                {/* 2. Hang Up Call */}
                <button
                  onClick={() => {
                    setSimulatedCallActive(false);
                    setSavedNotification('Call disconnected. The caller cannot pressure you anymore.');
                    setTimeout(() => setSavedNotification(null), 3000);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>Hang Up on Caller (Stop Conversation)</span>
                </button>

                {/* 3. Notify Family Guardian */}
                <button
                  onClick={handleSendGuardianWhatsApp}
                  disabled={guardianNotified}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {guardianNotified
                      ? '✓ Emergency WhatsApp Sent to Guardian (Ayesha - Daughter)'
                      : 'Notify Family Guardian on WhatsApp'}
                  </span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center leading-tight">
                Important: If you do not cancel within 15 minutes, the bank assumes the payment was authentic and will release the funds. 
                Always cancel if the caller was demanding haste!
              </p>
            </div>
          ) : (
            /* Standby Card when no hold is active */
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center py-9 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  15-Minute Safety Escrow Standing By
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Your bank account is protected. If you ever receive a scam call pressuring you to send money, 
                  ScamShield will automatically freeze the transaction for 15 minutes to save your savings.
                </p>
              </div>
            </div>
          )}

          {/* Recent Account Activity Log */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Recent Transactions &amp; Safety Holds
            </h4>

            <div className="space-y-2.5">
              {history.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {t.recipientName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {t.bankName} • {t.time}
                    </span>
                    {t.reason && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                        {t.reason}
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900 dark:text-white block">
                      Rs. {t.amount.toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold block ${
                        t.status === 'frozen_15min'
                          ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                          : t.status === 'cancelled_saved'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.status === 'frozen_15min'
                        ? '🔒 15-Min Frozen'
                        : t.status === 'cancelled_saved'
                        ? '🛡️ Money Saved'
                        : 'Completed'}
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

export default MockBank;
