import React from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Heart,
  Radio,
  Eye,
  Smartphone,
  Users,
  Swords,
  MapPin,
  FileText,
  CheckCircle,
  Download,
} from 'lucide-react';
import { ActiveTab } from './Header';

interface FooterProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors duration-300">
      {/* Reassurance Ribbon for Normal Users */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">100% Private & Safe</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">We never record or save your calls or voices.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Protects Your Money</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Stops unauthorized transfers before funds leave.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Family Protection</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Sends instant WhatsApp alerts to protect parents.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Urdu Spoken Warnings</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Speaks calm warnings in Urdu, Punjabi & English.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                ScamShield <span className="text-blue-600 dark:text-blue-400">Live</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The everyday phone companion that helps families and elders stay safe from telephone fraudsters, fake bank calls, and stolen savings.
            </p>
            <div className="pt-2 text-xs text-slate-400 dark:text-slate-500">
              <span>Works with JazzCash, Easypaisa, Raast, and all major Pakistani banks.</span>
            </div>
            <div className="pt-1">
              <a
                href="./scamshield.apk"
                download="scamshield.apk"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Android APK</span>
              </a>
            </div>
          </div>

          {/* Quick Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Safety Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateTab('call-guard')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Phone Call Guardian</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('mock-bank')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Safe Bank Simulator</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('guardians')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Family WhatsApp Alerts</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('scam-lens')}
                  className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Fake Receipt Inspector</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Practice & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Practice & Awareness
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateTab('scam-gym')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Swords className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Practice Chat Game</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('scam-radar')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Common Scam Trends</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('evidence-pack')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Police & Bank Dispute Report</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Simple Safety Rules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Golden Safety Rules
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Never share 4-digit PINs or 6-digit OTP codes.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Banks will never threaten you with instant arrest.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Always verify with your family before sending money.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>
            &copy; 2026 <strong>ScamShield Live</strong>. Keeping everyday families safe from phone scams.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400">100% Free for Citizens</span>
            <span>•</span>
            <span className="text-slate-500 dark:text-slate-400">No Personal Data Stored</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
