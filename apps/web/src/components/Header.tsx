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
  const [languageMode, setLanguageMode] = useState<'ur' | 'en'>('ur');

  // Friendly everyday consumer descriptions
  const interactiveTools: { id: ActiveTab; name: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'call-guard',
      name: 'Phone Call Guardian',
      desc: 'Simulate a scam call & hear the live Urdu voice warning',
      icon: <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      color: 'blue',
    },
    {
      id: 'mock-bank',
      name: 'Safe Bank Simulator',
      desc: 'See how your money is locked before theft can happen',
      icon: <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      color: 'emerald',
    },
    {
      id: 'guardians',
      name: 'Family WhatsApp Alert',
      desc: 'See how sons & daughters protect their parents with 1 tap',
      icon: <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      color: 'indigo',
    },
    {
      id: 'scam-lens',
      name: 'Fake Receipt Checker',
      desc: 'Inspect suspicious JazzCash, Easypaisa, or bank slips',
      icon: <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      color: 'amber',
    },
    {
      id: 'scam-gym',
      name: 'Scam Practice Chat',
      desc: 'Practice chatting with a fake scammer safely to train',
      icon: <Swords className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      color: 'rose',
    },
    {
      id: 'scam-radar',
      name: 'Live Scam Trends',
      desc: 'See what tricks scammers are using across the country',
      icon: <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      color: 'teal',
    },
    {
      id: 'evidence-pack',
      name: 'Police & Bank Report',
      desc: '1-click official report to help recover scammed funds',
      icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      color: 'blue',
    },
    {
      id: 'evaluation',
      name: 'Safety Quality Test',
      desc: 'Tested on 700+ real calls with 94%+ safety accuracy',
      icon: <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      color: 'emerald',
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
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-900/5 dark:shadow-black/30 px-4 sm:px-6 py-2.5 transition-all">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo with Creative Animated Shield */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-emerald-500/10 to-blue-600/20 dark:from-blue-500/20 dark:to-emerald-500/20 border border-blue-200 dark:border-blue-700/60 group-hover:scale-105 transition-all duration-300 shadow-xs">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 group-hover:rotate-6 transition-transform" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  ScamShield
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block font-medium">
                Phone & Money Guardian
              </p>
            </div>
          </div>

          {/* Desktop Creative Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50">
            <button
              onClick={() => handleNavClick('overview')}
              className="px-3.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              How It Helps
            </button>
            <button
              onClick={() => handleNavClick('the-problem')}
              className="px-3.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              Common Scams
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="px-3.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              3 Simple Steps
            </button>
            <button
              onClick={() => handleNavClick('features')}
              className="px-3.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className="px-3.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              FAQ
            </button>

            {/* Interactive Tools Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                onBlur={() => setTimeout(() => setToolsDropdownOpen(false), 220)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold transition-all cursor-pointer border border-blue-100 dark:border-blue-900/50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Demos</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {/* Creative Dropdown Menu */}
              {toolsDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
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
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 block">
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
          </nav>

          {/* Right Action Island: Language + Dark Mode + Launch CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Creative Bilingual Dialect Pill */}
            <button
              onClick={() => setLanguageMode(languageMode === 'ur' ? 'en' : 'ur')}
              title="Toggle Spoken Language: Urdu / English"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{languageMode === 'ur' ? 'اردو فعال' : 'EN Active'}</span>
            </button>

            {/* Creative Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark Mode"
              className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group shadow-xs"
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
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Try Live Simulation</span>
                <span className="sm:hidden">Test Call</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('home')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Home</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleNavClick('overview')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600"
              >
                How It Helps
              </button>
              <button
                onClick={() => handleNavClick('the-problem')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600"
              >
                Common Scams
              </button>
              <button
                onClick={() => handleNavClick('how-it-works')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600"
              >
                3 Simple Steps
              </button>
              <button
                onClick={() => handleNavClick('features')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick('faq')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 hover:text-blue-600"
              >
                FAQ
              </button>
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-slate-700 dark:text-slate-200 flex items-center justify-between"
              >
                <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-2">
                Try Demo Features
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {interactiveTools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      {t.icon}
                      <span className="font-medium">{t.name}</span>
                    </div>
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
