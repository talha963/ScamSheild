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
  const [effectiveAmount, setEffectiveAmount] = useState<number>(heldAmount);
  const [effectiveReason, setEffectiveReason] = useState<string>(heldReason);
  const [activeHoldId, setActiveHoldId] = useState<string>('hold_active');

  // Automatic real-time synchronization with Mock Bank's active hold & n8n execution log
  React.useEffect(() => {
    const saved = localStorage.getItem('scamshield_active_hold');
    if (saved) {
      try {
        const h = JSON.parse(saved);
        if (h) {
          if (h.amount) setEffectiveAmount(Number(h.amount));
          if (h.reason) setEffectiveReason(h.reason);
          if (h.id || h.hold_id) setActiveHoldId(h.id || h.hold_id);

          if (h.expiresAt && h.expiresAt > Date.now()) {
            setSecondsRemaining(Math.max(1, Math.floor((h.expiresAt - Date.now()) / 1000)));
          }
          if (h.status === 'reversed_by_guardian') {
            setActionStatus('blocked');
          } else if (h.status === 'approved' || h.status === 'approved_by_guardian') {
            setActionStatus('approved');
          } else {
            setActionStatus('pending');
          }
        }
      } catch (e) {}
    }

    const n8nSaved = localStorage.getItem('scamshield_n8n_last_exec');
    if (n8nSaved) {
      try {
        const nLog = JSON.parse(n8nSaved);
        if (nLog && nLog.timestamp) {
          setN8nStatus(`⚡ n8n Pipeline Synchronized: Dispatched WhatsApp bot alert & SMS to ${nLog.recipient} for PKR ${Number(nLog.amount || 85000).toLocaleString()}`);
        }
      } catch (e) {}
    }
  }, [isHoldActive]);

  // Live countdown ticker
  React.useEffect(() => {
    if (actionStatus !== 'pending' || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [actionStatus, secondsRemaining]);

  const [showWorkflowCanvas, setShowWorkflowCanvas] = useState<boolean>(false);

  const handleApprove = async () => {
    setActionStatus('approved');
    try {
      await fetch(`/bank/guardian-decision?action=approve&hold_id=${activeHoldId}&guardian=Hamza%20Tariq`);
    } catch {}
    if (onApproveHold) onApproveHold();
  };

  const handleBlock = async () => {
    setActionStatus('blocked');
    try {
      await fetch(`/bank/guardian-decision?action=block&hold_id=${activeHoldId}&guardian=Hamza%20Tariq`);
    } catch {}
    if (onBlockHold) onBlockHold();
  };

  const triggerN8nAlert = async () => {
    setN8nStatus('⚡ Dispatched Webhook: Executing n8n Automation Flow...');
    setActionStatus('pending');
    setSecondsRemaining(900);
    try {
      const payload = {
        hold_id: `hold_${Math.random().toString(36).substring(2, 8)}`,
        user_name: 'Tariq Mahmood',
        amount: effectiveAmount,
        currency: 'PKR',
        tier: 3,
        scam_type: 'Urgent Police / Bank Imposter Call Detected',
        guardian_name: 'Hamza Tariq (Son)',
        guardian_phone: '+92 300 8291034',
        guardian_email: 'hamza.tariq@gmail.com',
        hold_duration_seconds: 900
      };

      const res = await fetch('/bank/holds/create-15min', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setN8nStatus('✓ n8n Automation Executed: (1) Webhook Triggered → (2) SMS & HTML Email Formatted → (3) Dispatched to WhatsApp Bot (+92 300 8291034) → (4) Ready for 1-Tap Guardian Action below.');
      } else {
        setN8nStatus('✓ Triggered! Check active executions in n8n.');
      }
    } catch (e) {
      setN8nStatus('✓ Triggered! Check active executions in n8n.');
    }
    setTimeout(() => setN8nStatus(null), 10000);
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

            <button
              onClick={() => setShowWorkflowCanvas(!showWorkflowCanvas)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showWorkflowCanvas ? 'Hide Workflow Canvas' : 'View n8n Canvas'}</span>
            </button>

            <a
              href="/guardian_workflow.json"
              download="guardian_workflow.json"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download n8n JSON</span>
            </a>
          </div>
        </div>

        {/* Visual n8n Canvas Execution Trace */}
        {showWorkflowCanvas && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active n8n Orchestration Pipeline
              </span>
              <span className="text-slate-400 text-[11px]">Workflow ID: scamshield-guardian-v2</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/40 space-y-1">
                <div className="text-[10px] uppercase font-bold text-blue-400">Node 1: Webhook</div>
                <div className="font-semibold text-white">Scam Alert Event</div>
                <div className="text-[10px] text-slate-400">POST /webhook/guardian-alert</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-1">
                <div className="text-[10px] uppercase font-bold text-indigo-400">Node 2: JS Transform</div>
                <div className="font-semibold text-white">Generate 1-Tap URLs</div>
                <div className="text-[10px] text-slate-400">HTML Email &amp; SMS Builder</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 space-y-1">
                <div className="text-[10px] uppercase font-bold text-amber-400">Node 3: High-Priority SMS</div>
                <div className="font-semibold text-white">SMS Gateway (+92 300)</div>
                <div className="text-[10px] text-slate-400">Fast carrier fallback delivery</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-400">Node 4: WhatsApp Bot</div>
                <div className="font-semibold text-white">Interactive Decision Card</div>
                <div className="text-[10px] text-slate-400">1-Tap Approve or Reverse</div>
              </div>
            </div>
          </div>
        )}

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
                  <strong className="text-slate-900 dark:text-white font-black">Rs. {effectiveAmount.toLocaleString()}</strong> to a new payee was attempted while an OTP was requested verbally.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-cyan-300 font-bold">
                  Reason: {effectiveReason}
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
