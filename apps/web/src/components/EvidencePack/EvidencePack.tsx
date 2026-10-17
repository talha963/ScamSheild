import React from 'react';
import {
  FileText,
  Download,
  ShieldAlert,
  Printer,
  CheckCircle,
  Hash,
  Clock,
  Building,
  User,
  ShieldCheck,
} from 'lucide-react';
import { RiskEvent } from '../../types';

interface EvidencePackProps {
  riskEvent: RiskEvent | null;
  onDownloadPdf?: () => void;
}

export const EvidencePack: React.FC<EvidencePackProps> = ({
  riskEvent,
  onDownloadPdf,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Evidence Pack &amp; Fast Claim Dossier
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-cyan-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800">
              Regulatory Ready
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Automated forensic dispute report ready for Bank Fraud Complaints, FIA Cybercrime Wing filing &amp; Insurance claims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>

          <button
            onClick={() => {
              if (onDownloadPdf) onDownloadPdf();
              else handlePrint();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> Download Official Pack
          </button>
        </div>
      </div>

      {/* Formal Dossier Paper Container */}
      <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-xl text-slate-800 dark:text-slate-200 space-y-6">
        {/* Dossier Header */}
        <div className="border-b border-slate-200 dark:border-slate-700/80 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-widest font-black text-blue-600 dark:text-cyan-400">
                SCAMSHIELD LIVE • FORENSIC INCIDENT REPORT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40">
                HIGH THREAT PREVENTED
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
              Voice Social Engineering &amp; Fraud Dispute Dossier
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Incident Ref: CASE-PK-2026-8F21 • Generated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-500 dark:text-slate-400">
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Target Financial Institution</span>
            <span className="text-slate-900 dark:text-white font-bold">ShieldPay / HBL Network</span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Classified Playbook</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1 block">
              {riskEvent?.scam_type || 'Fake Bank Officer Impersonation'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Peak Threat Score</span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {riskEvent?.fused_score || 96} / 100 (Tier 3 Block)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Circuit-Breaker Outcome</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              Outgoing Transfer Intercepted
            </span>
          </div>
        </div>

        {/* Section 2: Caller & Call Telemetry */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
            1. Call &amp; Suspect Identification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Caller MSISDN</span>
              <span className="font-mono text-slate-900 dark:text-white font-bold">+92 301 9845120</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Claimed Entity</span>
              <span className="text-slate-900 dark:text-white font-bold">{riskEvent?.caller_claims_org || 'State Bank of Pakistan'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Spoof Likelihood</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">98% Suspected Spoof</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Acoustic Profile</span>
              <span className="text-slate-900 dark:text-white font-mono">Call Center Noise (0.72)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Redacted Key Transcript Evidence */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
            2. Redacted Forensic Speech Snippets (Privacy-Vault Redacted)
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 shadow-xs">
              <span className="text-blue-600 dark:text-cyan-400 font-bold block mb-1">[00:05] Impersonation &amp; Coercion:</span>
              "Assalam-o-Alaikum, main State Bank of Pakistan security department se baat kar raha hoon... aap ka account suspicious activity ki wajah se agle das minute mein block ho raha hai."
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-slate-800 dark:text-rose-200 shadow-xs">
              <span className="text-rose-600 dark:text-rose-400 font-bold block mb-1">[00:50] Credential Exfiltration Trigger:</span>
              "Aap ke phone par 6 digit OTP code aaya hai, foran parh kar batayein warna account freeze ho jayega!"
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1.5 font-sans italic">
                *Sensitive Data Protection Rule: Actual OTP code '[REDACTED_OTP]' masked prior to logging.
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Bank Action & Guardian Audit */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
            3. Banking Circuit-Breaker &amp; Guardian Audit Trail
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="font-medium text-slate-800 dark:text-slate-200">F5 Hard Hold Placed on Target Transfer:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">Rs. 85,000 -&gt; Muhammad Rizwan</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="font-medium text-slate-800 dark:text-slate-200">F6 Guardian Notification Dispatched:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Hamza Tariq (WhatsApp: Confirmed Delivered)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="font-medium text-slate-800 dark:text-slate-200">Cryptographic Audit Signature:</span>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                SHA256: 7f8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-normal flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p>
            Generated by ScamShield Live AI Guardian for financial institutions and certified law enforcement bodies. All audio was evaluated on an ephemeral stream without persisting raw voice recordings, in strict compliance with consumer data privacy regulations.
          </p>
        </div>
      </div>
    </div>
  );
};
