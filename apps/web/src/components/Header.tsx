import React, { useState } from 'react';
import {
  Shield,
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
  Sun,
  Moon,
  Volume2,
  PhoneCall,
  Landmark,
  Download,
  FileDown,
  Presentation,
  Workflow,
} from 'lucide-react';

export type ActiveTab =
  | 'home'
  | 'call-guard'
  | 'live-call-guard'
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
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [downloadsDropdownOpen, setDownloadsDropdownOpen] = useState(false);
  const [languageMode, setLanguageMode] = useState<'ur' | 'en'>('ur');

  // Interactive Safety Simulators
  const interactiveTools: { id: ActiveTab; name: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'live-call-guard',
      name: 'Mobile Live Call Guardian (Stealth)',
      desc: 'Secret background call listener & cut-call alert on mobile phone',
      icon: <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      color: 'emerald',
    },
    {
      id: 'call-guard',
      name: 'Scam Call Simulator (Role-Play)',
      desc: 'Act as a scammer & test real-time AI citizen responses',
      icon: <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      color: 'blue',
    },
    {
      id: 'mock-bank',
      name: 'Smart Banking Protection',
      desc: 'Graduated circuit-breaker holds the money during a scam call',
      icon: <Landmark className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
      color: 'cyan',
    },
    {
      id: 'guardians',
      name: 'Guardian Circle',
      desc: 'Family gets a WhatsApp alert and approves or blocks the transfer',
      icon: <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
      color: 'violet',
    },
    {
      id: 'scam-lens',
      name: 'Scam Lens',
      desc: 'Check a fake SMS, receipt or QR code for tampering',
      icon: <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      color: 'amber',
    },
    {
      id: 'scam-gym',
      name: 'Scam Gym',
      desc: 'Practise saying no to a scammer, safely',
      icon: <Swords className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      color: 'rose',
    },
    {
      id: 'scam-radar',
      name: 'Scam Radar',
      desc: 'Live map of scam campaigns across Pakistan',
      icon: <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      color: 'teal',
    },
    {
      id: 'evidence-pack',
      name: 'Evidence Pack',
      desc: 'One-click dossier for the bank and FIA Cybercrime',
      icon: <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
      color: 'slate',
    },
    {
      id: 'evaluation',
      name: 'Benchmark Results',
      desc: 'Measured accuracy, latency and per-language fairness',
      icon: <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      color: 'indigo',
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
    <header className="sticky top-3 z-50 w-full px-3 sm:px-6 max-w-7xl mx-auto transition-all duration-300">
      {/* Floating Island Creative Container */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-900/5 dark:shadow-black/30 px-3 sm:px-5 py-2 transition-all">
        <div className="flex items-center justify-between h-13 sm:h-15 gap-2">
          {/* Logo with Creative Animated Shield */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-emerald-500/10 to-blue-600/20 dark:from-blue-500/20 dark:to-emerald-500/20 border border-blue-200 dark:border-blue-700/60 group-hover:scale-105 transition-all duration-300 shadow-xs">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:rotate-6 transition-transform" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  ScamShield
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Live
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block mt-0.5">
                Phone &amp; Bank Escrow Guardian
              </span>
            </div>
          </div>

          {/* Desktop Creative Navigation Bar (Visible on lg+) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shrink-0">
            <button
              onClick={() => handleNavClick('overview')}
              className="px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              How It Helps
            </button>
            <button
              onClick={() => handleNavClick('the-problem')}
              className="px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Common Scams
            </button>
            <button
              onClick={() => handleNavClick('features')}
              className="px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Features
            </button>

            {/* Interactive Tools Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setToolsDropdownOpen(!toolsDropdownOpen);
                  setDownloadsDropdownOpen(false);
                }}
                onBlur={() => setTimeout(() => setToolsDropdownOpen(false), 220)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold transition-all cursor-pointer border border-blue-100 dark:border-blue-900/50 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Demos</span>
                <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Creative Dropdown Menu */}
              {toolsDropdownOpen && (
                <div className="absolute top-full right-0 mt-2.5 w-84 max-h-[75vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Interactive Safety Simulators
                  </div>
                  {interactiveTools.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id);
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-start gap-2.5 cursor-pointer group"
                    >
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 group-hover:scale-105 transition-transform">
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 block truncate">
                          {t.name}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {t.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Downloads Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setDownloadsDropdownOpen(!downloadsDropdownOpen);
                  setToolsDropdownOpen(false);
                }}
                onBlur={() => setTimeout(() => setDownloadsDropdownOpen(false), 220)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Downloads</span>
                <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${downloadsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {downloadsDropdownOpen && (
                <div className="absolute top-full right-0 mt-2.5 w-76 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Official Deliverables
                  </div>
                  <a
                    href="/scamshield.apk"
                    download="scamshield.apk"
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 group transition-all"
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block">
                        Android App (APK)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        11.8 MB &bull; Live Telephony Listener
                      </span>
                    </div>
                  </a>

                  <a
                    href="/CogniFlow_AI_Builder_Cup_Submission.pptx"
                    download="CogniFlow_AI_Builder_Cup_Submission.pptx"
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 group transition-all"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                      <Presentation className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 block">
                        Competition Pitch Deck
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        910 KB &bull; Official PPTX Presentation
                      </span>
                    </div>
                  </a>

                  <a
                    href="/guardian_workflow.json"
                    download="guardian_workflow.json"
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 group transition-all"
                  >
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 block">
                        n8n Automation Flow
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        21.3 KB &bull; Multi-Channel Alert Workflow
                      </span>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Island: Language + Dark Mode + Primary CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Bilingual Dialect Pill */}
            <button
              onClick={() => setLanguageMode(languageMode === 'ur' ? 'en' : 'ur')}
              title="Toggle Spoken Language: Urdu / English"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer whitespace-nowrap"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{languageMode === 'ur' ? 'اردو فعال' : 'EN Active'}</span>
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark Mode"
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group shadow-xs shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Launch Simulator Primary Button */}
            {activeTab === 'home' ? (
              <button
                onClick={() => setActiveTab('call-guard')}
                className="px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-all transform hover:-translate-y-0.5 shrink-0 whitespace-nowrap"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Try Simulator</span>
                <span className="sm:hidden">Simulate</span>
                <ArrowRight className="w-3 h-3 hidden sm:inline" />
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('home')}
                className="px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Home</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-3 mt-2 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleNavClick('overview')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
              >
                How It Helps
              </button>
              <button
                onClick={() => handleNavClick('the-problem')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
              >
                Common Scams
              </button>
              <button
                onClick={() => handleNavClick('how-it-works')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
              >
                3 Simple Steps
              </button>
              <button
                onClick={() => handleNavClick('features')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
              >
                Features
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-2">
                Try Demo Features
              </span>
              <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto">
                {interactiveTools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {t.icon}
                      <span className="font-medium truncate">{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Direct Download Links */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                Deliverables &amp; Downloads
              </span>
              <a
                href="/scamshield.apk"
                download="scamshield.apk"
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Download Android APK (11.8 MB)</span>
              </a>
              <a
                href="/CogniFlow_AI_Builder_Cup_Submission.pptx"
                download="CogniFlow_AI_Builder_Cup_Submission.pptx"
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <Presentation className="w-4 h-4" />
                <span>Download Submission PPTX (910 KB)</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
