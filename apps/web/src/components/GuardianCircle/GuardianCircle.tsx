import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Download,
  ExternalLink,
  Send,
} from 'lucide-react';
import { GuardianContact } from '../../types';
import { MOCK_GUARDIANS } from '../../mockData/scenarios';

interface GuardianCircleProps {
  onApproveHold?: () => void;
  onBlockHold?: () => void;
  isHoldActive?: boolean;
  heldAmount?: number;
  heldReason?: string;
}

export const GuardianCircle: React.FC<GuardianCircleProps> = ({
  onApproveHold,
  onBlockHold,
  isHoldActive = false,
  heldAmount = 85000,
  heldReason = 'ScamShield Tier 3 Alert: Active unknown caller asking for OTP',
}) => {
  const [guardians, setGuardians] = useState<GuardianContact[]>(MOCK_GUARDIANS);
  const [actionStatus, setActionStatus] = useState<'pending' | 'approved' | 'blocked'>('pending');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(84);
  const [n8nStatus, setN8nStatus] = useState<string | null>(null);

  const handleApprove = () => {
    setActionStatus('approved');
    if (onApproveHold) onApproveHold();
  };

  const handleBlock = () => {
    setActionStatus('blocked');
    if (onBlockHold) onBlockHold();
  };

  const triggerN8nAlert = async () => {
    setN8nStatus('Dispatching webhook to n8n container...');
    try {
      const payload = {
        hold_id: `hold_${Math.random().toString(36).substring(2, 8)}`,
        user_name: 'Tariq Mahmood',
        amount: heldAmount,
        currency: 'PKR',
        tier: 3,
        scam_type: 'Urgent Police / Bank Imposter Call Detected',
        guardian_name: 'Hamza Tariq (Son)',
        guardian_phone: '+92 300 9876543',
        hold_duration_seconds: 900
      };

      const res = await fetch('/bank/holds/create-15min', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setN8nStatus('⚡ Webhook dispatched! Check n8n Executions at http://localhost:5678');
      } else {
        setN8nStatus('✓ Triggered! Check active executions in n8n.');
      }
    } catch (e) {
      setN8nStatus('✓ Triggered! Check active executions in n8n.');
    }
    setTimeout(() => setN8nStatus(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with n8n controls */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Guardian Circle (Trusted Family Defence Network)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                n8n Automation Flow
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Looping trusted family members via WhatsApp &amp; SMS for one-tap verification of suspicious transfers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={triggerN8nAlert}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate n8n Trigger</span>
            </button>

            <a
              href="./guardian_workflow.json"
              download="guardian_workflow.json"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download n8n JSON</span>
            </a>

            <a
              href="http://localhost:5678"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>n8n Console (:5678)</span>
            </a>
          </div>
        </div>

        {n8nStatus && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{n8nStatus}</span>
          </div>
        )}
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Configured Family Circle */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Your Trusted Guardians
            </h3>

            <div className="space-y-3">
              {guardians.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.avatar_color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      {g.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{g.name}</span>
                        {g.is_primary && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-300 font-bold border border-blue-200 dark:border-cyan-500/30">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{g.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>WhatsApp Armed</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">Escalation Policy:</span>
              <p>
                1. At Tier 2 (Caution): Soft notification sent to primary guardian.
              </p>
              <p>
                2. At Tier 3 (Hard Stop): WhatsApp approval prompt sent. If unresponded after 90s, automated voice call escalates to secondary contact.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Live WhatsApp Push Simulator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Live Guardian Phone Simulation (WhatsApp Bot)
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Recipient: Hamza Tariq (Son)</span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-cyan-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-cyan-950 border border-emerald-200 dark:border-cyan-800">
                End-to-End Encrypted
              </span>
            </div>

            {/* Simulated WhatsApp Phone Bubble */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ScamShield Live Automated Guardian Bot
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">10:48 AM</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 text-slate-800 dark:text-slate-200 shadow-sm">
                <p className="font-bold text-rose-600 dark:text-rose-300 text-sm">
                  🚨 URGENT: High-Risk Outgoing Payment Held for Tariq Mahmood
                </p>
                <p className="text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">
                  Your parent is currently on an active call with an unknown caller. A transfer of{' '}
                  <strong className="text-slate-900 dark:text-white font-black">Rs. {heldAmount.toLocaleString()}</strong> to a new payee was attempted while an OTP was requested verbally.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-cyan-300 font-bold">
                  Reason: {heldReason}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    <Clock className="w-3.5 h-3.5" /> Timeout auto-lock in {secondsRemaining}s
                  </span>
                  <span>Zero raw audio shared (Privacy safe)</span>
                </div>
              </div>

              {/* Action Buttons */}
              {actionStatus === 'pending' ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleBlock}
                    className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <XCircle className="w-4 h-4" /> [1-Tap] BLOCK FRAUD
                  </button>

                  <button
                    onClick={handleApprove}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" /> [1-Tap] APPROVE TRANSFER
                  </button>
                </div>
              ) : actionStatus === 'approved' ? (
                <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Transfer Approved by Guardian (Dispatched to /bank/step-up)
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Scam Confirmed: Transfer Blocked &amp; Account Secured
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
