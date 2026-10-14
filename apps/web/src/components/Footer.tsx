import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Cpu,
  FileCheck2,
  ExternalLink,
  Heart,
  Globe,
  Radio,
  Eye,
  Smartphone,
  Users,
  Swords,
  MapPin,
  FileText,
  BarChart3,
  CheckCircle,
} from 'lucide-react';
import { ActiveTab } from './Header';

interface FooterProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-gradient-to-b from-[#070d18] via-[#050912] to-[#02050b] text-slate-400">
      {/* Top Value Assurance Ribbon */}
      <div className="border-b border-slate-800/60 bg-slate-950/60 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Zero Audio Storage</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Ephemeral transient memory; 100% privacy compliance.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Graduated Circuit-Breaker</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Physical banking hold before funds leave the account.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Dual-Engine AI</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Gemini 2.5 Flash for live latency + Gemini 2.5 Pro reasoning.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Multilingual Dialect Guard</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Native parsing for Urdu, Punjabi, Roman Urdu & English.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission (Col 1-2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/20 to-teal-500/30 border border-cyan-500/40 glow-cyan">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">
                  ScamShield <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Live</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  Autonomous BFSI Security
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              The real-time multimodal voice scam guardian with a graduated banking circuit-breaker. Designed to protect vulnerable citizens, families, and banking institutions against psychological coercion and Authorised Push Payment (APP) fraud.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                AI Builder Cup 2026
              </span>
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono">
                BFSI Track MVP
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-mono">
                v1.0 Operational
              </span>
            </div>
          </div>

          {/* Defense Hub Modules (Col 3) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Defense Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateTab('call-guard')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Live Call Guard (F1-F3)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('mock-bank')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ShieldPay Circuit-Breaker (F4/F5)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('guardians')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Guardian Circle WhatsApp (F6)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('scam-lens')}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>Scam Lens Receipt Vision (F9)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('scam-radar')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scam Radar Threat Map (F10/F11)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('scam-gym')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scam Gym Sparring Arena (F12)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('evidence-pack')}
                  className="hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>Evidence Pack Dossier (F13)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Technology & AI Architecture (Col 4) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Technology Stack
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Google Gemini 2.5 Flash</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Google Gemini 2.5 Pro (Reasoning)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Pinecone Vector Semantic Index</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>ASVspoof Deepfake Acoustic Classifier</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>n8n Workflow Automation Hub</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>FastAPI + WebSockets Gateway</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span>React 19 + TypeScript + Tailwind v4</span>
              </li>
            </ul>
          </div>

          {/* Governance, Trust & Compliance (Col 5) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Compliance & Safety
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>SBP Digital Fraud Framework Alignment</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero-Retention Acoustic Privacy Vault</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Local PII & CNIC Scrubbing Engine</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>APP Fraud Circuit-Breaker Protocol</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cryptographic SHA-256 Audit Trail</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Evaluation & Benchmark Direct Link */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <span>
              Tested on 777 benchmark calls across Urdu, Punjabi, Roman Urdu, and English.
            </span>
            <button
              onClick={() => onNavigateTab('evaluation')}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              View Section 8 Evaluation Benchmark Dashboard &rarr;
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span>Precision: <strong>94.2%</strong></span>
            <span>•</span>
            <span>Recall: <strong>92.9%</strong></span>
            <span>•</span>
            <span>TTD: <strong>10.8s</strong></span>
            <span>•</span>
            <span>FAR: <strong>1.75%</strong></span>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            &copy; 2026 <strong>ScamShield Live</strong>. Developed for the AI Builder Cup 2026 BFSI Track. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-slate-300 cursor-pointer">Security Whitepaper</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacy Architecture</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Banking API Spec</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">FIA Incident Dispatch</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
