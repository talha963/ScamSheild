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
  Mail,
  MessageSquare,
  Edit3,
  Settings,
  ExternalLink,
  Eye,
  Smartphone,
  Sparkles,
  X,
  CheckCircle,
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
  status: 'completed' | 'frozen_15min' | 'cancelled_saved' | 'released' | 'reversed_by_guardian';
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

  // 15-Minute Safety Escrow State with LocalStorage & Background Persistence
  const [is15MinHoldActive, setIs15MinHoldActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scamshield_active_hold');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.expiresAt && parsed.expiresAt > Date.now()) {
            return true;
          }
        } catch (e) {}
      }
    }
    return false;
  });

  const [countdownSeconds, setCountdownSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scamshield_active_hold');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.expiresAt && parsed.expiresAt > Date.now()) {
            return Math.max(1, Math.floor((parsed.expiresAt - Date.now()) / 1000));
          }
        } catch (e) {}
      }
    }
    return 900;
  });

  const [heldTransfer, setHeldTransfer] = useState<{
    id: string;
    amount: number;
    recipientName: string;
    accountNumber: string;
    bankName: string;
    expiresAt?: number;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scamshield_active_hold');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.expiresAt && parsed.expiresAt > Date.now()) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return null;
  });

  // Success Notification Banner
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [guardianNotified, setGuardianNotified] = useState<boolean>(false);

  // Trusted Family Guardian Delegation (n8n Multi-Channel Alert: SMS + Email)
  const [guardianName, setGuardianName] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('scamshield_guardian_name')) || 'Hamza Tariq (Son)';
  });
  const [guardianPhone, setGuardianPhone] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('scamshield_guardian_phone')) || '+92 300 9876543';
  });
  const [guardianEmail, setGuardianEmail] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('scamshield_guardian_email')) || 'tk706051@gmail.com';
  });
  const [isEditingGuardian, setIsEditingGuardian] = useState<boolean>(false);

  const updateGuardianName = (val: string) => {
    setGuardianName(val);
    if (typeof window !== 'undefined') localStorage.setItem('scamshield_guardian_name', val);
  };
  const updateGuardianPhone = (val: string) => {
    setGuardianPhone(val);
    if (typeof window !== 'undefined') localStorage.setItem('scamshield_guardian_phone', val);
  };
  const updateGuardianEmail = (val: string) => {
    setGuardianEmail(val);
    if (typeof window !== 'undefined') localStorage.setItem('scamshield_guardian_email', val);
  };

  // Live Multi-Channel Gateway Settings & Preview State
  const [showGatewayModal, setShowGatewayModal] = useState<boolean>(false);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState<boolean>(false);
  const [smtpPreset, setSmtpPreset] = useState<'gmail' | 'outlook' | 'custom'>('gmail');
  const [gatewayConfig, setGatewayConfig] = useState<{
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    smtp_from?: string;
    smtp_password_configured?: boolean;
    twilio_sid?: string;
    twilio_token?: string;
    twilio_from?: string;
  }>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('scamshield_gateway_config');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return {
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_user: 'tk706051@gmail.com',
      smtp_password: '',
      smtp_from: '',
      smtp_password_configured: true,
      twilio_sid: '',
      twilio_token: '',
      twilio_from: '',
    };
  });

  const [testEmailStatus, setTestEmailStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [testSmsStatus, setTestSmsStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [lastDispatchedHold, setLastDispatchedHold] = useState<any>(null);

  // Load saved gateway settings on mount & check for existing active holds
  useEffect(() => {
    fetch('/bank/notifications/config')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setGatewayConfig(data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('scamshield_gateway_config', JSON.stringify(data));
          }
          if (data.smtp_host?.includes('outlook')) setSmtpPreset('outlook');
          else if (data.smtp_host?.includes('gmail')) setSmtpPreset('gmail');
          else setSmtpPreset('custom');

          if (data.smtp_user) {
            setGuardianEmail((prev) => {
              if (!prev || prev === 'hamza.tariq@gmail.com') {
                if (typeof window !== 'undefined') localStorage.setItem('scamshield_guardian_email', data.smtp_user);
                return data.smtp_user;
              }
              return prev;
            });
          }
        }
      })
      .catch(() => {});

    // Also check backend for any active hold on mount
    fetch('/bank/holds/active')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.has_hold && data.hold) {
          const h = data.hold;
          if (h.status === 'cooling_off_escrow') {
            setIs15MinHoldActive(true);
            setHeldTransfer({
              id: h.hold_id,
              amount: h.amount,
              recipientName: h.payee_name || 'Ali Raza (Unverified Account)',
              accountNumber: h.payee_account || 'PK44MBL00098472910',
              bankName: 'Private Mule Bank',
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  // Real-time poller: Automatically catches 1-Tap Decisions (Reversal or Approval) from Gmail or SMS links
  useEffect(() => {
    if (!is15MinHoldActive || !heldTransfer?.id) return;

    const currentHoldId = heldTransfer.id;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/bank/holds/active?hold_id=${encodeURIComponent(currentHoldId)}`);
        const data = await res.json();
        if (data && data.has_hold && data.hold) {
          // STRICT CHECK: The returned hold MUST match this specific transaction ID
          if (data.hold.hold_id !== currentHoldId) {
            return;
          }

          const status = data.hold.status;
          if (status === 'reversed_by_guardian') {
            // Guardian tapped Red "REVERSE & REFUND" button
            setIs15MinHoldActive(false);
            setHeldTransfer(null);
            setCountdownSeconds(900);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('scamshield_active_hold');
            }
            setSavedNotification(
              `🛡️ High-Risk Transfer REVERSED by Guardian via Gmail! PKR ${Number(data.hold.amount || 85000).toLocaleString()} 100% restored to your balance.`
            );
            setTimeout(() => setSavedNotification(null), 12000);
          } else if (status === 'released') {
            // Guardian tapped Green "Approve Legitimate Transfer" button
            setIs15MinHoldActive(false);
            setHeldTransfer(null);
            setCountdownSeconds(900);
            setBalance((prev) => Math.max(0, prev - (data.hold.amount || 85000)));
            if (typeof window !== 'undefined') {
              localStorage.removeItem('scamshield_active_hold');
            }
            setSavedNotification(
              `✅ Transfer APPROVED by Family Guardian via Gmail! PKR ${Number(data.hold.amount || 85000).toLocaleString()} released to payee.`
            );
            setTimeout(() => setSavedNotification(null), 12000);
          } else if (status === 'cancelled_by_user' || status === 'blocked') {
            setIs15MinHoldActive(false);
            setHeldTransfer(null);
            setCountdownSeconds(900);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('scamshield_active_hold');
            }
          }
        }
      } catch (e) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [is15MinHoldActive, heldTransfer?.id]);

  const handleSaveGatewayConfig = async () => {
    try {
      const cleanPassword = (gatewayConfig.smtp_password || '').trim().replace(/\s+/g, '');
      const cleanUser = (gatewayConfig.smtp_user || guardianEmail).trim();
      const payload = {
        ...gatewayConfig,
        smtp_user: cleanUser,
        smtp_password: cleanPassword,
      };

      const res = await fetch('/bank/notifications/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.config) {
        setGatewayConfig(data.config);
        if (typeof window !== 'undefined') {
          localStorage.setItem('scamshield_gateway_config', JSON.stringify(data.config));
        }
        setSavedNotification('✓ Email & SMS Gateway settings saved permanently.');
        setTimeout(() => setSavedNotification(null), 4000);
      }
    } catch (e) {}
  };

  const handleTestEmail = async () => {
    setTestEmailStatus({ loading: true });
    try {
      const cleanPassword = (gatewayConfig.smtp_password || '').trim().replace(/\s+/g, '');
      const cleanUser = (gatewayConfig.smtp_user || guardianEmail).trim();
      const targetEmail = (gatewayConfig.smtp_user || guardianEmail).trim();
      const payload = {
        ...gatewayConfig,
        smtp_host: gatewayConfig.smtp_host || 'smtp.gmail.com',
        smtp_port: gatewayConfig.smtp_port || 587,
        smtp_user: cleanUser,
        smtp_password: cleanPassword,
        email: targetEmail,
      };

      const res = await fetch('/bank/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setGatewayConfig((prev) => ({
          ...prev,
          smtp_user: cleanUser,
          smtp_password_configured: true,
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem('scamshield_gateway_config', JSON.stringify({
            ...gatewayConfig,
            smtp_user: cleanUser,
            smtp_password_configured: true,
          }));
        }
      }
      setTestEmailStatus({
        loading: false,
        success: data.success,
        message: data.success
          ? `✓ Rich HTML alert delivered to ${targetEmail}! Check your inbox now.`
          : `⚠️ ${data.message || data.error || 'Failed to deliver'}`,
      });
    } catch (err: any) {
      setTestEmailStatus({ loading: false, success: false, message: err.message });
    }
  };

  const handleTestSms = async () => {
    setTestSmsStatus({ loading: true });
    try {
      const res = await fetch('/bank/notifications/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: guardianPhone }),
      });
      const data = await res.json();
      setTestSmsStatus({
        loading: false,
        success: data.success,
        message: data.success
          ? `✓ SMS alert dispatched to ${guardianPhone}!`
          : `⚠️ ${data.message || data.error || 'Failed to dispatch SMS'}`,
      });
    } catch (err: any) {
      setTestSmsStatus({ loading: false, success: false, message: err.message });
    }
  };

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
      const expiresAt = Date.now() + 900 * 1000;
      const holdData = {
        id: txnId,
        amount: numAmount,
        recipientName: recipientDetails.name,
        accountNumber: recipientDetails.account,
        bankName: recipientDetails.bank,
        expiresAt,
      };

      setHeldTransfer(holdData);
      setIs15MinHoldActive(true);
      setCountdownSeconds(900); // 15 minutes
      setGuardianNotified(false);
      setSavedNotification(null);
      if (typeof window !== 'undefined') {
        localStorage.setItem('scamshield_active_hold', JSON.stringify(holdData));
      }

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

      // Notify the backend & dispatch to n8n and live email/SMS gateways
      fetch('/bank/holds/create-15min', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hold_id: txnId,
          amount: numAmount,
          payee_name: recipientDetails.name,
          payee_account: recipientDetails.account,
          guardian_name: guardianName,
          guardian_phone: guardianPhone,
          guardian_email: guardianEmail,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.hold_id) {
            setHeldTransfer((prev) => (prev ? { ...prev, id: data.hold_id } : prev));
            setLastDispatchedHold(data);
            if (typeof window !== 'undefined') {
              localStorage.setItem('scamshield_active_hold', JSON.stringify({ ...holdData, id: data.hold_id }));
            }
          }
        })
        .catch(() => {});
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

    if (typeof window !== 'undefined') {
      localStorage.removeItem('scamshield_active_hold');
    }

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

  // CUSTOMER / GUARDIAN ACTION: Family Member Clicks Reversal Link
  const handleSimulateFamilyReversal = async () => {
    if (!heldTransfer) return;
    const targetHoldId = heldTransfer.id;
    const savedAmount = heldTransfer.amount;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('scamshield_active_hold');
    }

    try {
      await fetch(`/bank/guardian-decision?action=block&hold_id=${targetHoldId}&guardian=${encodeURIComponent(guardianName)}`);
    } catch (e) {}

    setHistory((prev) =>
      prev.map((t) =>
        t.id === heldTransfer.id
          ? {
              ...t,
              status: 'reversed_by_guardian',
              reason: `Reversed by ${guardianName} via Emergency SMS / Email Reversal Link • 100% Money Saved`,
            }
          : t
      )
    );

    setIs15MinHoldActive(false);
    setHeldTransfer(null);
    setCountdownSeconds(900);
    setSavedNotification(`🛡️ Reversal Confirmed! 100% of Rs. ${savedAmount.toLocaleString()} was protected and refunded.`);
    setTimeout(() => setSavedNotification(null), 5000);
  };

  // What happens if 15 minutes expire without cancellation
  const handleHoldExpired = () => {
    if (!heldTransfer) return;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('scamshield_active_hold');
    }
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

            {/* Trusted Family Guardian Delegation (n8n Multi-Channel Alert: SMS + Email) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Trusted Family Safety Delegate
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Receives emergency SMS &amp; Email with 1-Tap Reversal
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowGatewayModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-[11px] font-bold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 flex items-center gap-1 cursor-pointer"
                    title="Configure SMTP & SMS gateways for live delivery"
                  >
                    <Settings className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                    <span>Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingGuardian(!isEditingGuardian)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingGuardian ? 'Done' : 'Edit'}</span>
                  </button>
                </div>
              </div>

              {isEditingGuardian ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => updateGuardianName(e.target.value)}
                      className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mobile for SMS</label>
                    <input
                      type="text"
                      value={guardianPhone}
                      onChange={(e) => updateGuardianPhone(e.target.value)}
                      className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email for Alert</label>
                    <input
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => updateGuardianEmail(e.target.value)}
                      className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold text-slate-900 dark:text-white">{guardianName}</span>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-500" />
                      {guardianPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-blue-500" />
                      {guardianEmail}
                    </span>
                  </div>
                </div>
              )}

              {/* Live Gateway Status Indicator */}
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                {gatewayConfig.smtp_password_configured ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Live SMTP Connected ({gatewayConfig.smtp_user || guardianEmail})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Demo Email Mode (Click Gateway to connect live Gmail inbox)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowGatewayModal(true)}
                  className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer text-[10px] flex items-center gap-0.5"
                >
                  <span>{gatewayConfig.smtp_password_configured ? 'Gateway Settings' : 'Configure'}</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

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

              {/* Multi-Channel Family Alert Status (n8n + Live SMTP/SMS Gateways) */}
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Emergency Alerts Dispatched to Family Guardian:</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    n8n + Gateways Live
                  </span>
                </div>

                <div className="space-y-2 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-blue-100 dark:border-blue-900 text-[11px]">
                  {/* SMS Channel */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>SMS to {guardianName}:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{guardianPhone}</span>
                      <a
                        href={`sms:${guardianPhone}?body=${encodeURIComponent(lastDispatchedHold?.sms_body || `🚨 ScamShield Alert: High risk transfer paused. Reverse here: https://flatbed-carve-imprint.ngrok-free.dev/webhook/guardian-decision?action=block&hold_id=${heldTransfer.id}`)}`}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold hover:bg-emerald-100 flex items-center gap-1"
                      >
                        <Smartphone className="w-2.5 h-2.5" />
                        <span>Open SMS</span>
                      </a>
                    </div>
                  </div>

                  {/* Email Channel */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Rich Email to:</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{guardianEmail}</span>
                      <a
                        href={`mailto:${guardianEmail}?subject=${encodeURIComponent(
                          `🚨 URGENT SCAMSHIELD ALERT: High-Risk Transfer Intercepted for Tariq Mahmood (PKR ${heldTransfer.amount.toLocaleString()})`
                        )}&body=${encodeURIComponent(
                          `🚨 SCAMSHIELD EMERGENCY FAMILY ALERT\n\nProtected Family Member: Tariq Mahmood\nAmount Held Safe in 15-Minute Escrow: PKR ${heldTransfer.amount.toLocaleString()}\nSuspicious Destination: Ali Raza (Unverified Mule Account)\nDetection Reason: Active unknown caller requesting OTP verbally\n\nIf this was a scam call, tap below to reverse and refund immediately:\nhttps://scam-sheild-six.vercel.app/?action=block&hold_id=${heldTransfer.id}\n\n(To approve if legitimate: https://scam-sheild-six.vercel.app/?action=approve&hold_id=${heldTransfer.id})`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                        title="Send actual email to inbox via your mail app"
                      >
                        <Mail className="w-2.5 h-2.5" />
                        <span>Send to Inbox</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowEmailPreviewModal(true)}
                        className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        <span>Preview HTML</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Status Confirmation */}
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Live Delivery Status:</span>
                    {lastDispatchedHold?.email_delivery?.success ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Delivered to Inbox ({guardianEmail})
                      </span>
                    ) : (
                      <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                        Alert Generated • Ready for 1-Tap Reversal
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Tap Family Reversal Simulation Button */}
                <button
                  type="button"
                  onClick={handleSimulateFamilyReversal}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 cursor-pointer transition-all transform hover:-translate-y-0.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>🛡️ Family Reversal: Tap to Cancel &amp; Refund 100%</span>
                </button>
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
                          : t.status === 'cancelled_saved' || t.status === 'reversed_by_guardian'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.status === 'frozen_15min'
                        ? '🔒 15-Min Frozen'
                        : t.status === 'reversed_by_guardian'
                        ? '🛡️ Reversed by Family'
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

      {/* ==================================================================== */}
      {/* 2. GATEWAY SETTINGS MODAL (Real SMTP & Twilio SMS Configuration)      */}
      {/* ==================================================================== */}
      {showGatewayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Live Email &amp; SMS Gateway Settings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sends emergency reversal alerts to the exact email &amp; phone you enter
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGatewayModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                Quick Email Provider Preset:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSmtpPreset('gmail');
                    setGatewayConfig({
                      ...gatewayConfig,
                      smtp_host: 'smtp.gmail.com',
                      smtp_port: 587,
                      smtp_user: gatewayConfig.smtp_user || guardianEmail,
                    });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                    smtpPreset === 'gmail'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Gmail (App Password)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSmtpPreset('outlook');
                    setGatewayConfig({
                      ...gatewayConfig,
                      smtp_host: 'smtp-mail.outlook.com',
                      smtp_port: 587,
                      smtp_user: gatewayConfig.smtp_user || guardianEmail,
                    });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                    smtpPreset === 'outlook'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Outlook / Office 365
                </button>
                <button
                  type="button"
                  onClick={() => setSmtpPreset('custom')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                    smtpPreset === 'custom'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Custom SMTP
                </button>
              </div>

              {gatewayConfig.smtp_password_configured ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <strong className="block font-bold">✓ Gateway Configured &amp; Active</strong>
                    <span>Live emergency email alerts will be dispatched using <strong>{gatewayConfig.smtp_user || 'your email'}</strong> to <strong>{guardianEmail}</strong>.</span>
                  </div>
                </div>
              ) : (
                smtpPreset === 'gmail' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    💡 <strong>Gmail Tip:</strong> Use your regular Gmail address and a 16-character <strong>Google App Password</strong> (generate at <em>Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords</em>).
                  </div>
                )
              )}
            </div>

            {/* SMTP Inputs */}
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Outgoing SMTP Mail Server
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={gatewayConfig.smtp_host || ''}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={gatewayConfig.smtp_port || 587}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, smtp_port: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Sender Email / Username
                  </label>
                  <input
                    type="email"
                    value={gatewayConfig.smtp_user || ''}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, smtp_user: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    App Password / Token
                  </label>
                  <input
                    type="password"
                    value={gatewayConfig.smtp_password || ''}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, smtp_password: e.target.value })}
                    placeholder={gatewayConfig.smtp_password_configured ? '•••••••••••••••• (Saved)' : '16-character app password'}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Test Email Button */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Verify Live Delivery to: <strong className="text-blue-500 font-mono">{gatewayConfig.smtp_user || guardianEmail}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testEmailStatus?.loading}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testEmailStatus?.loading ? 'Sending...' : 'Send Live Test Email'}</span>
                </button>
              </div>

              {testEmailStatus && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium border leading-relaxed ${
                    testEmailStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {testEmailStatus.message}
                </div>
              )}
            </div>

            {/* SMS Gateway (Twilio & Native SMS) */}
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. SMS Gateway (Optional Twilio API)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    value={gatewayConfig.twilio_sid || ''}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, twilio_sid: e.target.value })}
                    placeholder="AC..."
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Twilio Auth Token
                  </label>
                  <input
                    type="password"
                    value={gatewayConfig.twilio_token || ''}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, twilio_token: e.target.value })}
                    placeholder={gatewayConfig.twilio_token ? '••••••••' : 'Token'}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    From Phone #
                  </label>
                  <input
                    type="text"
                    value={gatewayConfig.twilio_from || ''}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, twilio_from: e.target.value })}
                    placeholder="+1234567890"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Target Mobile: <strong className="text-emerald-500 font-mono">{guardianPhone}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleTestSms}
                  disabled={testSmsStatus?.loading}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {testSmsStatus?.loading ? 'Sending SMS...' : 'Test SMS Gateway'}
                </button>
              </div>

              {testSmsStatus && (
                <div
                  className={`p-2 rounded-xl text-xs font-medium border ${
                    testSmsStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {testSmsStatus.message}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowGatewayModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveGatewayConfig();
                  setShowGatewayModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-cyan-600/30"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. EMAIL PREVIEW MODAL (Shows the exact HTML email sent to inbox)      */}
      {/* ==================================================================== */}
      {showEmailPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Live HTML Email Dispatched to: <span className="text-cyan-400 font-mono">{guardianEmail}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    High-impact responsive alert template with 1-Tap Reversal button
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/bank/notifications/preview/${heldTransfer?.id || 'sample'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Tab</span>
                </a>
                <button
                  onClick={() => setShowEmailPreviewModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Preview Iframe */}
            <div className="grow overflow-hidden rounded-2xl border border-slate-800 bg-[#030712]">
              <iframe
                title="Email Preview"
                srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 20px; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f9fafb; }
    .card { max-width: 540px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 5px 12px; background: rgba(225, 29, 72, 0.2); border: 1px solid #f43f5e; border-radius: 99px; color: #fda4af; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    h2 { margin: 12px 0 4px; font-size: 20px; font-weight: 900; color: #ffffff; }
    .alert-box { background: rgba(225, 29, 72, 0.1); border-left: 4px solid #f43f5e; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13px; line-height: 1.5; color: #fecdd3; }
    .amount { font-size: 26px; font-weight: 900; color: #38bdf8; margin: 8px 0; }
    .btn-reverse { display: block; background: #e11d48; color: #ffffff; text-decoration: none; padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 900; text-align: center; margin: 18px 0; box-shadow: 0 10px 20px rgba(225, 29, 72, 0.4); }
    .btn-approve { display: inline-block; background: #047857; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; }
    .urdu { margin-top: 18px; padding: 12px; background: rgba(16, 185, 129, 0.08); border: 1px dashed #059669; border-radius: 10px; text-align: right; direction: rtl; font-size: 13px; color: #6ee7b7; font-family: serif; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">🚨 Emergency Family Interception</span>
    <h2>ScamShield Live Defense Network</h2>
    <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 16px;">Automated Alert for <strong>${guardianName}</strong></p>
    
    <div class="alert-box">
      <strong>High-Risk Transfer Paused During Coerced Call!</strong><br>
      Your family member <strong>Tariq Mahmood</strong> attempted to transfer funds during a suspected scam call. ScamShield locked the money in a <strong>15-Minute Safety Escrow</strong>.
    </div>

    <div style="background: #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 18px; font-size: 12px;">
      <span style="color: #94a3b8; text-transform: uppercase; font-weight: 700; font-size: 10px;">Protected Account:</span><br>
      <strong style="color: #ffffff; font-size: 14px;">Tariq Mahmood (Pension Account)</strong>
      <div class="amount">PKR ${(heldTransfer?.amount || 85000).toLocaleString()} <span style="font-size: 12px; color: #34d399; font-weight: normal;">(100% Held Safe in Bank Escrow)</span></div>
      <span style="color: #94a3b8; text-transform: uppercase; font-weight: 700; font-size: 10px;">Suspicious Payee:</span><br>
      <strong style="color: #f87171; font-size: 13px;">${heldTransfer?.recipientName || 'Ali Raza (Unverified Mule Account)'}</strong>
    </div>

    <a href="https://scam-sheild-six.vercel.app/?action=block&hold_id=${heldTransfer?.id || 'hold_8f21'}" target="_blank" class="btn-reverse">
      🛡️ REVERSE TRANSACTION & REFUND MONEY NOW
    </a>
    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: -8px;">Tapping this button cancels the transfer immediately and restores funds to Tariq Mahmood's balance.</p>

    <div style="text-align: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid #1e293b;">
      <span style="font-size: 11px; color: #64748b;">Only if verified legitimate:</span><br>
      <a href="https://scam-sheild-six.vercel.app/?action=approve&hold_id=${heldTransfer?.id || 'hold_8f21'}" target="_blank" class="btn-approve" style="margin-top: 6px;">✓ Approve Transfer</a>
    </div>

    <div class="urdu">
      یہ رقم ابھی بھی بینک کے سیکیورٹی ایسکرو میں محفوظ ہے۔ فراڈیے کے اکاؤنٹ میں نہیں گئی۔ اگر یہ فراڈ ہے تو فوری اوپر دیے گئے ریورس بٹن سے رقم واپس کریں۔
    </div>
  </div>
</body>
</html>`}
                className="w-full h-[65vh] border-0"
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 shrink-0">
              <span>💡 When your family member taps the red button on their phone, the money refunds immediately.</span>
              <button
                type="button"
                onClick={() => {
                  setShowEmailPreviewModal(false);
                  handleSimulateFamilyReversal();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Simulate Tapping Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockBank;
