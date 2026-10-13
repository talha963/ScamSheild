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

  const handleApprove = () => {
    setActionStatus('approved');
    if (onApproveHold) onApproveHold();
  };

  const handleBlock = () => {
    setActionStatus('blocked');
    if (onBlockHold) onBlockHold();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Feature F6 • Guardian Circle (Trusted Family Defence Network)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              n8n Automation Flow
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Looping trusted family members via WhatsApp & SMS for one-tap verification of suspicious transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            {guardians.length} Trusted Guardians Configured
          </span>
        </div>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Configured Family Circle */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Trusted Guardians
            </h3>

            <div className="space-y-3">
              {guardians.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.avatar_color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      {g.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{g.name}</span>
                        {g.is_primary && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-bold">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{g.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Armed</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-200">Escalation Policy:</span>
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
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Live Guardian Phone Simulation (WhatsApp Bot)
                  </h3>
                  <span className="text-[10px] text-slate-400">Recipient: Hamza Tariq (Son)</span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                End-to-End Encrypted
              </span>
            </div>

            {/* Simulated WhatsApp Phone Bubble */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between text-xs text-emerald-300">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ScamShield Live Automated Guardian Bot
                </span>
                <span className="font-mono text-slate-400">10:48 AM</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2.5 text-slate-200">
                <p className="font-semibold text-rose-300">
                  🚨 URGENT: High-Risk Outgoing Payment Held for Tariq Mahmood
                </p>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Your parent is currently on an active call with an unknown caller. A transfer of{' '}
                  <strong className="text-white">Rs. {heldAmount.toLocaleString()}</strong> to a new payee was attempted while an OTP was requested verbally.
                </p>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  Reason: {heldReason}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-amber-400">
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
                    className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <XCircle className="w-4 h-4" /> [1-Tap] BLOCK FRAUD
                  </button>

                  <button
                    onClick={handleApprove}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" /> [1-Tap] APPROVE TRANSFER
                  </button>
                </div>
              ) : actionStatus === 'approved' ? (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Transfer Approved by Guardian (Dispatched to /bank/step-up)
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500 text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Scam Confirmed: Transfer Blocked & Account Secured
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
