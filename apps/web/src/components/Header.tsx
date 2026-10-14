import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Radio,
  Smartphone,
  Eye,
  Swords,
  MapPin,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Home,
  CheckCircle2,
} from 'lucide-react';

export type ActiveTab =
  | 'home'
  | 'call-guard'
  | 'mock-bank'
  | 'scam-lens'
  | 'scam-gym'
  | 'scam-radar'
  | 'guardians'
  | 'evidence-pack'
  | 'evaluation';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  systemStatus: {
    connected: boolean;
    geminiModel: string;
    latencyMs: number;
    activeTier: 0 | 1 | 2 | 3;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const interactiveTools: { id: ActiveTab; name: string; desc: string; icon: React.ReactNode; badge: string }[] = [
    {
      id: 'call-guard',
      name: 'Live Call Guard',
      desc: 'Real-time audio streaming & voice-clone shield',
      icon: <Radio className="w-4 h-4 text-cyan-400" />,
      badge: 'F1-F3',
    },
    {
      id: 'mock-bank',
      name: 'ShieldPay Bank Simulator',
      desc: 'Graduated circuit-breaker & payment holds',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      badge: 'F4/F5',
    },
    {
      id: 'guardians',
      name: 'Guardian Circle WhatsApp',
      desc: 'Family proxy verification & emergency alert',
      icon: <Users className="w-4 h-4 text-cyan-400" />,
      badge: 'F6',
    },
    {
      id: 'scam-lens',
      name: 'Scam Lens (Computer Vision)',
      desc: 'Fake receipt & phishing screenshot inspector',
      icon: <Eye className="w-4 h-4 text-purple-400" />,
      badge: 'F9',
    },
    {
      id: 'scam-gym',
      name: 'Scam Gym (AI Sparring)',
      desc: 'Interactive scammer conversational sparring',
      icon: <Swords className="w-4 h-4 text-amber-400" />,
      badge: 'F12',
    },
    {
      id: 'scam-radar',
      name: 'Scam Radar Intelligence',
      desc: 'Vector syndicate clusters & threat map',
      icon: <MapPin className="w-4 h-4 text-cyan-400" />,
      badge: 'F10/F11',
    },
    {
      id: 'evidence-pack',
      name: 'Evidence Pack Generator',
      desc: '1-click forensic dossier for banks & police',
      icon: <FileText className="w-4 h-4 text-rose-400" />,
      badge: 'F13',
    },
    {
      id: 'evaluation',
      name: 'Evaluation & Benchmarks',
      desc: 'Measured metrics on 777 multi-dialect calls',
      icon: <BarChart3 className="w-4 h-4 text-emerald-400" />,
      badge: '§8',
    },
  ];

  const handleNavClick = (anchorId: string) => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#050811]/90 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Product Title */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-teal-500/30 border border-cyan-500/40 glow-cyan group-hover:scale-105 transition-all">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050811] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  ScamShield <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Live</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] uppercase font-black tracking-wider rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  BFSI 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-medium">
                Autonomous Voice Fraud Interlock & Banking Circuit-Breaker
              </p>
            </div>
          </div>

          {/* Desktop Clean Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <button
              onClick={() => handleNavClick('overview')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => handleNavClick('the-threat')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              The Crisis
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Circuit-Breaker
            </button>
            <button
              onClick={() => handleNavClick('technology')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Technology & AI
            </button>
            <button
              onClick={() => handleNavClick('gallery')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Visual Showcase
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              FAQ
            </button>

            {/* Interactive Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                onBlur={() => setTimeout(() => setToolsDropdownOpen(false), 200)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/50 hover:text-cyan-300 transition-all cursor-pointer text-slate-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Interactive Tools</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl bg-slate-950/95 border border-slate-800 backdrop-blur-2xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Interactive Modules & Simulators
                  </div>
                  {interactiveTools.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id);
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-900/90 transition-all flex items-start gap-3 cursor-pointer group"
                    >
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40">
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                            {t.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {t.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {t.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action & Status Indicator */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{systemStatus.geminiModel}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">{systemStatus.latencyMs}ms</span>
            </div>

            {activeTab === 'home' ? (
              <button
                onClick={() => setActiveTab('call-guard')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/60 cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <span>Launch Live Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('home')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Overview</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleNavClick('overview')}
                className="p-2.5 rounded-xl bg-slate-900/80 text-left text-slate-200"
              >
                Overview
              </button>
              <button
                onClick={() => handleNavClick('the-threat')}
                className="p-2.5 rounded-xl bg-slate-900/80 text-left text-slate-200"
              >
                The Crisis
              </button>
              <button
                onClick={() => handleNavClick('how-it-works')}
                className="p-2.5 rounded-xl bg-slate-900/80 text-left text-slate-200"
              >
                Circuit-Breaker
              </button>
              <button
                onClick={() => handleNavClick('technology')}
                className="p-2.5 rounded-xl bg-slate-900/80 text-left text-slate-200"
              >
                Technology & AI
              </button>
              <button
                onClick={() => handleNavClick('gallery')}
                className="p-2.5 rounded-xl bg-slate-900/80 text-left text-slate-200"
              >
                Visual Showcase
              </button>
              <button
                onClick={() => handleNavClick('faq')}
                className="p-2.5 rounded-xl bg-slate-900/80 text-left text-slate-200"
              >
                FAQ
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Launch Live Tools
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {interactiveTools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-xs text-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      {t.icon}
                      <span>{t.name}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400">
                      {t.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
